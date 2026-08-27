import { ArrowRight, CalendarClock, Plus, Receipt } from "lucide-react";
import Link from "next/link";

import { DeliverableStatusBadge } from "@/components/deliverables/deliverable-status-badge";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import {
	todayISO,
	diffDaysISO,
} from "@/lib/dashboard/dates";
import {
	buildAttentionItems,
	groupPendingTotalsByCurrency,
	type AttentionItem,
} from "@/lib/dashboard/metrics";
import { formatDateOnly } from "@/lib/dates/date-only";
import { formatCurrency } from "@/lib/invoices/money";
import { calculateInvoiceTotal } from "@/lib/invoices/money";
import { getCurrentUser, getPrimaryMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · ClientFlow" };

const budgetFormatter = new Intl.NumberFormat("es-ES", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2,
});

// ---------------------------------------------------------------
// Piezas de composición (server components locales)
// ---------------------------------------------------------------

function StatBlock({
	label,
	value,
	href,
}: {
	label: string;
	value: React.ReactNode;
	href?: string;
}) {
	const inner = (
		<div className="py-4">
			<p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">{label}</p>
			<p className="mt-2 text-lg font-semibold tabular-nums tracking-[-0.01em] text-primary">{value}</p>
		</div>
	);

	if (!href) return <div>{inner}</div>;

	return (
		<Link
			href={href}
			className="block transition-colors hover:bg-surface-hover"
			aria-label={`${label} — ver detalles`}
		>
			{inner}
		</Link>
	);
}

function SectionHeader({
	title,
	count,
	viewAllHref,
	viewAllLabel,
}: {
	title: string;
	count?: number;
	viewAllHref?: string;
	viewAllLabel: string;
}) {
	return (
		<div className="flex items-center justify-between gap-3 py-3">
			<div className="flex items-center gap-2.5">
				<h2 className="text-sm font-semibold text-primary">{title}</h2>
				{typeof count === "number" ? (
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
						{count} {count === 1 ? "item" : "items"}
					</span>
				) : null}
			</div>
			<Link
				href={viewAllHref ?? ""}
				className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-secondary transition-colors hover:text-primary"
			>
				{viewAllLabel}
				<ArrowRight aria-hidden="true" className="size-3" />
			</Link>
		</div>
	);
}

function EmptyNote({ children }: { children: React.ReactNode }) {
	return <p className="py-4 text-sm leading-6 text-tertiary">{children}</p>;
}

const CATEGORY_LABELS: Record<AttentionItem["category"], string> = {
	deliverable_overdue: "Entregable vencido",
	invoice_overdue: "Factura vencida",
	deliverable_due_soon: "Entregable próximo a vencer",
	project_due_soon: "Proyecto con fecha próxima",
};

function AttentionRow({ item, today }: { item: AttentionItem; today: string }) {
	let description = "";
	switch (item.category) {
		case "deliverable_overdue":
			description = `Venció hace ${item.daysLate} ${item.daysLate === 1 ? "día" : "días"} en ${item.projectName}`;
			break;
		case "deliverable_due_soon": {
			const diff = diffDaysISO(today, item.dueDate);
			description = diff === 0 ? "Vence hoy" : `Vence el ${formatDateOnly(item.dueDate)} · ${diff} ${diff === 1 ? "día" : "días"}`;
			break;
		}
		case "invoice_overdue":
			description = item.dueDate
				? `Sin cobrar — venció hace ${item.daysLate} ${item.daysLate === 1 ? "día" : "días"}`
				: "Marcada como vencida, sin fecha de cobro registrada";
			break;
		case "project_due_soon":
			description = `Fecha límite el ${formatDateOnly(item.dueDate)}`;
			break;
	}

	return (
		<li className="border-b border-line last:border-b-0">
			<Link
				href={item.href}
				className="flex items-start justify-between gap-4 px-1 py-3 transition-colors hover:bg-surface-hover"
			>
				<span className="min-w-0">
					<span className="block truncate text-sm font-medium text-primary">{item.title}</span>
					<span className="mt-0.5 block truncate text-xs text-secondary">
						{description} · {CATEGORY_LABELS[item.category]}
					</span>
				</span>
				<ArrowUpRightIcon />
			</Link>
		</li>
	);
}

function ArrowUpRightIcon() {
	return <ArrowRight aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-tertiary -rotate-45" />;
}

function RowLink({
	children,
	href,
}: {
	children: React.ReactNode;
	href: string;
}) {
	return (
		<li className="border-b border-line last:border-b-0">
			<Link
				href={href}
				className="flex items-center justify-between gap-4 px-1 py-2.5 transition-colors hover:bg-surface-hover"
			>
				{children}
				<ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-tertiary" />
			</Link>
		</li>
	);
}

// ---------------------------------------------------------------
// Página
// ---------------------------------------------------------------

