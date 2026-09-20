import { describe, expect, it } from "vitest";

import { resolveAppearance } from "@/lib/theme/appearance";
import { THEMES, THEME_IDS, isThemeId } from "@/lib/theme/config";

describe("appearance", () => {
	it("resuelve system según prefers-color-scheme", () => {
		expect(resolveAppearance("system", true)).toBe("dark");
		expect(resolveAppearance("system", false)).toBe("light");
	});

	it("mantiene light y dark explícitos", () => {
		expect(resolveAppearance("light", true)).toBe("light");
		expect(resolveAppearance("dark", false)).toBe("dark");
	});
});

describe("monochrome theme", () => {
	it("expone una única paleta sin ids duplicados", () => {
		expect(THEMES.map((theme) => theme.id)).toEqual(THEME_IDS);
		expect(THEMES).toHaveLength(1);
		expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(1);
	});

	it("cada preview tiene superficie, acento, glow y texto", () => {
		for (const theme of THEMES) {
			expect(theme.label.length).toBeGreaterThan(0);
			for (const value of Object.values(theme.preview)) {
				expect(value).toMatch(/^#[0-9a-f]{6}$/i);
			}
		}
	});

	it("valida ids externos sin aceptar valores arbitrarios", () => {
		expect(isThemeId("mono")).toBe(true);
		expect(isThemeId("midnight")).toBe(false);
		expect(isThemeId("neon-pink")).toBe(false);
		expect(isThemeId(null)).toBe(false);
	});
});
