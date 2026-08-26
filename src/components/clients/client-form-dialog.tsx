"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
	createClientAction,
	updateClientAction,
} from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogBody,
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
	clientFormSchema,
	CLIENT_STATUSES,
	CLIENT_STATUS_LABELS,
} from "@/lib/clients/validation";

type ClientFormInput = z.input<typeof clientFormSchema>;

const EMPTY_VALUES: ClientFormInput = {
	name: "",
	company: "",
	email: "",
	phone: "",
	notes: "",
	status: "active",
};

export function ClientFormDialog({
	open,
	onOpenChange,
	client,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Cliente a editar; undefined => modo creación. */
	client?: {
		id: string;
		name: string;
		company: string | null;
		email: string | null;
		phone: string | null;
		notes: string | null;
		status: string;
	};
}) {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ClientFormInput>({
		resolver: zodResolver(clientFormSchema),
		defaultValues: client
			? {
					name: client.name,
					company: client.company ?? "",
					email: client.email ?? "",
					phone: client.phone ?? "",
					notes: client.notes ?? "",
					status: (client.status as ClientFormInput["status"]) ?? "active",
				}
			: EMPTY_VALUES,
	});

	function handleClose(next: boolean) {
		if (!next) {
			setFormError(null);
			reset(
				client
					? {
							name: client.name,
							company: client.company ?? "",
							email: client.email ?? "",
							phone: client.phone ?? "",
							notes: client.notes ?? "",
							status: (client.status as ClientFormInput["status"]) ?? "active",
						}
					: EMPTY_VALUES,
			);
		}
		onOpenChange(next);
	}

	async function onSubmit(values: ClientFormInput) {
		setFormError(null);

		const result = client
			? await updateClientAction(client.id, values)
			: await createClientAction(values);

		switch (result.status) {
			case "success":
				handleClose(false);
				if (!client) {
					router.push(`/clients/${result.id}`);
				} else {
					router.refresh();
				}
				break;
			case "invalid":
				setFormError(result.message);
				break;
			case "not_found":
				setFormError("Este cliente ya no existe o no tienes acceso.");
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

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className={dialogTitleClasses}>
						{client ? "Editar cliente" : "Nuevo cliente"}
					</DialogTitle>
					<DialogDescription className={dialogDescriptionClasses}>
						{client
							? "Actualiza la información del cliente."
							: "Añade un cliente a tu espacio de trabajo."}
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<form
						id="client-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						{formError ? <FormAlert>{formError}</FormAlert> : null}

						<Field
							id="client-name"
							type="text"
							label="Nombre"
							placeholder="Nombre del cliente"
							autoComplete="off"
							error={errors.name?.message}
							{...register("name")}
						/>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								id="client-company"
								type="text"
								label="Empresa"
								placeholder="Opcional"
								autoComplete="off"
								error={errors.company?.message}
								{...register("company")}
							/>
							<div>
								<label htmlFor="client-status" className={fieldLabelClasses}>
									Estado
								</label>
								<select
									id="client-status"
									className={`${selectClasses} mt-1.5`}
									{...register("status")}
								>
									{CLIENT_STATUSES.map((status) => (
										<option key={status} value={status}>
											{CLIENT_STATUS_LABELS[status]}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								id="client-email"
								type="email"
								label="Email"
								placeholder="Opcional"
								autoComplete="off"
								error={errors.email?.message}
								{...register("email")}
							/>
							<Field
								id="client-phone"
								type="tel"
								label="Teléfono"
								placeholder="Opcional"
								autoComplete="off"
								error={errors.phone?.message}
								{...register("phone")}
							/>
						</div>

						<div>
							<label htmlFor="client-notes" className={fieldLabelClasses}>
								Notas
							</label>
							<textarea
								id="client-notes"
								rows={3}
								placeholder="Opcional"
								className={`${textareaClasses} mt-1.5`}
								{...register("notes")}
							/>
							{errors.notes ? (
								<p id="client-notes-error" role="alert" className="mt-1.5 text-[13px] text-danger">
									{errors.notes.message}
								</p>
							) : null}
						</div>
					</form>
				</DialogBody>

				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => handleClose(false)}>
						Cancelar
					</Button>
					<Button type="submit" form="client-form" disabled={isSubmitting}>
						{isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
						{client ? "Guardar cambios" : "Crear cliente"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
