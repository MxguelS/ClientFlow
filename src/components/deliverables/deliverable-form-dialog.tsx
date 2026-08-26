"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
	createDeliverableAction,
	updateDeliverableAction,
} from "@/app/(app)/deliverables/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	dialogDescriptionClasses,
	dialogTitleClasses,
} from "@/components/ui/dialog";
import { Field, FormAlert, fieldLabelClasses } from "@/components/ui/field";
import { selectClasses, textareaClasses } from "@/components/ui/input";
import {
	DELIVERABLE_STATUSES,
	DELIVERABLE_STATUS_LABELS,
	deliverableFormSchema,
} from "@/lib/deliverables/validation";

type DeliverableFormInput = z.input<typeof deliverableFormSchema>;

export interface DeliverableDialogProject {
	id: string;
	name: string;
}

interface DeliverableDialogValue {
	id: string;
	title: string;
	projectId: string;
	description: string | null;
	status: string;
	dueDate: string | null;
}

export function DeliverableFormDialog({
	open,
	onOpenChange,
	projects,
	deliverable,
	defaultProjectId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projects: DeliverableDialogProject[];
	deliverable?: DeliverableDialogValue;
	defaultProjectId?: string;
}) {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);
	const initialProjectId =
		projects.find((project) => project.id === defaultProjectId)?.id ??
		projects[0]?.id ??
		"";
	const defaultValues: DeliverableFormInput = deliverable
		? {
				title: deliverable.title,
				projectId: deliverable.projectId,
				description: deliverable.description ?? "",
				status: deliverable.status as DeliverableFormInput["status"],
				dueDate: deliverable.dueDate ?? "",
			}
		: {
				title: "",
				projectId: initialProjectId,
				description: "",
				status: "pending",
				dueDate: "",
			};

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<DeliverableFormInput>({
		resolver: zodResolver(deliverableFormSchema),
		defaultValues,
	});

	function handleClose(next: boolean) {
		if (!next) {
			setFormError(null);
			reset(defaultValues);
		}
		onOpenChange(next);
	}

	async function onSubmit(values: DeliverableFormInput) {
		setFormError(null);
		const result = deliverable
			? await updateDeliverableAction(deliverable.id, values)
			: await createDeliverableAction(values);

		switch (result.status) {
			case "success":
				handleClose(false);
				if (deliverable) router.refresh();
				else router.push(`/deliverables/${result.id}`);
				break;
			case "invalid":
				setFormError(result.message);
				break;
			case "project_not_found":
				setFormError("El proyecto seleccionado no está disponible.");
				break;
			case "not_found":
				setFormError("Este entregable ya no existe o no tienes acceso.");
				break;
			case "not_authenticated":
				setFormError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
				break;
			case "no_workspace":
				setFormError("No tienes un workspace activo.");
				break;
			default:
				setFormError(result.message);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className={dialogTitleClasses}>
						{deliverable ? "Editar entregable" : "Nuevo entregable"}
					</DialogTitle>
					<DialogDescription className={dialogDescriptionClasses}>
						{deliverable
							? "Actualiza la información del entregable."
							: "Añade un entregable a uno de tus proyectos."}
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<form
						id="deliverable-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						{formError ? <FormAlert>{formError}</FormAlert> : null}
						<Field
							id="deliverable-title"
							type="text"
							label="Título"
							placeholder="Nombre del entregable"
							autoComplete="off"
							error={errors.title?.message}
							{...register("title")}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="deliverable-project" className={fieldLabelClasses}>
									Proyecto
								</label>
								<select
									id="deliverable-project"
									className={`${selectClasses} mt-1.5`}
									aria-invalid={errors.projectId ? true : undefined}
									aria-describedby={errors.projectId ? "deliverable-project-error" : undefined}
									{...register("projectId")}
								>
									{projects.map((project) => (
										<option key={project.id} value={project.id}>
											{project.name}
										</option>
									))}
								</select>
								{errors.projectId ? (
									<p id="deliverable-project-error" role="alert" className="mt-1.5 text-[13px] text-danger">
										{errors.projectId.message}
									</p>
								) : null}
							</div>
							<div>
								<label htmlFor="deliverable-status" className={fieldLabelClasses}>
									Estado
								</label>
								<select
									id="deliverable-status"
									className={`${selectClasses} mt-1.5`}
									{...register("status")}
								>
									{DELIVERABLE_STATUSES.map((status) => (
										<option key={status} value={status}>
											{DELIVERABLE_STATUS_LABELS[status]}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="sm:max-w-[calc(50%-0.5rem)]">
							<Field
								id="deliverable-due-date"
								type="date"
								label="Fecha límite"
								error={errors.dueDate?.message}
								{...register("dueDate")}
							/>
						</div>

						<div>
							<label htmlFor="deliverable-description" className={fieldLabelClasses}>
								Descripción
							</label>
							<textarea
								id="deliverable-description"
								rows={3}
								placeholder="Opcional"
								className={`${textareaClasses} mt-1.5`}
								{...register("description")}
							/>
						</div>
					</form>
				</DialogBody>

				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => handleClose(false)}>
						Cancelar
					</Button>
					<Button type="submit" form="deliverable-form" disabled={isSubmitting}>
						{isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
						{deliverable ? "Guardar cambios" : "Crear entregable"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
