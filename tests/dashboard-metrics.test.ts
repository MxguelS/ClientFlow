import { describe, it, expect } from "vitest";

import {
	todayISO,
	addDaysISO,
	diffDaysISO,
} from "@/lib/dashboard/dates";
import {
	isOpenDeliverable,
	isAwaitingCollection,
	groupPendingTotalsByCurrency,
	buildAttentionItems,
	upcomingWindowEnd,
	type DashboardInputs,
} from "@/lib/dashboard/metrics";

describe("date helpers", () => {
	it("todayISO returns an ISO date string", () => {
		expect(todayISO(new Date("2026-09-01T12:34:56Z"))).toBe("2026-09-01");
	});

	it("addDaysISO crosses month boundaries without timezone drift", () => {
		expect(addDaysISO("2026-08-31", 1)).toBe("2026-09-01");
		expect(addDaysISO("2026-02-28", 1)).toBe("2026-03-01");
	});

	it("addDaysISO handles year rollover", () => {
		expect(addDaysISO("2025-12-30", 3)).toBe("2026-01-02");
	});

	it("diffDaysISO computes signed day difference", () => {
		expect(diffDaysISO("2026-09-01", "2026-08-25")).toBe(-7);
		expect(diffDaysISO("2026-09-01", "2026-09-01")).toBe(0);
		expect(diffDaysISO("2026-09-01", "2026-09-15")).toBe(14);
	});

	it("upcomingWindowEnd is 7 days ahead", () => {
		expect(upcomingWindowEnd("2026-08-26")).toBe("2026-09-02");
	});
});

describe("status predicates (schema-backed)", () => {
	it("deliverable open = pending | in_progress | in_review", () => {
		expect(isOpenDeliverable("pending")).toBe(true);
		expect(isOpenDeliverable("in_progress")).toBe(true);
		expect(isOpenDeliverable("in_review")).toBe(true);
		expect(isOpenDeliverable("approved")).toBe(false);
	});

	it("invoice awaiting collection = sent | overdue", () => {
		expect(isAwaitingCollection("sent")).toBe(true);
		expect(isAwaitingCollection("overdue")).toBe(true);
		expect(isAwaitingCollection("draft")).toBe(false);
		expect(isAwaitingCollection("paid")).toBe(false);
		expect(isAwaitingCollection("cancelled")).toBe(false);
	});
});

describe("groupPendingTotalsByCurrency", () => {
	const base: DashboardInputs["invoices"] extends undefined
		? never
		: Parameters<typeof groupPendingTotalsByCurrency>[0][number] = {
			status: "sent",
			currency: "USD",
			items: [{ quantity: 2, unit_price: 100 }],
		};

	it("sums items of awaiting-collection invoices only", () => {
		const totals = groupPendingTotalsByCurrency([
			{ status: "draft", currency: "USD", items: [{ quantity: 999, unit_price: 999 }] },
			{ status: "paid", currency: "USD", items: [{ quantity: 999, unit_price: 999 }] },
			{ status: "cancelled", currency: "USD", items: [] },
			base,
		]);
		expect(totals).toEqual([{ currency: "USD", total: 200, invoices: 1 }]);
	});

	it("never mixes currencies — groups them separately and sorted", () => {
		const totals = groupPendingTotalsByCurrency([
			{ status: "sent", currency: "EUR", items: [{ quantity: 1, unit_price: 50 }] },
			{ status: "overdue", currency: "USD", items: [{ quantity: 3, unit_price: 19.99 }] },
			{ status: "sent", currency: "EUR", items: [{ quantity: 2, unit_price: 25.1 }] },
		]);

		expect(totals).toEqual([
			{ currency: "EUR", total: 100.2, invoices: 2 },
			{ currency: "USD", total: 59.97, invoices: 1 },
		]);
	});

	it("keeps money precision on classic floating-point traps", () => {
		const totals = groupPendingTotalsByCurrency([
			{ status: "sent", currency: "USD", items: [
				{ quantity: 3, unit_price: 0.1 },
				{ quantity: 2, unit_price: 100.5 },
				{ quantity: 1, unit_price: 9999.99 },
			] },
		]);
		expect(totals[0]?.total).toBeCloseTo(10201.29, 10);
	});

	it("returns empty array with no pending invoices", () => {
		expect(groupPendingTotalsByCurrency([])).toEqual([]);
	});
});

