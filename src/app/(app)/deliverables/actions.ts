"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, getPrimaryWorkspace } from "@/lib/auth/session";
import { parseDeliverableForm } from "@/lib/deliverables/validation";
import { createClient } from "@/lib/supabase/server";

export type DeliverableActionResult =
	| { status: "success"; id: string }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "invalid"; message: string }
	| { status: "project_not_found" }
	| { status: "not_found" }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo completar la operación. Inténtalo de nuevo.";

export async function createDeliverableAction(
	values: unknown,
): Promise<DeliverableActionResult> {
	const parsed = parseDeliverableForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del entregable inválidos." };
	}

	if (!(await getCurrentUser())) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("id, workspace_id")
		.eq("id", parsed.data.projectId)
		.maybeSingle();

	if (projectError) {
		console.error("deliverable project lookup failed:", projectError.code, projectError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!project || project.workspace_id !== workspace.id) {
		return { status: "project_not_found" };
	}

	const { data, error } = await supabase
		.from("deliverables")
		.insert({
			project_id: project.id,
			title: parsed.data.title,
			description: parsed.data.description,
			status: parsed.data.status,
			due_date: parsed.data.dueDate,
		})
		.select("id")
		.single();

	if (error) {
		console.error("deliverable insert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/deliverables");
	revalidatePath(`/projects/${project.id}`);
	return { status: "success", id: data.id };
}

export async function updateDeliverableAction(
	id: string,
	values: unknown,
): Promise<DeliverableActionResult> {
	if (!isUuid(id)) return { status: "not_found" };

	const parsed = parseDeliverableForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del entregable inválidos." };
	}

	if (!(await getCurrentUser())) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();
	const [{ data: existing, error: existingError }, { data: project, error: projectError }] = await Promise.all([
		supabase
			.from("deliverables")
			.select("id, project_id, project:projects(workspace_id)")
			.eq("id", id)
			.maybeSingle(),
		supabase
			.from("projects")
			.select("id, workspace_id")
			.eq("id", parsed.data.projectId)
			.maybeSingle(),
	]);

	const lookupError = existingError ?? projectError;
	if (lookupError) {
		console.error(
			"deliverable lookup failed:",
			lookupError.code,
			lookupError.message,
		);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing) return { status: "not_found" };
	const existingProject =
		typeof existing.project === "object" && existing.project !== null
			? existing.project
			: null;
	if (!existingProject || existingProject.workspace_id !== workspace.id) {
		return { status: "not_found" };
	}
	if (!project || project.workspace_id !== workspace.id) {
		return { status: "project_not_found" };
	}

	const { data: updated, error } = await supabase
		.from("deliverables")
		.update({
			project_id: project.id,
			title: parsed.data.title,
			description: parsed.data.description,
			status: parsed.data.status,
			due_date: parsed.data.dueDate,
		})
		.eq("id", id)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("deliverable update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!updated) return { status: "not_found" };

	revalidatePath("/deliverables");
	revalidatePath(`/deliverables/${id}`);
	revalidatePath(`/projects/${existing.project_id}`);
	revalidatePath(`/projects/${project.id}`);
	return { status: "success", id };
}

export async function deleteDeliverableAction(
	id: string,
): Promise<DeliverableActionResult> {
	if (!isUuid(id)) return { status: "not_found" };
	if (!(await getCurrentUser())) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();
	const { data: existing, error: existingError } = await supabase
		.from("deliverables")
		.select("id, project_id, project:projects(workspace_id)")
		.eq("id", id)
		.maybeSingle();

	if (existingError) {
		console.error("deliverable lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing) return { status: "not_found" };
	const project =
		typeof existing.project === "object" && existing.project !== null
			? existing.project
			: null;
	if (!project || project.workspace_id !== workspace.id) {
		return { status: "not_found" };
	}

	const { data: deleted, error } = await supabase
		.from("deliverables")
		.delete()
		.eq("id", id)
		.select("id")
		.maybeSingle();
	if (error) {
		console.error("deliverable delete failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!deleted) return { status: "not_found" };

	revalidatePath("/deliverables");
	revalidatePath(`/projects/${existing.project_id}`);
	return { status: "success", id };
}

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}
