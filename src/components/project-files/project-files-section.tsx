"use client";

import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";

import {
	createProjectFileAction,
	deleteProjectFileAction,
	getFileDownloadUrlAction,
} from "@/app/(app)/project-files/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	dialogDescriptionClasses,
	dialogTitleClasses,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { validateFile } from "@/lib/project-files/validation";
import { buildStoragePath } from "@/lib/project-files/path";

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatFileSize(bytes: number | null): string {
	if (bytes === null || bytes === undefined) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesSection({
	files: initialFiles,
	projectId,
	workspaceId,
}: {
	files: Array<{
		id: string;
		fileName: string;
		mimeType: string | null;
		sizeBytes: number | null;
		createdAt: string;
	}>;
	projectId: string;
	workspaceId: string;
}) {
	const [files, setFiles] = useState(initialFiles);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		fileName: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleUpload(file: File) {
		const validationError = validateFile({
			name: file.name,
			size: file.size,
			type: file.type,
		});
		if (validationError) {
			setError(validationError);
			return;
		}

		setUploading(true);
		setError(null);

		const supabase = createClient();
		const storagePath = buildStoragePath(workspaceId, projectId, file.name);

		const { error: uploadError } = await supabase.storage
			.from("project-files")
			.upload(storagePath, file, {
				contentType: file.type,
			});

		if (uploadError) {
			setError(
				uploadError.message === "The resource already exists"
					? "Ya existe un archivo con esta referencia. Intenta de nuevo."
					: "Error al subir el archivo.",
			);
			setUploading(false);
			return;
		}

		const result = await createProjectFileAction(
			projectId,
			storagePath,
			file.name,
			file.type || null,
			file.size,
		);

		if (result.status === "success") {
			setFiles((prev) => [
				{
					id: result.id,
					fileName: file.name,
					mimeType: file.type || null,
					sizeBytes: file.size,
					createdAt: new Date().toISOString(),
				},
				...prev,
			]);
		} else if (result.status === "db_created_storage_orphaned") {
			setError(
				"El archivo se subió pero no se pudo registrar. Intenta de nuevo.",
			);
		} else {
			// Intentar cleanup
			await supabase.storage.from("project-files").remove([storagePath]);
			setError(result.status === "project_not_found"
				? "El proyecto no está disponible."
				: "Error al registrar el archivo.");
		}

		setUploading(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	function onFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		handleUpload(file);
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		setDeleting(true);
		setError(null);

		const result = await deleteProjectFileAction(
			deleteTarget.id,
			projectId,
		);

		if (result.status === "success") {
			setFiles((prev) =>
				prev.filter((f) => f.id !== deleteTarget.id),
			);
			setDeleteTarget(null);
		} else if (result.status === "file_not_found") {
			setFiles((prev) =>
				prev.filter((f) => f.id !== deleteTarget.id),
			);
			setDeleteTarget(null);
			setError("El archivo ya no existe o no tienes acceso.");
		} else {
			setError(
				"message" in result && result.message
					? result.message
					: "No se pudo eliminar el archivo.",
			);
		}

		setDeleting(false);
	}

	async function handleDownload(fileId: string) {
		setDownloadLoading(fileId);
		setError(null);

		const result = await getFileDownloadUrlAction(fileId);

		if (result.status === "success" && result.url) {
			window.open(result.url, "_blank");
		} else {
			setError(
				result.status === "file_not_found"
					? "El archivo ya no está disponible."
					: "Error al generar enlace de descarga.",
			);
		}

		setDownloadLoading(null);
	}

	return (
		<section className="border-t border-line py-4" aria-label="Archivos del proyecto">
			<div className="flex items-center justify-between gap-3">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
					Archivos
				</p>
				<label className="cursor-pointer">
					<span className="sr-only">Subir archivo</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={uploading}
						onClick={() => fileInputRef.current?.click()}
					>
						{uploading ? (
							<Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
						) : (
							<Upload aria-hidden="true" className="size-3.5" />
						)}
						{uploading ? "Subiendo..." : "Subir archivo"}
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						aria-label="Seleccionar archivo"
						className="hidden"
						onChange={onFileSelect}
						accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.doc,.docx,.xls,.xlsx,.txt,.csv,.md,.zip,.gz,.rar"
					/>
				</label>
			</div>

			{error ? (
				<div className="mt-3">
					<FormAlert>{error}</FormAlert>
				</div>
			) : null}

			{files.length === 0 ? (
				<p className="mt-2 text-sm text-tertiary">
					Este proyecto todavía no tiene archivos.
				</p>
			) : (
				<ul className="mt-2 border-y border-line">
					{files.map((file) => (
						<li key={file.id} className="border-b border-line last:border-b-0">
							<div className="flex items-center gap-3 px-2 py-2.5">
								<FileText
									aria-hidden="true"
									className="size-4 shrink-0 text-tertiary"
								/>
								<div className="min-w-0 flex-1">
									<button
										type="button"
										onClick={() => handleDownload(file.id)}
										disabled={downloadLoading === file.id}
										className="block truncate text-left text-sm font-medium text-primary transition-colors hover:text-accent"
									>
										{downloadLoading === file.id
											? "Generando enlace..."
											: file.fileName}
									</button>
									<span className="mt-0.5 block text-[10px] font-mono text-tertiary">
										{file.mimeType ?? "desconocido"}
										{file.sizeBytes !== null ? ` · ${formatFileSize(file.sizeBytes)}` : ""}
										{" · "}
										{dateTimeFormatter.format(new Date(file.createdAt))}
									</span>
								</div>
								<button
									type="button"
									onClick={() =>
										setDeleteTarget({ id: file.id, fileName: file.fileName })
									}
									aria-label={`Eliminar ${file.fileName}`}
									className="flex size-7 shrink-0 items-center justify-center rounded text-tertiary transition-colors hover:bg-danger-soft hover:text-danger"
								>
									<Trash2 aria-hidden="true" className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={deleteTarget !== null}
				onOpenChange={(next) => {
					if (!next && !deleting) setDeleteTarget(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-start gap-3">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
								<Trash2 aria-hidden="true" className="size-4" />
							</span>
							<div className="min-w-0">
								<DialogTitle className={dialogTitleClasses}>
									Eliminar archivo
								</DialogTitle>
								<DialogDescription className={dialogDescriptionClasses}>
									Se eliminará{' '}
									<span className="font-medium text-primary">
										{deleteTarget?.fileName}
									</span>{' '}
									y esta acción no se puede deshacer.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							onClick={() => setDeleteTarget(null)}
							disabled={deleting}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							variant="danger"
							onClick={handleDelete}
							disabled={deleting}
						>
							{deleting ? (
								<Loader2 aria-hidden="true" className="size-4 animate-spin" />
							) : null}
							Eliminar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}