"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
	createProjectAction,
	updateProjectAction,
} from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import {
	projectFormSchema,
	PROJECT_STATUSES,
	PROJECT_STATUS_LABELS,
} from "@/lib/projects/validation";

type ProjectFormInput = z.input<typeof projectFormSchema>;

export interface ProjectDialogClient {
	id: string;
	name: string;
}

export function ProjectFormDialog({
	open,
	onOpenChange,
	project,
	clients,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Proyecto a editar; undefined => modo creación. */
	project?: {
		id: string;
		name: string;
		clientId: string;
		description: string | null;
		status: string;
		budget: number | null;
		startDate: string | null;
		dueDate: string | null;
	};
	clients: ProjectDialogClient[];
}) {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ProjectFormInput>({
		resolver: zodResolver(projectFormSchema),
		defaultValues: project
			? {
					name: project.name,
					clientId: project.clientId,
					description: project.description ?? "",
					status: (project.status as ProjectFormInput["status"]) ?? "planning",
					budget: project.budget ?? "",
					startDate: project.startDate ?? "",
					dueDate: project.dueDate ?? "",
				}
			: {
					name: "",
					clientId: clients[0]?.id ?? "",
					description: "",
					status: "planning",
					budget: "",
					startDate: "",
					dueDate: "",
				},
	});

	function handleClose(next: boolean) {
		if (!next) {
			setFormError(null);
			reset(
				project
					? {
							name: project.name,
							clientId: project.clientId,
							description: project.description ?? "",
							status: (project.status as ProjectFormInput["status"]) ?? "planning",
							budget: project.budget ?? "",
							startDate: project.startDate ?? "",
							dueDate: project.dueDate ?? "",
						}
					: {
							name: "",
							clientId: clients[0]?.id ?? "",
							description: "",
							status: "planning",
							budget: "",
							startDate: "",
							dueDate: "",
						},
			);
		}
		onOpenChange(next);
	}

	async function onSubmit(values: ProjectFormInput) {
		setFormError(null);

		const result = project
			? await updateProjectAction(project.id, values)
			: await createProjectAction(values);

		switch (result.status) {
			case "success":
				handleClose(false);
				if (!project) {
					router.push(`/projects/${result.id}`);
				} else {
					router.refresh();
				}
				break;
			case "invalid":
				setFormError(result.message);
				break;
			case "client_not_found":
				setFormError("El cliente seleccionado no está disponible.");
				break;
			case "not_found":
				setFormError("Este proyecto ya no existe o no tienes acceso.");
				break;
			case "no_workspace":
				setFormError("No tienes un workspace activo.");
				break;
			case "not_authenticated":
				setFormError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
				break;
			default:
				setFormError(result.message);
		}
	}

	const inputClasses =
		"mt-1 h-9 w-full rounded-md border border-line-strong bg-surface-sunken px-3 text-sm text-primary outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20";

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogTitle className="text-base font-semibold text-primary">
					{project ? "Editar proyecto" : "Nuevo proyecto"}
				</DialogTitle>
				<DialogDescription className="mt-1 text-sm text-secondary">
					{project
						? "Actualiza la información del proyecto."
						: "Crea un proyecto asociado a uno de tus clientes."}
				</DialogDescription>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="mt-5 space-y-4"
					noValidate
				>
					{formError ? (
						<div role="alert" className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
							{formError}
						</div>
					) : null}

					<Field
						id="project-name"
						type="text"
						label="Nombre"
						placeholder="Nombre del proyecto"
						autoComplete="off"
						error={errors.name?.message}
						{...register("name")}
					/>

					<div>
						<label htmlFor="project-client" className="block text-sm font-medium text-primary">
							Cliente
						</label>
						<select
							id="project-client"
							className={inputClasses}
							aria-invalid={errors.clientId ? true : undefined}
							{...register("clientId")}
						>
							{clients.map((client) => (
								<option key={client.id} value={client.id}>
									{client.name}
								</option>
							))}
						</select>
						{errors.clientId ? (
							<p role="alert" className="mt-1 text-sm text-danger">{errors.clientId.message}</p>
						) : null}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="project-status" className="block text-sm font-medium text-primary">
								Estado
							</label>
							<select id="project-status" className={inputClasses} {...register("status")}>
								{PROJECT_STATUSES.map((status) => (
									<option key={status} value={status}>
										{PROJECT_STATUS_LABELS[status]}
									</option>
								))}
							</select>
						</div>
						<Field
							id="project-budget"
							type="number"
							step="0.01"
							min="0"
							label="Presupuesto"
							placeholder="Opcional"
							error={errors.budget?.message}
							{...register("budget", {
								setValueAs: (value) => (value === "" ? "" : Number(value)),
							})}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<Field
							id="project-start"
							type="date"
							label="Fecha de inicio"
							error={errors.startDate?.message}
							{...register("startDate")}
						/>
						<Field
							id="project-due"
							type="date"
							label="Fecha de fin"
							error={errors.dueDate?.message}
							{...register("dueDate")}
						/>
					</div>

					<div>
						<label htmlFor="project-description" className="block text-sm font-medium text-primary">
							Descripción
						</label>
						<textarea
							id="project-description"
							rows={3}
							placeholder="Opcional"
							className="mt-1 w-full rounded-md border border-line-strong bg-surface-sunken px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"
							{...register("description")}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="secondary" onClick={() => handleClose(false)}>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
							{project ? "Guardar cambios" : "Crear proyecto"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
