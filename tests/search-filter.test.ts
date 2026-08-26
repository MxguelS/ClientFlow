import { describe, expect, it } from "vitest";

import { filterByQuery, normalizeText } from "@/lib/search/filter";

interface Row {
	name: string;
	email: string | null;
}

const rows: Row[] = [
	{ name: "Acme Corporation", email: "hola@acme.com" },
	{ name: "Berta Consultoría", email: null },
	{ name: "acme studios", email: "info@studios.com" },
];

describe("search filter", () => {
	it("normaliza acentos y mayúsculas", () => {
		expect(normalizeText("  Configuración  ")).toBe("configuracion");
	});

	it("devuelve todas las filas sin consulta", () => {
		expect(filterByQuery(rows, "", (row) => [row.name, row.email])).toHaveLength(3);
	});

	it("filtra por cualquier campo y es insensible a acentos", () => {
		expect(filterByQuery(rows, "acme", (r) => [r.name, r.email])).toHaveLength(2);
		expect(
			filterByQuery(rows, "berta consultoria", (r) => [r.name, r.email]),
		).toHaveLength(1);
	});

	it("exige todas las palabras (AND)", () => {
		expect(filterByQuery(rows, "acme hola", (r) => [r.name, r.email])).toHaveLength(1);
		expect(filterByQuery(rows, "acme inexistente", (r) => [r.name, r.email])).toEqual([]);
	});
});
