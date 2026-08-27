"use server";

import { revalidatePath } from "next/cache";

import {
	getCurrentUser,
	getPrimaryMembership,
	getPrimaryWorkspace,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
	canChangeRoles,
	canInvite,
	canManageMembers,
	generateInviteToken,
	hashInviteToken,
	isWorkspaceRole,
	parseInviteMemberForm,
	removeMemberSchema,
	parseUpdateMemberRoleForm,
	type UpdateMemberRoleInput,
} from "@/lib/settings/team";

export type TeamActionResult =
	| { status: "success" }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "forbidden" }
	| { status: "invalid"; message: string }
	| { status: "error"; message: string };

const GENERIC_ERROR = "No se pudo completar la operación. Inténtalo de nuevo.";

function invalidateShell() {
	revalidatePath("/", "layout");
}

async function requireManager(): Promise<
	{ ok: true; workspaceId: string; role: string } | { ok: false; result: TeamActionResult }
> {
	if (!(await getCurrentUser())) {
		return { ok: false, result: { status: "not_authenticated" } };
	}
	const membership = await getPrimaryMembership();
	const workspace = await getPrimaryWorkspace();
	if (!membership || !workspace) {
		return { ok: false, result: { status: "no_workspace" } };
	}
	if (!isWorkspaceRole(membership.role)) {
		return { ok: false, result: { status: "no_workspace" } };
	}
	if (!canManageMembers(membership.role)) {
		return { ok: false, result: { status: "forbidden" } };
	}
	return { ok: true, workspaceId: workspace.id, role: membership.role };
}

// ---------------------------------------------------------------
// INVITAR
// ---------------------------------------------------------------

export type CreateInviteResult =
	| {
			status: "success";
			token: string;
			email: string;
			expiresAt: string;
	  }
	| Exclude<TeamActionResult, { status: "success" }>;

/**
 * El token crudo SOLO se devuelve aquí, una única vez, al administrador
 * autorizado. En la base de datos se persiste únicamente SHA-256.
 * Workspace/invited_by/expiración/rol: resueltos o validados en servidor
 * (getPrimaryWorkspace + trigger prepare_workspace_invitation).
 */
export async function createInviteAction(
	values: unknown,
): Promise<CreateInviteResult> {
	const parsed = parseInviteMemberForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Email o rol inválido." };
	}

	const guard = await requireManager();
	if (!guard.ok) return guard.result as Exclude<TeamActionResult, { status: "success" }>;

	// Jerarquía server-side: admin solo puede invitar member.
	if (!canInvite(isWorkspaceRole(guard.role) ? guard.role : "member", parsed.data.role)) {
		return { status: "forbidden" };
	}

	const token = generateInviteToken();
	const tokenHash = await hashInviteToken(token);

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("workspace_invitations")
		.insert({
			workspace_id: guard.workspaceId,
			email: parsed.data.email,
			role: parsed.data.role,
			token_hash: tokenHash,
		})
		.select("expires_at")
		.single();

	if (error) {
		console.error("invitation insert failed:", error.code, error.message);
		if (error.code === "23505") {
			return {
				status: "invalid",
				message: "Ya existe una invitación pendiente para ese email.",
			};
		}
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return {
		status: "success",
		token,
		email: parsed.data.email,
		expiresAt: data?.expires_at ?? "",
	};
}

// ---------------------------------------------------------------
// REVOCAR
// ---------------------------------------------------------------

