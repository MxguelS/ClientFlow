"use server";

import { revalidatePath } from "next/cache";

import {
	parseProfileSettings,
	parseWorkspaceSettings,
} from "@/lib/settings/validation";
import {
	getCurrentUser,
	getPrimaryMembership,
	getPrimaryWorkspace,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionResult =
	| { status: "success" }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "forbidden" }
	| { status: "invalid"; message: string }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo guardar. Inténtalo de nuevo.";

function invalidateShell() {
	// El nombre aparece en sidebar, user-area, dashboard y settings:
	// invalidar todo el árbol del shell mantiene una única fuente de verdad.
	revalidatePath("/", "layout");
}

/**
 * Actualiza el perfil del usuario AUTENTICADO.
 * El id nunca proviene del cliente: auth.uid() manda y RLS
 * (profiles_update_own / profiles_insert_own) es la autoridad final.
 *
 * Se usa upsert porque la fila de profile puede no existir aún
 * (usuarios creados fuera del flujo register). Con onConflict(id),
 * si la fila existe se actualiza bajo profiles_update_own y si no,
 * se inserta bajo profiles_insert_own — ambos exigen id = auth.uid(),
 * por lo que un usuario jamás puede escribir el perfil de otro.
 */
export async function updateProfileAction(
	values: unknown,
): Promise<SettingsActionResult> {
	const parsed = parseProfileSettings(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "El nombre es obligatorio (máx. 100 caracteres)." };
	}

	const user = await getCurrentUser();
	if (!user) return { status: "not_authenticated" };

	const supabase = await createClient();
	const { error } = await supabase
		.from("profiles")
		.upsert(
			{ id: user.id, full_name: parsed.data.fullName },
			{ onConflict: "id" },
		);

	if (error) {
		console.error("profile upsert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return { status: "success" };
}

/**
 * Actualiza el nombre del workspace ACTIVO (resuelto server-side).
 * Autoridad real: RLS workspaces_update_admin exige role owner/admin,
 * por lo que un member recibe aquí forbidden aunque la UI no se lo
 * permitiera. Nunca se acepta un workspace_id del cliente.
 */
export async function updateWorkspaceAction(
	values: unknown,
): Promise<SettingsActionResult> {
	const parsed = parseWorkspaceSettings(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "El nombre del workspace es obligatorio (máx. 100 caracteres)." };
	}

	const user = await getCurrentUser();
	if (!user) return { status: "not_authenticated" };

	const membership = await getPrimaryMembership();
	const workspace = await getPrimaryWorkspace();
	if (!membership || !workspace) return { status: "no_workspace" };

	// Comprobación temprana honesta; la última palabra la tiene RLS.
	if (membership.role !== "owner" && membership.role !== "admin") {
		return { status: "forbidden" };
	}

	const supabase = await createClient();

	// Con .select() el UPDATE fallará si USING oculta la fila para este
	// usuario: segunda capa que bloquea workspaces ajenos vía API directa.
	const { error } = await supabase
		.from("workspaces")
		.update({ name: parsed.data.name })
		.eq("id", workspace.id)
		.select("id")
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			// 0 filas visibles/actualizables bajo RLS → no era su workspace o rol insuficiente.
			return { status: "forbidden" };
		}
		console.error("workspace update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	invalidateShell();
	return { status: "success" };
}