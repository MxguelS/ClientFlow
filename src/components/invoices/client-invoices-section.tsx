"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { InvoiceCreateDialog } from "@/components/invoices/invoice-create-dialog";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/date-only";
import { formatCurrency } from "@/lib/invoices/money";

export function ClientInvoicesSection({
	invoices,
	clients,
}: {
	invoices: Array<{
		id: string;
		invoiceNumber: string;
		status: string;
		total: number;
		currency: string;
		issueDate: string;
	}>;
	clients: { id: string; name: string }[];
}) {
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<section className="border-b border-line py-4" aria-label="Facturación del cliente">
			<div className="flex items-center justify-between gap-3">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
					Facturación
				</p>
				<Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
					<Plus aria-hidden="true" className="size-3.5" />
					Nueva factura
				</Button>
			</div>

			{invoices.length === 0 ? (
				<p className="mt-2 text-sm text-tertiary">
					Este cliente todavía no tiene facturas.
				</p>
			) : (
				<ul className="mt-2 border-y border-line">
					{invoices.map((invoice) => (
						<li key={invoice.id} className="border-b border-line last:border-b-0">
							<Link
								href={`/invoices/${invoice.id}`}
								className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-2 py-2.5 transition-colors hover:bg-surface-hover sm:grid-cols-[minmax(0,1fr)_130px_130px]"
							>
								<span className="truncate text-sm font-medium text-primary">
									{invoice.invoiceNumber}
								</span>
								<InvoiceStatusBadge status={invoice.status} />
								<span className="col-span-2 text-right font-mono text-xs text-primary sm:col-span-1">
									{formatCurrency(invoice.total, invoice.currency)} · {formatDateOnly(invoice.issueDate)}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			<InvoiceCreateDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				clients={clients}
			/>
		</section>
	);
}