export default async function DashboardPage() {
	const user = await getCurrentUser();
	const membership = await getPrimaryMembership();
	const supabase = await createClient();

	const today = todayISO();
	const displayNameResult = user
		? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
		: null;

	const [{ data: projects }, { data: deliverables }, { data: invoices }, { count: clientsCount }] =
		await Promise.all([
			supabase
				.from("projects")
				.select(
					"id, name, status, budget, due_date, created_at, client_id, client:clients(name)",
				)
				.order("created_at", { ascending: false }),
			supabase
				.from("deliverables")
				.select(
					"id, title, status, due_date, project_id, project:projects(name)",
				)
				.order("created_at", { ascending: false }),
			supabase
				.from("invoices")
				.select(
					"id, invoice_number, status, currency, issue_date, due_date, client:clients(name), items:invoice_items(quantity, unit_price)",
				)
				.order("created_at", { ascending: false }),
			supabase.from("clients").select("id", { count: "exact", head: true }),
		]);

	// --- Métricas (definiciones basadas solo en CHECK constraints) ---
	const activeProjectsCount = (projects ?? []).filter(
		(project) => project.status === "active",
	).length;
	const pendingDeliverablesCount = (deliverables ?? []).filter(
		(d) => d.status !== "approved",
	).length;
	const pendingInvoicesRows = (invoices ?? []).filter(
		(inv) => inv.status === "sent" || inv.status === "overdue",
	);
	const pendingCurrencyTotals = groupPendingTotalsByCurrency(
		(invoices ?? []).map((inv) => ({
			status: inv.status,
			currency: inv.currency,
			items: Array.isArray(inv.items) ? inv.items : [],
		})),
	);

	// --- Requiere atención ---
	const attentionItems = buildAttentionItems({
		deliverables: (deliverables ?? []).map((d) => ({
			id: d.id,
			title: d.title,
			status: d.status,
			dueDate: d.due_date,
			projectName:
				typeof d.project === "object" && d.project !== null
					? (d.project.name as string)
					: "",
		})),
		invoices: (invoices ?? []).map((inv) => ({
			id: inv.id,
			invoiceNumber: inv.invoice_number,
			status: inv.status,
			dueDate: inv.due_date,
			clientName:
				typeof inv.client === "object" && inv.client !== null
					? (inv.client.name as string)
					: "",
		})),
		projects: (projects ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			status: p.status,
			dueDate: p.due_date,
			clientName:
				typeof p.client === "object" && p.client !== null
					? (p.client.name as string)
					: "",
		})),
		today,
	});

	// --- Listas recortadas ---
	const recentProjects = (projects ?? []).slice(0, 4);
	const openDeliverablesSorted = (deliverables ?? [])
		.filter((d) => d.status !== "approved" && d.due_date !== null)
		.sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
		.slice(0, 4);
	const visibleInvoices = [...pendingInvoicesRows]
		.sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
		.slice(0, 4);

	const dateLabel = new Intl.DateTimeFormat("es-ES", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date());

	const hasProjects = (projects?.length ?? 0) > 0;
	const hasClients = (clientsCount ?? 0) > 0;

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			{/* HEADER */}
			<header className="flex items-end justify-between gap-4 border-b border-line pb-5">
				<div className="min-w-0">
					<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">
						{dateLabel} · Hoy
					</p>
					<h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-primary sm:text-3xl">
						Hola,{" "}
						{
							displayNameResult?.data?.full_name ||
							user?.email?.split("@")[0] ||
							membership?.workspaceName
						}
					</h1>
					<p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
						{membership?.workspaceName}
					</p>
				</div>
				<ButtonGroup />
			</header>

			{/* RESUMEN OPERATIVO — máx. 4 indicadores */}
			<section
				aria-label="Resumen operativo"
				className="grid grid-cols-2 divide-line border-b border-line sm:divide-x lg:grid-cols-4"
			>
				<StatBlock label="Proyectos activos" value={activeProjectsCount} href="/projects" />
				<StatBlock label="Entregables pendientes" value={pendingDeliverablesCount} href="/deliverables" />
				<StatBlock label="Facturas por cobrar" value={pendingInvoicesRows.length} href="/invoices" />
				<StatBlock
					label="Pendiente de cobro"
					value={
						pendingCurrencyTotals.length === 0 ? (
							"—"
						) : pendingCurrencyTotals.length === 1 && pendingCurrencyTotals[0] ? (
							formatCurrency(pendingCurrencyTotals[0].total, pendingCurrencyTotals[0].currency)
						) : (
							pendingCurrencyTotals
								.map((t) => `${t.currency} ${formatCurrency(t.total, t.currency)}`)
								.join(" · ")
						)
					}
					href="/invoices"
				/>
			</section>

			{/* REQUIERE ATENCIÓN */}
			<section aria-label="Requiere atención" className="border-b border-line">
				<div className="flex items-center justify-between py-3">
					<div className="flex items-center gap-2.5">
						<CalendarClock aria-hidden="true" className="size-4 text-accent" />
						<h2 className="text-sm font-semibold text-primary">Requiere atención</h2>
					</div>
					{attentionItems.length > 0 ? (
						<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
							{attentionItems.length} {attentionItems.length === 1 ? "pendiente" : "pendientes"}
						</span>
					) : null}
				</div>
				{attentionItems.length === 0 ? (
					<EmptyNote>
						Todo al día. No hay entregables vencidos ni facturas pendientes de revisión.
					</EmptyNote>
				) : (
					<ul className="pb-2">
						{attentionItems.slice(0, 8).map((item) => (
							<AttentionRow key={`${item.category}-${item.id}`} item={item} today={today} />
						))}
					</ul>
				)}
			</section>

			{/* PROYECTOS RECIENTES */}
			<section aria-label="Proyectos recientes" className="border-b border-line">
				<SectionHeader title="Proyectos" viewAllHref="/projects" viewAllLabel="Ver todos" count={projects?.length || 0} />
				{recentProjects.length === 0 ? (
					<EmptyNote>
						Aún no hay proyectos.
						{hasClients ? null : " Crea primero un cliente y después tu primer proyecto."}
					</EmptyNote>
				) : (
					<ul className="pb-2">
						{recentProjects.map((project) => {
							const clientName =
								typeof project.client === "object" && project.client !== null
									? (project.client.name as string)
									: "";
							return (
								<RowLink key={project.id} href={`/projects/${project.id}`}>
									<span className="min-w-0">
										<span className="block truncate text-sm font-medium text-primary">{project.name}</span>
										<span className="block truncate text-xs text-tertiary">
											{clientName || "—"}
											{project.budget !== null ? ` · ${budgetFormatter.format(project.budget)}` : ""}
											{project.due_date ? ` · vence ${formatDateOnly(project.due_date)}` : ""}
										</span>
									</span>
									<ProjectStatusBadge status={project.status} />
								</RowLink>
							);
						})}
					</ul>
				)}
			</section>

			{/* ENTREGABLES PRÓXIMOS */}
			<section aria-label="Entregables próximos" className="border-b border-line">
				<SectionHeader title="Entregables" viewAllHref="/deliverables" viewAllLabel="Ver todos" count={pendingDeliverablesCount} />
				{openDeliverablesSorted.length === 0 ? (
					<EmptyNote>{hasProjects ? "Sin entregables abiertos con fecha." : "Los entregables aparecerán al crearlos dentro de un proyecto."}</EmptyNote>
				) : (
					<ul className="pb-2">
						{openDeliverablesSorted.map((deliverable) => (
							<RowLink key={deliverable.id} href={`/deliverables/${deliverable.id}`}>
								<span className="min-w-0">
									<span className="block truncate text-sm font-medium text-primary">{deliverable.title}</span>
									<span className="block truncate text-xs text-tertiary">
										{(typeof deliverable.project === "object" && deliverable.project !== null
											? (deliverable.project.name as string)
											: "") + (deliverable.due_date ? ` · ${formatDateOnly(deliverable.due_date)}` : "")}
									</span>
								</span>
								<DeliverableStatusBadge status={deliverable.status} />
							</RowLink>
						))}
					</ul>
				)}
			</section>

			{/* FACTURACIÓN */}
			<section aria-label="Facturación" className="border-b border-line pb-2">
				<div className="flex items-center justify-between gap-3 py-3">
					<div className="flex items-center gap-2.5">
						<Receipt aria-hidden="true" className="size-4 text-accent" />
						<h2 className="text-sm font-semibold text-primary">Facturación</h2>
					</div>
					<Link href="/invoices" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-secondary transition-colors hover:text-primary">
						Ver todas
						<ArrowRight aria-hidden="true" className="size-3" />
					</Link>
				</div>

				{visibleInvoices.length === 0 ? (
					<EmptyNote>No hay facturas esperando cobro.</EmptyNote>
				) : (
					<ul>
						{visibleInvoices.map((invoice) => {
							const clientName =
								typeof invoice.client === "object" && invoice.client !== null
									? (invoice.client.name as string)
									: "";
							const items = Array.isArray(invoice.items) ? invoice.items : [];
							return (
								<RowLink key={invoice.id} href={`/invoices/${invoice.id}`}>
									<span className="min-w-0">
										<span className="block truncate font-mono text-xs font-medium text-primary">{invoice.invoice_number}</span>
										<span className="block truncate text-xs text-tertiary">
											{clientName || "—"}
											{invoice.due_date ? ` · vencimiento ${formatDateOnly(invoice.due_date)}` : ""}
										</span>
									</span>
									<span className="flex shrink-0 items-center gap-3">
										<span className="font-mono text-xs tabular-nums text-primary">
											{formatCurrency(calculateInvoiceTotal(items), invoice.currency)}
										</span>
										<InvoiceStatusBadge status={invoice.status} />
									</span>
								</RowLink>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}

function ButtonGroup() {
	return (
		<Link
			href="/projects?create=1"
			className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-accent px-3.5 text-sm font-medium text-accent-contrast shadow-subtle transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
		>
			<Plus aria-hidden="true" className="size-4" />
			Nuevo proyecto
		</Link>
	);
}