describe("buildAttentionItems", () => {
	const today = "2026-08-26";

	function run(partial: Partial<DashboardInputs>): ReturnType<typeof buildAttentionItems> {
		return buildAttentionItems({
			deliverables: partial.deliverables ?? [],
			invoices: partial.invoices ?? [],
			projects: partial.projects ?? [],
			today,
		});
	}

	it("empty workspace produces empty attention list", () => {
		expect(run({})).toEqual([]);
	});

	it("classifies overdue deliverable even weeks late, ignoring approved ones", () => {
		const items = run({
			deliverables: [
				{ id: "d-approved", title: "Aprobado", status: "approved", dueDate: "2026-01-01", projectName: "P" },
				{ id: "d-late", title: "Módulo X", status: "in_progress", dueDate: "2026-07-01", projectName: "Proyecto UI" },
				{ id: "d-nodate", title: "Sin fecha", status: "pending", dueDate: null, projectName: "P" },
			],
		});

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			category: "deliverable_overdue",
			id: "d-late",
			daysLate: 56,
			href: "/deliverables/d-late",
		});
	});

	it("overdue invoice surfaces via due_date; explicit overdue without date also surfaces", () => {
		const items = run({
			invoices: [
				{ id: "f1", invoiceNumber: "F-001", status: "sent", dueDate: "2026-08-19", clientName: "Cliente A" },
				{ id: "f2", invoiceNumber: "F-002", status: "overdue", dueDate: null, clientName: "Cliente B" },
				{ id: "f3", invoiceNumber: "F-003", status: "paid", dueDate: "2020-01-01", clientName: "C" },
			],
		});

		expect(items.map((i) => i.id)).toEqual(["f1", "f2"]);
	});

	it("due today counts as deliverable_due_soon boundary, tomorrow window inclusive", () => {
		const items = run({
			deliverables: [
				{ id: "d-today", title: "Vence hoy", status: "pending", dueDate: "2026-08-26", projectName: "P" },
				{ id: "d-window", title: "En ventana", status: "in_review", dueDate: "2026-09-02", projectName: "P" },
				{ id: "d-far", title: "Lejos", status: "pending", dueDate: "2026-09-03", projectName: "P" },
			],
		});

		expect(items.map((i) => i.id)).toEqual(["d-today", "d-window"]);
	});

	it("sorts by category priority then date ascending", () => {
		const items = run({
			invoices: [
				{ id: "inv", invoiceNumber: "F-010", status: "overdue", dueDate: "2026-08-10", clientName: "C" },
			],
			deliverables: [
				{ id: "d-old", title: "Muy vencido", status: "pending", dueDate: "2026-06-01", projectName: "P" },
				{ id: "d-soon", title: "Próximo", status: "pending", dueDate: "2026-08-27", projectName: "P" },
			],
			projects: [
				{ id: "p1", name: "Deadline próximo", status: "active", dueDate: "2026-08-29", clientName: "C" },
			],
		});

		expect(items.map((i) => i.category)).toEqual([
			"deliverable_overdue",
			"invoice_overdue",
			"deliverable_due_soon",
			"project_due_soon",
		]);
	});

	it("projects near deadline are listed; completed/cancelled ignored", () => {
		const items = run({
			projects: [
				{ id: "p-active", name: "Activo", status: "active", dueDate: "2026-08-30", clientName: "C" },
				{ id: "p-completed", name: "Completado", status: "completed", dueDate: "2026-08-30", clientName: "C" },
				{ id: "p-cancelled", name: "Cancelado", status: "cancelled", dueDate: "2026-08-30", clientName: "C" },
				{ id: "p-hold", name: "En pausa", status: "on_hold", dueDate: "2026-08-30", clientName: "C" },
			],
		});

		expect(items).toHaveLength(1);
		expect(items[0]?.id).toBe("p-active");
	});
});