import { describe, expect, it } from "vitest";

import {
	isDeliverableStatus,
	deliverableFormSchema,
} from "@/lib/deliverables/validation";

const base = {
	title: "Propuesta final",
	projectId: "b2e8d229-f96a-48cd-ac91-24e2237ab4b0",
};

describe("deliverableFormSchema", () => {
	it("acepta el mínimo y aplica pending por defecto", () => {
		const result = deliverableFormSchema.safeParse(base);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.status).toBe("pending");
	});

	it("refleja el límite real de title entre 1 y 200", () => {
		expect(deliverableFormSchema.safeParse({ ...base, title: "" }).success).toBe(false);
		expect(
			deliverableFormSchema.safeParse({ ...base, title: "x".repeat(201) }).success,
		).toBe(false);
	});

	it("exige un projectId uuid", () => {
		expect(
			deliverableFormSchema.safeParse({ ...base, projectId: "no-uuid" }).success,
		).toBe(false);
	});

	it("acepta solo los estados reales", () => {
		for (const status of ["pending", "in_progress", "in_review", "approved"]) {
			expect(deliverableFormSchema.safeParse({ ...base, status }).success).toBe(true);
		}
		expect(
			deliverableFormSchema.safeParse({ ...base, status: "cancelled" }).success,
		).toBe(false);
	});

	it("normaliza campos opcionales vacíos a null", () => {
		const result = deliverableFormSchema.parse({
			...base,
			description: "  ",
			dueDate: "",
		});
		expect(result.description).toBeNull();
		expect(result.dueDate).toBeNull();
	});

	it("valida dueDate como DATE ISO", () => {
		expect(
			deliverableFormSchema.safeParse({ ...base, dueDate: "2026-09-01" }).success,
		).toBe(true);
		expect(
			deliverableFormSchema.safeParse({ ...base, dueDate: "01/09/2026" }).success,
		).toBe(false);
	});
});

describe("isDeliverableStatus", () => {
	it("protege el enum real", () => {
		expect(isDeliverableStatus("in_review")).toBe(true);
		expect(isDeliverableStatus("completed")).toBe(false);
	});
});
