import { describe, expect, it } from "vitest";

import { parsePublicEnv, publicEnvSchema } from "@/lib/env";

const VALID_ENV = {
	NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
};

describe("parsePublicEnv", () => {
	it("acepta un entorno válido", () => {
		const env = parsePublicEnv(VALID_ENV);

		expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(
			"http://127.0.0.1:54321",
		);
		expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
			"sb_publishable_test_key",
		);
	});

	it("rechaza cuando falta la URL de Supabase", () => {
		expect(() =>
			parsePublicEnv({
				NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
					VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
			}),
		).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
	});

	it("rechaza cuando falta la clave pública", () => {
		expect(() =>
			parsePublicEnv({
				NEXT_PUBLIC_SUPABASE_URL: VALID_ENV.NEXT_PUBLIC_SUPABASE_URL,
			}),
		).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
	});

	it("rechaza una URL inválida", () => {
		expect(() =>
			parsePublicEnv({
				...VALID_ENV,
				NEXT_PUBLIC_SUPABASE_URL: "no-es-una-url",
			}),
		).toThrow();
	});

	it("el schema expone exactamente las dos variables públicas", () => {
		expect(Object.keys(publicEnvSchema.shape)).toEqual([
			"NEXT_PUBLIC_SUPABASE_URL",
			"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		]);
	});
});
