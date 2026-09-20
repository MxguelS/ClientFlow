"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { InvoiceEditDialog, type InvoiceEditClient } from "@/components/invoices/invoice-edit-dialog";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/date-only";
import { formatCurrency } from "@/lib/invoices/money";

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-2.5">
			<span className="shrink-0 text-xs font-medium text-secondary">
				{label}
			</span>
			<span className="min-w-0 truncate text-right text-sm text-primary">
				{value ?? <span className="text-tertiary">—</span>}
			</span>
		</div>
	);
}

export function InvoicePanel({
	invoice,
	clients,
}: {
	invoice: {
		id: string;
		invoiceNumber: string;
		clientId: string;
		clientName: string;
		status: string;
		currency: string;
		issueDate: string;
		dueDate: string | null;
		notes: string | null;
		total: number;
		createdAt: string;
		updatedAt: string;
	};
	clients: InvoiceEditClient[];
}) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<div className="flex items-start justify-between gap-4 border-b border-line pb-5">
				<div className="min-w-0">
					<h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-primary">
						{invoice.invoiceNumber}
					</h1>
					<div className="mt-2">
						<InvoiceStatusBadge status={invoice.status} />
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<Button type="button" variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
						<Pencil aria-hidden="true" className="size-3.5" />
						Editar
					</Button>
					<Button type="button" variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setDeleteOpen(true)}>
						<Trash2 aria-hidden="true" className="size-3.5" />
						Eliminar
					</Button>
				</div>
			</div>

			<section className="border-b border-line py-2" aria-label="Datos de la factura">
				<InfoRow label="Cliente" value={<span className="text-accent">{invoice.clientName}</span>} />
				<InfoRow label="Total" value={formatCurrency(invoice.total, invoice.currency)} />
				<InfoRow label="Emisión" value={formatDateOnly(invoice.issueDate)} />
				<InfoRow label="Vencimiento" value={invoice.dueDate ? formatDateOnly(invoice.dueDate) : null} />
			</section>

			<section className="border-b border-line py-4" aria-label="Notas de la factura">
			<p className="text-sm font-semibold text-primary">Notas</p>
				{invoice.notes ? (
					<p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">
						{invoice.notes}
					</p>
				) : (
					<p className="mt-2 text-sm text-tertiary">Sin notas.</p>
				)}
			</section>

			<p className="pt-3 font-mono text-[10px] text-tertiary">
				Creado {dateTimeFormatter.format(new Date(invoice.createdAt))} · Actualizado{" "}
				{dateTimeFormatter.format(new Date(invoice.updatedAt))}
			</p>

			<InvoiceEditDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				invoice={{
					id: invoice.id,
					clientId: invoice.clientId,
					invoiceNumber: invoice.invoiceNumber,
					status: invoice.status,
					currency: invoice.currency,
					issueDate: invoice.issueDate,
					dueDate: invoice.dueDate,
					notes: invoice.notes,
				}}
				clients={clients}
			/>
			<DeleteInvoiceDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				invoice={{ id: invoice.id, invoiceNumber: invoice.invoiceNumber }}
			/>
		</>
	);
}
