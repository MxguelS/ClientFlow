import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoicePanel } from "@/components/invoices/invoice-panel";
import { InvoiceItemsSection } from "@/components/invoices/invoice-items-section";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { createClient } from "@/lib/supabase/server";
import { calculateInvoiceTotal } from "@/lib/invoices/money";

export const metadata = { title: "Factura · ClientFlow" };

export default async function InvoiceDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();
	const [
		{ data: invoice },
		{ data: clients },
		{ data: allInvoices },
	] = await Promise.all([
		supabase
			.from("invoices")
			.select(
				"id, invoice_number, status, currency, issue_date, due_date, notes, created_at, updated_at, client_id, client:clients(name), items:invoice_items(id, description, quantity, unit_price)",
			)
			.eq("id", id)
			.maybeSingle(),
		supabase.from("clients").select("id, name").order("name"),
		supabase
			.from("invoices")
			.select("id, invoice_number, status")
			.order("created_at", { ascending: false }),
	]);

	if (!invoice) notFound();

	const client =
		typeof invoice.client === "object" && invoice.client !== null
			? invoice.client
			: null;
	if (!client) notFound();

	const items = Array.isArray(invoice.items) ? invoice.items : [];

	const dialogClients = (clients ?? []).map((c) => ({
		id: c.id,
		name: c.name,
	}));

	return (
		<div className="cf-page-enter mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary">
				<ArrowLeft aria-hidden="true" className="size-3.5" />
				Facturas
			</Link>

			<div className="mt-4 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
				<aside className="hidden lg:block" aria-label="Lista de facturas">
					<p className="border-b border-line pb-2 text-xs font-medium text-secondary">
						Todas las facturas
					</p>
					<ul className="mt-1">
						{allInvoices?.map((row) => (
							<li key={row.id}>
								<Link
									href={`/invoices/${row.id}`}
									aria-current={row.id === invoice.id ? "page" : undefined}
									className={`flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${row.id === invoice.id ? "bg-accent-soft font-medium text-accent-strong" : "text-secondary hover:bg-surface-hover hover:text-primary"}`}
								>
									<span className="min-w-0 truncate">{row.invoice_number}</span>
									<InvoiceStatusBadge status={row.status} />
								</Link>
							</li>
						))}
					</ul>
				</aside>

				<div className="min-w-0">
					<InvoicePanel
						invoice={{
							id: invoice.id,
							invoiceNumber: invoice.invoice_number,
							clientId: invoice.client_id,
							clientName: client.name,
							status: invoice.status,
							currency: invoice.currency,
							issueDate: invoice.issue_date,
							dueDate: invoice.due_date,
							notes: invoice.notes,
							total: calculateInvoiceTotal(items),
							createdAt: invoice.created_at,
							updatedAt: invoice.updated_at,
						}}
						clients={dialogClients}
					/>
					<InvoiceItemsSection
						items={items.map((item) => ({
							id: item.id,
							description: item.description,
							quantity: item.quantity,
							unit_price: item.unit_price,
						}))}
						invoiceId={invoice.id}
						currency={invoice.currency}
					/>
				</div>
			</div>
		</div>
	);
}
