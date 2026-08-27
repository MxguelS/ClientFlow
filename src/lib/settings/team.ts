import { z } from "zod";

/**
 * Roles REALES del schema: 'owner' | 'admin' | 'member'
 * (CHECK de workspace_members.role).
 */
export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Roles asignables mediante invitación. El owner NUNCA se invita. */
export const INVITABLE_ROLES = ["admin", "member"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
	owner: "Propietario",
	admin: "Administrador",
	member: "Miembro",
};

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
	return (
		typeof value === "string" &&
		(WORKSPACE_ROLES as readonly string[]).includes(value)
	);
}

export function isInvitableRole(value: unknown): value is InvitableRole {
	return (
		typeof value === "string" &&
		(INVITABLE_ROLES as readonly string[]).includes(value)
	);
}

/**
 * Matriz de permisos del modelo mínimo correcto:
 *   owner  → puede invitar admin | member, gestionar miembros
 *   admin  → puede invitar member, gestionar miembros no-owner
 *   member → sin administración
 *
 * La autoridad final vive en RLS/triggers; esto solo guía la UI y las
 * comprobaciones tempranas en Server Actions.
 */
export function canInvite(
	actorRole: WorkspaceRole,
	targetRole: InvitableRole,
): boolean {
	if (actorRole === "owner") return true;
	if (actorRole === "admin") return targetRole === "member";
	return false;
}

export function canManageMembers(actorRole: WorkspaceRole): boolean {
	return actorRole === "owner" || actorRole === "admin";
}

export function canChangeRoles(actorRole: WorkspaceRole): boolean {
	// RLS histórico exige owner para UPDATE sobre workspace_members.
	return actorRole === "owner";
}

// ---------------------------------------------------------------
// Email normalizado — idéntico a la normalización del trigger SQL:
// lower(btrim(email))
// ---------------------------------------------------------------

export function normalizeEmail(raw: string): string {
	return raw.trim().toLowerCase();
}

export const inviteMemberSchema = z.object({
	// Normaliza primero (trim/lowercase) y DESPUÉS valida formato sobre el
	// valor real que se persistirá — paridad exacta con el trigger SQL.
	email: z
		.string()
		.min(1, "El email es obligatorio")
		.max(254, "El email es demasiado largo")
		.transform(normalizeEmail)
		.pipe(z.email("Introduce un email válido")),
	role: z.enum(INVITABLE_ROLES),
});

export type InviteMemberInput = z.input<typeof inviteMemberSchema>;
export type InviteMemberData = z.output<typeof inviteMemberSchema>;

export function parseInviteMemberForm(input: unknown):
	| { ok: true; data: InviteMemberData }
	| { ok: false } {
	const result = inviteMemberSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}

// ---------------------------------------------------------------
// Cambio de rol / expulsión (payloads mínimos; workspace SIEMPRE se
// resuelve server-side desde la sesión, nunca llega del cliente)
// ---------------------------------------------------------------

const uuidField = z.string().uuid();

export const updateMemberRoleSchema = z.object({
	userId: uuidField,
	role: z.enum(["admin", "member"]), // owner no asignable por este flujo
});

export type UpdateMemberRoleInput = z.input<typeof updateMemberRoleSchema>;

export function parseUpdateMemberRoleForm(input: unknown):
	| { ok: true; data: z.output<typeof updateMemberRoleSchema> }
	| { ok: false } {
	const result = updateMemberRoleSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}

export const removeMemberSchema = z.object({
	userId: uuidField,
});

export function parseRemoveMemberForm(input: unknown): { ok: true } | { ok: false } {
	return removeMemberSchema.safeParse(input).success ? { ok: true } : { ok: false };
}

// ---------------------------------------------------------------
// Tokens de invitación: 256 bits aleatorios, URL-safe.
// En DB solo se guarda SHA-256 hex. Utilidades puras testables.
// ---------------------------------------------------------------

const TOKEN_BYTES = 32;

const B64URL_ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Base64url sin padding sobre los bytes exactos provistos. */
function toBase64Url(bytes: Uint8Array): string {
	let output = "";
	for (let i = 0; i < bytes.length; i += 3) {
		const b1 = bytes[i]!;
		const b2 = bytes[i + 1];
		const b3 = bytes[i + 2];
		output += B64URL_ALPHABET[b1 >> 2]!;
		if (b2 === undefined) {
			output += `${B64URL_ALPHABET[(b1 & 3) << 4]}==`;
			break;
		}
		output += B64URL_ALPHABET[((b1 & 3) << 4) | (b2 >> 4)]!;
		if (b3 === undefined) {
			output += `${B64URL_ALPHABET[(b2 & 15) << 2]}=`;
			break;
		}
		output +=
			B64URL_ALPHABET[((b2 & 15) << 2) | (b3 >> 6)]! +
			B64URL_ALPHABET[b3 & 63]!;
	}
	return output.replace(/=+$/, "");
}

export function generateInviteToken(randomBytes?: Uint8Array): string {
	const bytes =
		randomBytes ??
		crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));

	if (bytes.length !== TOKEN_BYTES) {
		throw new Error("token entropy mismatch");
	}
	return toBase64Url(bytes);
}

/** Determinista y compatible con extensions.digest(token,'sha256') de la RPC. */
export async function hashInviteToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return [...new Uint8Array(digest)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}