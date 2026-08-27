"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, getPrimaryWorkspace } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ProjectFileActionResult =
	| { status: "success"; id: string }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "project_not_found" }
	| { status: "not_found" }
	| { status: "file_not_found" }
	| { status: "db_created_storage_orphaned" }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo completar la operación. Inténtalo de nuevo.";

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}

export async function createProjectFileAction(
	projectId: string,
	storagePath: string,
	fileName: string,
	mimeType: string | null,
	sizeBytes: number | null,
): Promise<ProjectFileActionResult> {
	if (!isUuid(projectId)) return { status: "not_found" };
	if (!storagePath || storagePath.length < 10) {
		return { status: "error", message: "Ruta de almacenamiento inválida." };
	}

	const user = await getCurrentUser();
	if (!user) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();

	// Verificar que el proyecto existe y pertenece al workspace
	const { data: project, error: projectError } = await supabase
		.from("projects")
		.select("id, workspace_id")
		.eq("id", projectId)
		.maybeSingle();

	if (projectError) {
		console.error("project lookup failed:", projectError.code, projectError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!project || project.workspace_id !== workspace.id) {
		return { status: "project_not_found" };
	}

	const { data, error } = await supabase
		.from("project_files")
		.insert({
			project_id: projectId,
			storage_path: storagePath,
			file_name: fileName,
			mime_type: mimeType,
			size_bytes: sizeBytes,
			uploaded_by: user.id,
		})
		.select("id")
		.single();

	if (error) {
		// DB falló — intentar limpiar storage
		const { error: cleanupError } = await supabase.storage
			.from("project-files")
			.remove([storagePath]);

		console.error(
			"project_file insert failed, storage cleanup:",
			error.code,
			error.message,
			cleanupError ? cleanupError.message : "cleanup ok",
		);

		return {
			status: cleanupError ? "db_created_storage_orphaned" : "error",
			message: GENERIC_ERROR,
		};
	}

	revalidatePath(`/projects/${projectId}`);
	return { status: "success", id: data.id };
}

export async function deleteProjectFileAction(
	fileId: string,
	projectId: string,
): Promise<ProjectFileActionResult> {
	if (!isUuid(fileId) || !isUuid(projectId))
		return { status: "not_found" };

	if (!(await getCurrentUser())) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();

	// Obtener metadata del archivo, verificando acceso via project → workspace
	const { data: file, error: fileError } = await supabase
		.from("project_files")
		.select("id, storage_path, project_id, project:projects(workspace_id)")
		.eq("id", fileId)
		.maybeSingle();

	if (fileError) {
		console.error("project file lookup failed:", fileError.code, fileError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!file) return { status: "file_not_found" };
	const project =
		typeof file.project === "object" && file.project !== null
			? file.project
			: null;
	if (
		!project ||
		project.workspace_id !== workspace.id ||
		file.project_id !== projectId
	) {
		return { status: "file_not_found" };
	}

	// Primero eliminar objeto de Storage (si falla, no eliminar DB)
	const { error: storageError } = await supabase.storage
		.from("project-files")
		.remove([file.storage_path]);

	if (storageError) {
		console.error(
			"storage delete failed:",
			storageError.message,
		);
		return {
			status: "error",
			message: "No se pudo eliminar el archivo del almacenamiento.",
		};
	}

	// Luego eliminar metadata de DB
	const { data: deleted, error } = await supabase
		.from("project_files")
		.delete()
		.eq("id", fileId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error(
			"project_file delete failed, storage already deleted:",
			error.code,
			error.message,
		);
		return {
			status: "error",
			message:
				"El archivo se eliminó del almacenamiento pero no se pudo actualizar la base de datos.",
		};
	}
	if (!deleted) return { status: "file_not_found" };

	revalidatePath(`/projects/${projectId}`);
	return { status: "success", id: fileId };
}

export async function getFileDownloadUrlAction(
	fileId: string,
): Promise<ProjectFileActionResult & { url?: string }> {
	if (!isUuid(fileId)) return { status: "not_found" };
	if (!(await getCurrentUser())) return { status: "not_authenticated" };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();

	const { data: file, error: fileError } = await supabase
		.from("project_files")
		.select("id, storage_path, project_id, project:projects(workspace_id)")
		.eq("id", fileId)
		.maybeSingle();

	if (fileError) {
		console.error("project file lookup failed:", fileError.code, fileError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!file) return { status: "file_not_found" };
	const project =
		typeof file.project === "object" && file.project !== null
			? file.project
			: null;
	if (!project || project.workspace_id !== workspace.id) {
		return { status: "file_not_found" };
	}

	const { data: signedUrlData, error: signedUrlError } = await supabase.storage
		.from("project-files")
		.createSignedUrl(file.storage_path, 60);

	if (signedUrlError || !signedUrlData) {
		console.error("signed URL failed:", signedUrlError?.message);
		return { status: "error", message: "No se pudo generar el enlace de descarga." };
	}

	return { status: "success", id: fileId, url: signedUrlData.signedUrl };
}
