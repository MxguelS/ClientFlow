import { describe, expect, it } from "vitest";

import {
	clientFormSchema,
	isClientStatus,
	parseClientForm,
} from "@/lib/clients/validation";

describe("clientFormSchema", () => {
	it("acepta un cliente mínimo válido con status por defecto", () => {
		const result = clientFormSchema.safeParse({ name: "Acme" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("active");
			expect(result.data.company).toBeNull();
			expect(result.data.email).toBeNull();
		}
	});

	it("aplica la constraint real de BD: name entre 1 y 150", () => {
		expect(clientFormSchema.safeParse({ name: "" }).success).toBe(false);
		expect(clientFormSchema.safeParse({ name: "   " }).success).toBe(false);
		expect(
			clientFormSchema.safeParse({ name: "c".repeat(150) }).success,
		).toBe(true);
		expect(
			clientFormSchema.safeParse({ name: "c".repeat(151) }).success,
		).toBe(false);
	});

	it("rechaza status fuera del enum real de la BD", () => {
		expect(
			clientFormSchema.safeParse({ name: "Acme", status: "vip" }).success,
		).toBe(false);
		expect(
			clientFormSchema.safeParse({ name: "Acme", status: "lead" }).success,
		).toBe(true);
	});

	it("valida formato de email solo cuando se proporciona", () => {
		expect(
			clientFormSchema.safeParse({ name: "Acme", email: "" }).success,
		).toBe(true);
		expect(
			clientFormSchema.safeParse({ name: "Acme", email: "no-email" })
				.success,
		).toBe(false);
		expect(
			clientFormSchema.safeParse({ name: "Acme", email: "a@b.com" })
				.success,
		).toBe(true);
	});

	it("normaliza strings vacíos a null y recorta espacios", () => {
		const result = clientFormSchema.parse({
			name: "  Acme  ",
			company: "  ",
			email: "",
			phone: " 555 ",
			notes: "",
			status: "inactive",
		});
		expect(result.name).toBe("Acme");
		expect(result.company).toBeNull();
		expect(result.email).toBeNull();
		expect(result.phone).toBe("555");
		expect(result.notes).toBeNull();
	});
});

describe("parseClientForm", () => {
	it("devuelve ok con datos normalizados", () => {
		const result = parseClientForm({ name: "Acme", status: "lead" });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.data.status).toBe("lead");
	});

	it("devuelve ok:false ante payload inválido sin lanzar", () => {
		expect(parseClientForm({ name: "" }).ok).toBe(false);
		expect(parseClientForm(null).ok).toBe(false);
		expect(parseClientForm("string").ok).toBe(false);
	});
});

describe("isClientStatus", () => {
	it("guarda el enum real", () => {
		expect(isClientStatus("active")).toBe(true);
		expect(isClientStatus("otro")).toBe(false);
		expect(isClientStatus(undefined)).toBe(false);
	});
});
