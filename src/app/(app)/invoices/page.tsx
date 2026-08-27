import type { InvoiceRow } from "@/components/invoices/invoices-view";
import { InvoicesView } from "@/components/invoices/invoices-view";
import { createClient } from "@/lib/supabase/server";
import { calculateInvoiceTotal } from "@/lib/invoices/money";

export const metadata = { title: "Facturas · ClientFlow" };

export default async function InvoicesPage() {
	const supabase = await createClient();
	const [{ data: invoices }, { data: clients }] = await Promise.all([
		supabase
			.from("invoices")
			.select(
				"id, invoice_number, status, currency, issue_date, due_date, client:clients(name), items:invoice_items(quantity, unit_price)",
			)
			.order("created_at", { ascending: false }),
		supabase.from("clients").select("id, name").order("name"),
	]);

	const rows: InvoiceRow[] = (invoices ?? []).map((invoice) => {
		const client =
			typeof invoice.client === "object" && invoice.client !== null
				? invoice.client
				: null;
		const items = Array.isArray(invoice.items) ? invoice.items : [];
		return {
			id: invoice.id,
			invoiceNumber: invoice.invoice_number,
			clientName: client?.name ?? "",
			status: invoice.status,
			issueDate: invoice.issue_date,
			dueDate: invoice.due_date,
			total: calculateInvoiceTotal(items),
			currency: invoice.currency,
		};
	});

	const dialogClients = (clients ?? []).map((c) => ({
		id: c.id,
		name: c.name,
	}));

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<InvoicesView invoices={rows} clients={dialogClients} />
		</div>
	);
}