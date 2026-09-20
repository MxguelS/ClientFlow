"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
	createInvoiceItemAction,
	updateInvoiceItemAction,
	deleteInvoiceItemAction,
} from "@/app/(app)/invoices/actions";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import { FormAlert } from "@/components/ui/field";
import { invoiceItemSchema } from "@/lib/invoices/validation";
import { formatCurrency, calculateInvoiceTotal } from "@/lib/invoices/money";

type ItemFormInput = z.input<typeof invoiceItemSchema>;

const emptyItem = (): ItemFormInput => ({
	description: "",
	quantity: 1,
	unitPrice: 0,
});

export function InvoiceItemsSection({
	items: initialItems,
	invoiceId,
	currency,
}: {
	items: Array<{
		id: string;
		description: string;
		quantity: number;
		unit_price: number;
	}>;
	invoiceId: string;
	currency: string;
}) {
	const [items, setItems] = useState(initialItems);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<ItemFormInput>({
		resolver: zodResolver(invoiceItemSchema),
		defaultValues: emptyItem(),
	});

	async function onAdd(values: ItemFormInput) {
		setFormError(null);
		const result = await createInvoiceItemAction(invoiceId, values);
		if (result.status === "success") {
			setItems((prev) => [
				...prev,
				{
					id: result.id,
					description: values.description,
					quantity: values.quantity,
					unit_price: values.unitPrice,
				},
			]);
			reset(emptyItem());
			setAdding(false);
		} else {
			setFormError(result.status === "invalid" ? result.message : "Error al agregar línea.");
		}
	}

	function startEdit(item: typeof items[number]) {
		setEditingId(item.id);
		setValue("description", item.description);
		setValue("quantity", item.quantity);
		setValue("unitPrice", item.unit_price);
		setFormError(null);
	}

	async function onEdit(values: ItemFormInput) {
		if (!editingId) return;
		setFormError(null);
		const result = await updateInvoiceItemAction(editingId, invoiceId, values);
		if (result.status === "success") {
			setItems((prev) =>
				prev.map((item) =>
					item.id === editingId
						? { ...item, description: values.description, quantity: values.quantity, unit_price: values.unitPrice }
						: item,
				),
			);
			setEditingId(null);
			reset(emptyItem());
		} else {
			setFormError(result.status === "invalid" ? result.message : "Error al actualizar línea.");
		}
	}

	async function onDelete(itemId: string) {
		setFormError(null);
		const result = await deleteInvoiceItemAction(itemId, invoiceId);
		if (result.status === "success") {
			setItems((prev) => prev.filter((item) => item.id !== itemId));
			if (editingId === itemId) {
				setEditingId(null);
				reset(emptyItem());
			}
		} else {
			setFormError("Error al eliminar línea.");
		}
	}

	function cancelAdd() {
		setAdding(false);
		reset(emptyItem());
		setFormError(null);
	}

	function cancelEdit() {
		setEditingId(null);
		reset(emptyItem());
		setFormError(null);
	}

	const total = calculateInvoiceTotal(items);

	return (
		<section aria-label="Líneas de factura" className="py-4">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm font-semibold text-primary">
					Líneas
				</p>
				{!adding && editingId === null ? (
					<Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
						<Plus aria-hidden="true" className="size-3.5" />
						Añadir línea
					</Button>
				) : null}
			</div>

			{formError ? (
				<div className="mt-3">
					<FormAlert>{formError}</FormAlert>
				</div>
			) : null}

			{items.length === 0 && !adding ? (
				<p className="mt-3 text-sm text-tertiary">Esta factura no tiene líneas.</p>
			) : (
				<div className="mt-3 border-y border-line">
					<div className="hidden grid-cols-[minmax(0,3fr)_80px_100px_100px_60px] gap-3 border-b border-line px-3 py-2 text-xs font-medium text-secondary md:grid">
						<span>Descripción</span>
						<span className="text-right">Cantidad</span>
						<span className="text-right">Precio</span>
						<span className="text-right">Total</span>
						<span />
					</div>
					<ul>
						{items.map((item) => (
							<li key={item.id} className="border-b border-line last:border-b-0">
								{editingId === item.id ? (
									<form onSubmit={handleSubmit(onEdit)} className="grid gap-3 px-3 py-2.5 md:grid-cols-[minmax(0,3fr)_80px_100px_100px_60px]">
										<div className="min-w-0">
											<input
												type="text"
												aria-label="Descripción"
												placeholder="Descripción"
												className={`${inputClasses} w-full`}
												{...register("description")}
											/>
											{errors.description ? <p className="mt-1 text-[13px] text-danger">{errors.description.message}</p> : null}
										</div>
										<div>
											<input
												type="number"
												step="0.01"
												min="0.01"
												aria-label="Cantidad"
												className={`${inputClasses} w-full text-right`}
												{...register("quantity", { valueAsNumber: true })}
											/>
											{errors.quantity ? <p className="mt-1 text-[13px] text-danger">{errors.quantity.message}</p> : null}
										</div>
										<div>
											<input
												type="number"
												step="0.01"
												min="0"
												aria-label="Precio unitario"
												className={`${inputClasses} w-full text-right`}
												{...register("unitPrice", { valueAsNumber: true })}
											/>
											{errors.unitPrice ? <p className="mt-1 text-[13px] text-danger">{errors.unitPrice.message}</p> : null}
										</div>
										<div className="flex items-center justify-end font-mono text-sm text-primary">
											{formatCurrency(item.quantity * item.unit_price, currency)}
										</div>
										<div className="flex items-center justify-end gap-1">
											<button type="submit" disabled={isSubmitting} aria-label="Guardar" className="flex size-7 items-center justify-center rounded-md text-success hover:bg-success-soft">
												{isSubmitting ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Check aria-hidden className="size-3.5" />}
											</button>
											<button type="button" onClick={cancelEdit} aria-label="Cancelar" className="flex size-7 items-center justify-center rounded-md text-tertiary hover:bg-surface-hover hover:text-primary">
												<X aria-hidden className="size-3.5" />
											</button>
										</div>
									</form>
								) : (
									<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2.5 md:grid-cols-[minmax(0,3fr)_80px_100px_100px_60px]">
										<span className="min-w-0 truncate text-sm text-primary">
											{item.description}
										</span>
										<span className="text-right font-mono text-xs text-secondary md:hidden">
											{Number(item.quantity).toFixed(2)} × {formatCurrency(Number(item.unit_price), currency)}
										</span>
										<span className="hidden text-right font-mono text-xs text-secondary md:block">
											{Number(item.quantity).toFixed(2)}
										</span>
										<span className="hidden text-right font-mono text-xs text-secondary md:block">
											{formatCurrency(Number(item.unit_price), currency)}
										</span>
										<span className="text-right font-mono text-xs text-primary">
											{formatCurrency(Number(item.quantity) * Number(item.unit_price), currency)}
										</span>
										<div className="flex items-center justify-end gap-1">
											<button type="button" onClick={() => startEdit(item)} aria-label="Editar línea" className="flex size-6 items-center justify-center rounded text-tertiary hover:bg-surface-hover hover:text-primary">
												<Pencil aria-hidden className="size-3" />
											</button>
											<button type="button" onClick={() => onDelete(item.id)} aria-label="Eliminar línea" className="flex size-6 items-center justify-center rounded text-tertiary hover:bg-danger-soft hover:text-danger">
												<Trash2 aria-hidden className="size-3" />
											</button>
										</div>
									</div>
								)}
							</li>
						))}

						{adding ? (
							<li>
								<form onSubmit={handleSubmit(onAdd)} className="grid gap-3 px-3 py-2.5 md:grid-cols-[minmax(0,3fr)_80px_100px_100px_60px]">
									<div className="min-w-0">
										<input
											type="text"
											aria-label="Descripción"
											placeholder="Descripción del servicio o producto"
											className={`${inputClasses} w-full`}
											{...register("description")}
										/>
										{errors.description ? <p className="mt-1 text-[13px] text-danger">{errors.description.message}</p> : null}
									</div>
									<div>
										<input
											type="number"
											step="0.01"
											min="0.01"
											defaultValue={1}
											aria-label="Cantidad"
											className={`${inputClasses} w-full text-right`}
											{...register("quantity", { valueAsNumber: true })}
										/>
										{errors.quantity ? <p className="mt-1 text-[13px] text-danger">{errors.quantity.message}</p> : null}
									</div>
									<div>
										<input
											type="number"
											step="0.01"
											min="0"
											aria-label="Precio unitario"
											className={`${inputClasses} w-full text-right`}
											{...register("unitPrice", { valueAsNumber: true })}
										/>
										{errors.unitPrice ? <p className="mt-1 text-[13px] text-danger">{errors.unitPrice.message}</p> : null}
									</div>
									<div className="flex items-center justify-end font-mono text-sm text-tertiary">
										—
									</div>
									<div className="flex items-center justify-end gap-1">
										<button type="submit" disabled={isSubmitting} aria-label="Guardar línea" className="flex size-7 items-center justify-center rounded-md text-success hover:bg-success-soft">
											{isSubmitting ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Check aria-hidden className="size-3.5" />}
										</button>
										<button type="button" onClick={cancelAdd} aria-label="Cancelar" className="flex size-7 items-center justify-center rounded-md text-tertiary hover:bg-surface-hover hover:text-primary">
											<X aria-hidden className="size-3.5" />
										</button>
									</div>
								</form>
							</li>
						) : null}
					</ul>

					{items.length > 0 ? (
						<div className="flex items-center justify-end gap-4 border-t border-line px-3 py-3">
							<span className="text-xs font-medium text-secondary">
								Total
							</span>
							<span className="font-mono text-sm font-semibold text-primary">
								{formatCurrency(total, currency)}
							</span>
						</div>
					) : null}
				</div>
			)}
		</section>
	);
}
