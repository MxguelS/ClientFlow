import { describe, expect, it } from "vitest";

import { isProjectStatus, projectFormSchema } from "@/lib/projects/validation";

const base = {
	name: "Rediseño web",
	clientId: "b2e8d229-f96a-48cd-ac91-24e2237ab4b0",
};

describe("projectFormSchema", () => {
	it("acepta un proyecto mínimo con status por defecto", () => {
		const result = projectFormSchema.safeParse(base);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("planning");
			// Los campos ausentes llegan como undefined; el servidor los omite
			// y PostgreSQL aplica su default NULL.
			expect(result.data.budget ?? null).toBeNull();
		}
	});

	it("aplica la constraint real: name entre 1 y 150", () => {
		expect(projectFormSchema.safeParse({ ...base, name: "" }).success).toBe(false);
		expect(
			projectFormSchema.safeParse({ ...base, name: "p".repeat(151) }).success,
		).toBe(false);
	});

	it("rechaza clientId que no es uuid", () => {
		expect(
			projectFormSchema.safeParse({ ...base, clientId: "no-uuid" }).success,
		).toBe(false);
	});

	it("rechaza status fuera del enum real", () => {
		expect(
			projectFormSchema.safeParse({ ...base, status: "urgent" }).success,
		).toBe(false);
		expect(
			projectFormSchema.safeParse({ ...base, status: "on_hold" }).success,
		).toBe(true);
	});

	it("valida budget numérico >= 0 (numeric(12,2))", () => {
		expect(projectFormSchema.safeParse({ ...base, budget: 0 }).success).toBe(true);
		expect(projectFormSchema.safeParse({ ...base, budget: 1500.5 }).success).toBe(true);
		expect(projectFormSchema.safeParse({ ...base, budget: -1 }).success).toBe(false);
		expect(
			projectFormSchema.safeParse({ ...base, budget: 10_000_000_000 }).success,
		).toBe(false);
	});

	it("valida el formato de fechas y la constraint due >= start", () => {
		expect(
			projectFormSchema.safeParse({ ...base, startDate: "2026-01-15", dueDate: "2026-02-01" })
				.success,
		).toBe(true);
		expect(
			projectFormSchema.safeParse({ ...base, startDate: "2026-02-01", dueDate: "2026-01-15" })
				.success,
		).toBe(false);
		expect(
			projectFormSchema.safeParse({ ...base, startDate: "15/01/2026" }).success,
		).toBe(false);
	});

	it("normaliza strings vacíos a null", () => {
		const result = projectFormSchema.parse({
			...base,
			budget: "",
			startDate: "",
			dueDate: "",
			description: "  ",
		});
		expect(result.budget).toBeNull();
		expect(result.startDate).toBeNull();
		expect(result.dueDate).toBeNull();
		expect(result.description).toBeNull();
	});
});

describe("isProjectStatus", () => {
	it("guarda el enum real", () => {
		expect(isProjectStatus("on_hold")).toBe(true);
		expect(isProjectStatus("paused")).toBe(false);
	});
});
