"use server";

import { revalidatePath } from "next/cache";

import { getPrimaryWorkspace } from "@/lib/auth/session";
import { parseProjectForm } from "@/lib/projects/validation";
import { createClient } from "@/lib/supabase/server";

export type ProjectActionResult =
	| { status: "success"; id: string }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "invalid"; message: string }
	| { status: "client_not_found" }
	| { status: "not_found" }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo completar la operación. Inténtalo de nuevo.";

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}

/**
 * Crea un proyecto en el workspace activo del usuario.
 * El client_id se valida leyendo el cliente bajo RLS: si el usuario no
 * puede verlo (workspace ajeno), la creación se rechaza en el servidor.
 */
export async function createProjectAction(
	values: unknown,
): Promise<ProjectActionResult> {
	const parsed = parseProjectForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del proyecto inválidos." };
	}

	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();

	const { data: client, error: clientError } = await supabase
		.from("clients")
		.select("id, workspace_id")
		.eq("id", parsed.data.clientId)
		.maybeSingle();

	if (clientError) {
		console.error("project client lookup failed:", clientError.code, clientError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!client || client.workspace_id !== workspace.id) {
		return { status: "client_not_found" };
	}

	const { data, error } = await supabase
		.from("projects")
		.insert({
			workspace_id: workspace.id,
			client_id: parsed.data.clientId,
			name: parsed.data.name,
			description: parsed.data.description,
			status: parsed.data.status,
			budget: parsed.data.budget,
			start_date: parsed.data.startDate,
			due_date: parsed.data.dueDate,
		})
		.select("id")
		.single();

	if (error) {
		console.error("project insert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/projects");
	return { status: "success", id: data.id };
}

export async function updateProjectAction(
	id: string,
	values: unknown,
): Promise<ProjectActionResult> {
	if (!isUuid(id)) return { status: "not_found" };

	const parsed = parseProjectForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del proyecto inválidos." };
	}

	const supabase = await createClient();

	const { data: existing, error: existingError } = await supabase
		.from("projects")
		.select("id, workspace_id")
		.eq("id", id)
		.maybeSingle();

	if (existingError) {
		console.error("project lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing) return { status: "not_found" };

	const { data: client, error: clientError } = await supabase
		.from("clients")
		.select("id, workspace_id")
		.eq("id", parsed.data.clientId)
		.maybeSingle();

	if (clientError) {
		console.error("project client lookup failed:", clientError.code, clientError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!client || client.workspace_id !== existing.workspace_id) {
		return { status: "client_not_found" };
	}

	const { data: updated, error } = await supabase
		.from("projects")
		.update({
			name: parsed.data.name,
			description: parsed.data.description,
			status: parsed.data.status,
			budget: parsed.data.budget,
			start_date: parsed.data.startDate,
			due_date: parsed.data.dueDate,
		})
		.eq("id", id)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("project update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!updated) return { status: "not_found" };

	revalidatePath("/projects");
	revalidatePath(`/projects/${id}`);
	return { status: "success", id };
}
