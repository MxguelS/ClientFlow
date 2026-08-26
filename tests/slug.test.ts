import { describe, expect, it } from "vitest";

import { MAX_SLUG_ATTEMPTS, slugCandidate, slugify } from "@/lib/auth/slug";

describe("slugify", () => {
	it("normaliza el ejemplo del ticket", () => {
		expect(slugify("Estudio Antonio")).toBe("estudio-antonio");
	});

	it("elimina acentos y diacríticos", () => {
		expect(slugify("Diseño Ávila & Hijos")).toBe("diseno-avila-hijos");
	});

	it("colapsa separadores consecutivos", () => {
		expect(slugify("  A   --  B  ")).toBe("a-b");
	});

	it("elimina guiones de los extremos", () => {
		expect(slugify("--hola--")).toBe("hola");
	});

	it("devuelve fallback cuando no hay caracteres válidos", () => {
		expect(slugify("???")).toBe("workspace");
		expect(slugify("")).toBe("workspace");
	});

	it("respeta mayúsculas/minúsculas y símbolos", () => {
		expect(slugify("Mi_WorkSpace!2026")).toBe("mi-workspace-2026");
	});
});

describe("slugCandidate", () => {
	it("el primer intento es el slug base", () => {
		expect(slugCandidate("estudio", 0)).toBe("estudio");
	});

	it("genera sufijos -2, -3 ante colisiones", () => {
		expect(slugCandidate("estudio", 1)).toBe("estudio-2");
		expect(slugCandidate("estudio", 2)).toBe("estudio-3");
	});

	it("los candidatos con sufijo caben en el máximo", () => {
		const base = slugify("w".repeat(200));
		for (let attempt = 1; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
			const candidate = slugCandidate(base, attempt);
			expect(candidate.length).toBeLessThanOrEqual(80);
			expect(candidate.endsWith(`-${attempt + 1}`)).toBe(true);
		}
	});
});
