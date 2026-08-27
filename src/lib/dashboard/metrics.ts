import {
	addDaysISO,
	diffDaysISO,
	isValidISODate,
	todayISO,
} from "@/lib/dashboard/dates";

/**
 * Lógica pura de clasificación y métricas del dashboard.
 *
 * Definiciones basadas EXCLUSIVAMENTE en los CHECK constraints del
 * schema (ver supabase/migrations/20260825140105_initial_scheme.sql):
 *   projects.status      planning|active|on_hold|completed|cancelled
 *   deliverables.status  pending|in_progress|in_review|approved
 *   invoices.status      draft|sent|paid|overdue|cancelled
 */

export const PENDING_DELIVERABLE_STATUSES = [
	"pending",
	"in_progress",
	"in_review",
] as const;

export const AWAITING_COLLECTION_INVOICE_STATUSES = [
	"sent",
	"overdue",
] as const;

export function isOpenDeliverable(status: string): boolean {
	return (
		PENDING_DELIVERABLE_STATUSES as readonly string[]
	).includes(status);
}

/** Factura que espera cobro: emitida (sent) o marcada vencida (overdue). */
export function isAwaitingCollection(status: string): boolean {
	return (
		AWAITING_COLLECTION_INVOICE_STATUSES as readonly string[]
	).includes(status);
}

// ---------------------------------------------------------------
// Totales pendientes agrupados por moneda. NUNCA se suman monedas
// distintas entre sí; cada moneda produce su propio total.
// ---------------------------------------------------------------

export interface PendingCurrencyTotal {
	currency: string;
	total: number;
	invoices: number;
}

export interface InvoiceWithItemsForTotals {
	status: string;
	currency: string;
	items: Array<{ quantity: number; unit_price: number }>;
}