export async function revokeInviteAction(
	inviteId: string,
): Promise<TeamActionResult> {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inviteId)) {
		return { status: "invalid", message: "Invitación inválida." };
	}
	const guard = await requireManager();
	if (!guard.ok) return guard.result;

	const supabase = await createClient();
	const { error } = await supabase
		.from("workspace_invitations")
		.update({ status: "revoked" })
		.eq("id", inviteId)
		.eq("workspace_id", guard.workspaceId)
		.eq("status", "pending");

	if (error) {
		console.error("revoke failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return { status: "success" };
}

// ---------------------------------------------------------------
// CAMBIAR ROL  —  owner exclusivamente (RLS + acción concuerdan)
// ---------------------------------------------------------------

export async function updateMemberRoleAction(
	values: UpdateMemberRoleInput,
): Promise<TeamActionResult> {
	const parsed = parseUpdateMemberRoleForm(values);
	if (!parsed.ok) {
		return { status: "forbidden" }; // payload con rol no asignable → jamás ejecutar
	}
	const guard = await requireManager();
	if (!guard.ok) return guard.result;
	if (!canChangeRoles(isWorkspaceRole(guard.role) ? guard.role : "member")) {
		return { status: "forbidden" };
	}

	const supabase = await createClient();
	const { error } = await supabase
		.from("workspace_members")
		.update({ role: parsed.data.role })
		.eq("workspace_id", guard.workspaceId)
		.eq("user_id", parsed.data.userId);

	if (error) {
		console.error("role update failed:", error.code, error.message);
		if (error.message.includes("cf_last_owner_protected")) {
			return {
				status: "invalid",
				message: "No puedes degradar al último propietario del workspace.",
			};
		}
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return { status: "success" };
}

// ---------------------------------------------------------------
// ELIMINAR MIEMBRO — solo owner vía RLS; trigger protege último owner
// ---------------------------------------------------------------

export async function removeMemberAction(
	rawUserId: unknown,
): Promise<TeamActionResult> {
	const parsed = removeMemberSchema.safeParse({ userId: rawUserId });
	if (!parsed.success) {
		return { status: "invalid", message: "Miembro inválido." };
	}
	const guard = await requireManager();
	if (!guard.ok) return guard.result;
	if (!canChangeRoles(isWorkspaceRole(guard.role) ? guard.role : "member")) {
		return { status: "forbidden" };
	}

	const supabase = await createClient();
	const { error } = await supabase
		.from("workspace_members")
		.delete()
		.eq("workspace_id", guard.workspaceId)
		.eq("user_id", parsed.data.userId);

	if (error) {
		console.error("member delete failed:", error.code, error.message);
		if (error.message.includes("cf_last_owner_protected")) {
			return {
				status: "invalid",
				message: "No puedes eliminar al último propietario.",
			};
		}
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return { status: "success" };
}

// ---------------------------------------------------------------
// ACEPTAR INVITACIÓN — delega TODO a la RPC SECURITY DEFINER atómica.
// El token es el único secreto necesario; email/workspace/rol los fija
// la propia invitación verificada dentro de la función SQL.
// ---------------------------------------------------------------

export type AcceptInviteResult =
	| { status: "success"; workspaceName: string }
	| { status: "not_authenticated" }
	| { status: "invalid_token" }
	| { status: "email_mismatch" }
	| { status: "already_in_workspace" }
	| { status: "expired" }
	| { status: "error"; message: string };

export async function acceptInviteAction(
	rawToken: unknown,
): Promise<AcceptInviteResult> {
	if (typeof rawToken !== "string" || !/^[A-Za-z0-9_-]{40,50}$/.test(rawToken)) {
		return { status: "invalid_token" };
	}
	if (!(await getCurrentUser())) return { status: "not_authenticated" };

	const supabase = await createClient();

	// Nombre del workspace tras aceptar (antes de mutar nada visible).
	const rpc = supabase.rpc("accept_workspace_invitation", { p_token: rawToken });
	const { data: workspaceId, error } = await rpc;

	if (error || typeof workspaceId !== "string") {
		console.error("accept failed:", error?.code, error?.message);
		const msg = error?.message ?? "";
		if (msg.startsWith("cf_email_mismatch")) return { status: "email_mismatch" };
		if (msg.startsWith("cf_user_already_in_workspace"))
			return { status: "already_in_workspace" };
		if (msg.startsWith("cf_invitation_expired")) return { status: "expired" };
		if (msg.startsWith("cf_")) return { status: "invalid_token" };
		return { status: "error", message: GENERIC_ERROR };
	}

	const { data: ws } = await supabase
		.from("workspaces")
		.select("name")
		.eq("id", workspaceId)
		.maybeSingle();

	revalidatePath("/", "layout");
	return {
		status: "success",
		workspaceName: ws && typeof ws === "object" ? (ws.name as string) : "",
	};
}