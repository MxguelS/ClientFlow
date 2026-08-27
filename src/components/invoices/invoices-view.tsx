"use client";

import { ListFilter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Input, selectClasses } from "@/components/ui/input";
import { formatDateOnly } from "@/lib/dates/date-only";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from "@/lib/invoices/validation";
import { formatCurrency } from "@/lib/invoices/money";
import { filterByQuery } from "@/lib/search/filter";
import { InvoiceCreateDialog } from "@/components/invoices/invoice-create-dialog";

export interface InvoiceRow {
	id: string;
	invoiceNumber: string;
	clientName: string;
	status: string;
	issueDate: string;
	dueDate: string | null;
	total: number;
	currency: string;
}

export function InvoicesView({
	invoices,
	clients,
}: {
	invoices: InvoiceRow[];
	clients: { id: string; name: string }[];
}) {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("all");
	const [createOpen, setCreateOpen] = useState(
		searchParams.get("create") === "1",
	);

	useEffect(() => {
		if (searchParams.get("create") !== "1") return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCreateOpen(true);
		const url = new URL(window.location.href);
		url.searchParams.delete("create");
		window.history.replaceState(null, "", url.toString());
	}, [searchParams]);

	const filtered = useMemo(() => {
		const searched = filterByQuery(invoices, query, (inv) => [
			inv.invoiceNumber,
			inv.clientName,
		]);
		return status === "all"
			? searched
			: searched.filter((inv) => inv.status === status);
	}, [invoices, query, status]);

	const hasInvoices = invoices.length > 0;

	return (
		<div>
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-[-0.03em] text-primary">
					Facturas
				</h1>
				{clients.length > 0 ? (
					<Button type="button" onClick={() => setCreateOpen(true)}>
						<Plus aria-hidden="true" className="size-4" />
						Nueva factura
					</Button>
				) : null}
			</div>

			{!hasInvoices && clients.length === 0 ? (
				<div className="mt-6 border-y border-line py-14 text-center">
					<p className="text-sm font-medium text-primary">
						Primero necesitas un cliente.
					</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Las facturas se emiten siempre a un cliente de tu workspace.
					</p>
					<Link
						href="/clients"
						className="mt-5 inline-flex h-10 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-primary transition-colors hover:bg-surface-hover"
					>
						Ir a Clientes
					</Link>
				</div>
			) : !hasInvoices ? (
				<div className="mt-6 border-y border-line py-14 text-center">
					<p className="text-sm font-medium text-primary">
						Todavía no hay facturas.
					</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Crea la primera para comenzar a facturar a tus clientes.
					</p>
					<Button
						type="button"
						variant="secondary"
						className="mt-5"
						onClick={() => setCreateOpen(true)}
					>
						<Plus aria-hidden="true" className="size-4" />
						Crear primera factura
					</Button>
				</div>
			) : (
				<>
					<div className="mt-5 flex max-w-2xl flex-col gap-2 sm:flex-row">
						<div className="relative min-w-0 flex-1">
							<Search
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary"
							/>
							<Input
								type="search"
								placeholder="Buscar por número o cliente..."
								aria-label="Buscar facturas"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="relative sm:w-44">
							<ListFilter
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary"
							/>
							<select
								aria-label="Filtrar por estado"
								className={`${selectClasses} pl-9`}
								value={status}
								onChange={(event) => setStatus(event.target.value)}
							>
								<option value="all">Todos</option>
								{INVOICE_STATUSES.map((value) => (
									<option key={value} value={value}>
										{INVOICE_STATUS_LABELS[value]}
									</option>
								))}
							</select>
						</div>
					</div>

					{filtered.length === 0 ? (
						<div className="mt-6 border-y border-line py-12 text-center">
							<p className="text-sm font-medium text-primary">Sin resultados.</p>
							<p className="mt-1.5 text-sm text-secondary">
								Ninguna factura coincide con esta búsqueda o filtro.
							</p>
						</div>
					) : (
						<div className="mt-4 border-y border-line">
							<div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_120px_100px_120px] gap-4 border-b border-line px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary md:grid">
								<span>Número</span>
								<span>Cliente</span>
								<span>Estado</span>
								<span className="text-right">Total</span>
								<span className="text-right">Emisión</span>
							</div>
							<ul>
								{filtered.map((invoice) => (
									<li key={invoice.id} className="border-b border-line last:border-b-0">
										<Link
											href={`/invoices/${invoice.id}`}
											className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 transition-colors hover:bg-surface-hover md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_120px_100px_120px]"
										>
											<span className="min-w-0">
												<span className="block truncate text-sm font-medium text-primary">
													{invoice.invoiceNumber}
												</span>
												<span className="mt-0.5 block truncate text-xs text-tertiary md:hidden">
													{invoice.clientName}
												</span>
											</span>
											<span className="hidden min-w-0 truncate text-sm text-secondary md:block">
												{invoice.clientName}
											</span>
											<span className="justify-self-start md:justify-self-auto">
												<InvoiceStatusBadge status={invoice.status} />
											</span>
											<span className="text-right font-mono text-xs text-primary">
												{formatCurrency(invoice.total, invoice.currency)}
											</span>
											<span className="text-right font-mono text-[10px] text-tertiary md:text-xs">
												{formatDateOnly(invoice.issueDate)}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</>
			)}

			{clients.length > 0 ? (
				<InvoiceCreateDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					clients={clients}
				/>
			) : null}
		</div>
	);
}