export function groupPendingTotalsByCurrency(
	invoices: InvoiceWithItemsForTotals[],
): PendingCurrencyTotal[] {
	const totals = new Map<string, PendingCurrencyTotal>();

	for (const invoice of invoices) {
		if (!isAwaitingCollection(invoice.status)) continue;

		const current = totals.get(invoice.currency) ?? {
			currency: invoice.currency,
			total: 0,
			invoices: 0,
		};

		for (const item of invoice.items) {
			current.total +=
				Math.round(item.quantity * item.unit_price * 100) / 100;
		}
		current.invoices += 1;
		totals.set(invoice.currency, current);
	}

	return [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

// ---------------------------------------------------------------
// "Requiere atención"
// ---------------------------------------------------------------

export type AttentionCategory =
	| "deliverable_overdue"
	| "invoice_overdue"
	| "deliverable_due_soon"
	| "project_due_soon";

const CATEGORY_PRIORITY: Record<AttentionCategory, number> = {
	deliverable_overdue: 0,
	invoice_overdue: 1,
	deliverable_due_soon: 2,
	project_due_soon: 3,
};

export type AttentionItem =
	| {
			category: "deliverable_overdue";
			id: string;
			href: string;
			title: string;
			projectName: string;
			dueDate: string;
			daysLate: number;
	  }
	| {
			category: "invoice_overdue";
			id: string;
			href: string;
			title: string;
			clientName: string;
			dueDate: string;
			daysLate: number;
	  }
	| {
			category: "deliverable_due_soon";
			id: string;
			href: string;
			title: string;
			projectName: string;
			dueDate: string;
	  }
	| {
			category: "project_due_soon";
			id: string;
			href: string;
			title: string;
			clientName: string;
			dueDate: string;
	  };

const UPCOMING_WINDOW_DAYS = 7;

/**
 * Clasifica entregables abiertos por fecha límite respecto a `today`.
 * `dueDate` es un valor DATE-only ("YYYY-MM-DD") del schema.
 */
function classifyOpenDeliverable(
	deliverable: { id: string; title: string; status: string; dueDate: string | null; projectName: string },
	today: string,
	out: AttentionItem[],
): void {
	if (!isOpenDeliverable(deliverable.status)) return;
	const { dueDate } = deliverable;
	if (!isValidISODate(dueDate)) return;

	const diff = diffDaysISO(today, dueDate);

	if (diff < 0) {
		out.push({
			category: "deliverable_overdue",
			id: deliverable.id,
			href: `/deliverables/${deliverable.id}`,
			title: deliverable.title,
			projectName: deliverable.projectName,
			dueDate,
			daysLate: Math.abs(diff),
		});
	} else if (diff <= UPCOMING_WINDOW_DAYS) {
		out.push({
			category: "deliverable_due_soon",
			id: deliverable.id,
			href: `/deliverables/${deliverable.id}`,
			title: deliverable.title,
			projectName: deliverable.projectName,
			dueDate,
		});
	}
}

/**
 * Facturas vencidas: esperan cobro Y su due_date ya pasó, o están
 * explícitamente marcadas 'overdue' (incluso sin fecha).
 */
function classifyInvoice(
	invoice: {
		id: string;
		status: string;
		dueDate: string | null;
		invoiceNumber: string;
		clientName: string;
	},
	today: string,
	out: AttentionItem[],
): void {
	if (!isAwaitingCollection(invoice.status)) return;

	if (invoice.status === "overdue" && !invoice.dueDate) {
		out.push({
			category: "invoice_overdue",
			id: invoice.id,
			href: `/invoices/${invoice.id}`,
			title: invoice.invoiceNumber,
			clientName: invoice.clientName,
			dueDate: "",
			daysLate: 0,
		});
		return;
	}

	const { dueDate } = invoice;
	if (!isValidISODate(dueDate)) return;

	const diff = diffDaysISO(today, dueDate);
	if (diff < 0) {
		out.push({
			category: "invoice_overdue",
			id: invoice.id,
			href: `/invoices/${invoice.id}`,
			title: invoice.invoiceNumber,
			clientName: invoice.clientName,
			dueDate,
			daysLate: Math.abs(diff),
		});
	}
}

/** Proyectos activos/planificados con deadline en la ventana próxima. */
function classifyProject(
	project: {
		id: string;
		name: string;
		status: string;
		dueDate: string | null;
		clientName: string;
	},
	today: string,
	out: AttentionItem[],
): void {
	if (project.status !== "active" && project.status !== "planning") return;
	const { dueDate } = project;
	if (!isValidISODate(dueDate)) return;

	const diff = diffDaysISO(today, dueDate);
	if (diff >= 0 && diff <= UPCOMING_WINDOW_DAYS) {
		out.push({
			category: "project_due_soon",
			id: project.id,
			href: `/projects/${project.id}`,
			title: project.name,
			clientName: project.clientName,
			dueDate,
		});
	}
}

export interface DashboardInputs {
	deliverables: Array<{
		id: string;
		title: string;
		status: string;
		dueDate: string | null;
		projectName: string;
	}>;
	invoices: Array<{
		id: string;
		invoiceNumber: string;
		status: string;
		dueDate: string | null;
		clientName: string;
	}>;
	projects: Array<{
		id: string;
		name: string;
		status: string;
		dueDate: string | null;
		clientName: string;
	}>;
	today?: string;
}

/**
 * Construye la lista consolidada "Requiere atención", ordenada por
 * prioridad de categoría y fecha dentro de cada una.
 */
export function buildAttentionItems(
	inputs: DashboardInputs,
): AttentionItem[] {
	const today = inputs.today ?? todayISO();
	const items: AttentionItem[] = [];

	for (const deliverable of inputs.deliverables)
		classifyOpenDeliverable(deliverable, today, items);
	for (const invoice of inputs.invoices)
		classifyInvoice(invoice, today, items);
	for (const project of inputs.projects)
		classifyProject(project, today, items);

	items.sort((a, b) => {
		const byCategory =
			CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category];
		if (byCategory !== 0) return byCategory;
		return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
	});

	return items;
}

/** Fin de ventana para tests/UX copy. */
export function upcomingWindowEnd(today: string): string {
	return addDaysISO(today, UPCOMING_WINDOW_DAYS);
}