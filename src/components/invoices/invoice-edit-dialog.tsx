"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateInvoiceAction } from "@/app/(app)/invoices/actions";
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
	INVOICE_STATUSES,
	INVOICE_STATUS_LABELS,
	invoiceFormSchema,
} from "@/lib/invoices/validation";

type InvoiceFormInput = z.input<typeof invoiceFormSchema>;

export interface InvoiceEditClient {
	id: string;
	name: string;
}

export function InvoiceEditDialog({
	open,
	onOpenChange,
	invoice,
	clients,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoice: {
		id: string;
		clientId: string;
		invoiceNumber: string;
		status: string;
		currency: string;
		issueDate: string;
		dueDate: string | null;
		notes: string | null;
	};
	clients: InvoiceEditClient[];
}) {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);

	const defaultValues: InvoiceFormInput = {
		clientId: invoice.clientId,
		invoiceNumber: invoice.invoiceNumber,
		status: invoice.status as InvoiceFormInput["status"],
		currency: invoice.currency,
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate ?? "",
		notes: invoice.notes ?? "",
	};

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<InvoiceFormInput>({
		resolver: zodResolver(invoiceFormSchema),
		defaultValues,
	});

	function handleClose(next: boolean) {
		if (!next) {
			setFormError(null);
			reset(defaultValues);
		}
		onOpenChange(next);
	}

	async function onSubmit(values: InvoiceFormInput) {
		setFormError(null);
		const result = await updateInvoiceAction(invoice.id, values);

		switch (result.status) {
			case "success":
				handleClose(false);
				router.refresh();
				break;
			case "invalid":
				setFormError(result.message);
				break;
			case "client_not_found":
				setFormError("El cliente seleccionado no está disponible.");
				break;
			case "not_found":
				setFormError("Esta factura ya no existe o no tienes acceso.");
				break;
			case "not_authenticated":
				setFormError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
				break;
			case "no_workspace":
				setFormError("No tienes un workspace activo.");
				break;
			default:
				setFormError("message" in result ? result.message : "No se pudo actualizar la factura.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className={dialogTitleClasses}>
						Editar factura
					</DialogTitle>
					<DialogDescription className={dialogDescriptionClasses}>
						Actualiza la información de la factura.
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<form
						id="invoice-edit-form"
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						{formError ? <FormAlert>{formError}</FormAlert> : null}

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="edit-invoice-client" className={fieldLabelClasses}>
									Cliente
								</label>
								<select
									id="edit-invoice-client"
									className={`${selectClasses} mt-1.5`}
									aria-invalid={errors.clientId ? true : undefined}
									aria-describedby={errors.clientId ? "edit-invoice-client-error" : undefined}
									{...register("clientId")}
								>
									{clients.map((client) => (
										<option key={client.id} value={client.id}>
											{client.name}
										</option>
									))}
								</select>
								{errors.clientId ? (
									<p id="edit-invoice-client-error" role="alert" className="mt-1.5 text-[13px] text-danger">
										{errors.clientId.message}
									</p>
								) : null}
							</div>
							<div>
								<label htmlFor="edit-invoice-status" className={fieldLabelClasses}>
									Estado
								</label>
								<select
									id="edit-invoice-status"
									className={`${selectClasses} mt-1.5`}
									{...register("status")}
								>
									{INVOICE_STATUSES.map((s) => (
										<option key={s} value={s}>
											{INVOICE_STATUS_LABELS[s]}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								id="edit-invoice-number"
								type="text"
								label="Número de factura"
								autoComplete="off"
								error={errors.invoiceNumber?.message}
								{...register("invoiceNumber")}
							/>
							<div>
								<label htmlFor="edit-invoice-currency" className={fieldLabelClasses}>
									Moneda
								</label>
								<select
									id="edit-invoice-currency"
									className={`${selectClasses} mt-1.5`}
									{...register("currency")}
								>
									<option value="USD">USD</option>
									<option value="EUR">EUR</option>
									<option value="MXN">MXN</option>
									<option value="COP">COP</option>
								</select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<Field
								id="edit-invoice-issue-date"
								type="date"
								label="Fecha de emisión"
								error={errors.issueDate?.message}
								{...register("issueDate")}
							/>
							<Field
								id="edit-invoice-due-date"
								type="date"
								label="Fecha de vencimiento"
								error={errors.dueDate?.message}
								{...register("dueDate")}
							/>
						</div>

						<div>
							<label htmlFor="edit-invoice-notes" className={fieldLabelClasses}>
								Notas
							</label>
							<textarea
								id="edit-invoice-notes"
								rows={3}
								placeholder="Opcional"
								className={`${textareaClasses} mt-1.5`}
								{...register("notes")}
							/>
						</div>
					</form>
				</DialogBody>

				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => handleClose(false)}>
						Cancelar
					</Button>
					<Button type="submit" form="invoice-edit-form" disabled={isSubmitting}>
						{isSubmitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
						Guardar cambios
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}