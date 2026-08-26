// Forzamos una timezone UTC negativa (el escenario del ticket) ANTES de
// cualquier uso de Date, para demostrar que el resultado no depende de la
// zona horaria de la máquina.
process.env.TZ = "America/Panama";

import { describe, expect, it } from "vitest";

import { formatDateOnly } from "@/lib/dates/date-only";

describe("formatDateOnly", () => {
	it("muestra la fecha almacenada exacta, sin desplazamiento por timezone", () => {
		expect(formatDateOnly("2026-09-01")).toBe("01 sept 2026");
		expect(formatDateOnly("2026-01-01")).toBe("01 ene 2026");
		expect(formatDateOnly("2026-12-31")).toBe("31 dic 2026");
	});

	it("devuelve el valor original si no tiene formato YYYY-MM-DD", () => {
		expect(formatDateOnly("sin-fecha")).toBe("sin-fecha");
	});
});
