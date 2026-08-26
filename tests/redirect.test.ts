import { describe, expect, it } from "vitest";

import { resolveAuthRedirect } from "@/lib/auth/redirect";

const anonymous = { isAuthenticated: false, hasWorkspace: false };
const withoutWorkspace = { isAuthenticated: true, hasWorkspace: false };
const withWorkspace = { isAuthenticated: true, hasWorkspace: true };

describe("resolveAuthRedirect", () => {
	it("anónimo en rutas protegidas va a /login", () => {
		expect(resolveAuthRedirect("/dashboard", anonymous)).toBe("/login");
		expect(resolveAuthRedirect("/onboarding", anonymous)).toBe("/login");
	});

	it("anónimo permanece en rutas públicas", () => {
		expect(resolveAuthRedirect("/", anonymous)).toBeNull();
		expect(resolveAuthRedirect("/login", anonymous)).toBeNull();
		expect(resolveAuthRedirect("/register", anonymous)).toBeNull();
	});

	it("autenticado sin workspace: dashboard -> onboarding", () => {
		expect(
			resolveAuthRedirect("/dashboard", withoutWorkspace),
		).toBe("/onboarding");
	});

	it("autenticado sin workspace permanece en onboarding", () => {
		expect(resolveAuthRedirect("/onboarding", withoutWorkspace)).toBeNull();
	});

	it("autenticado con workspace: onboarding -> dashboard", () => {
		expect(resolveAuthRedirect("/onboarding", withWorkspace)).toBe(
			"/dashboard",
		);
	});

	it("autenticado con workspace permanece en dashboard", () => {
		expect(resolveAuthRedirect("/dashboard", withWorkspace)).toBeNull();
	});

	it("autenticado en /login o /register sale según su estado", () => {
		expect(resolveAuthRedirect("/login", withWorkspace)).toBe("/dashboard");
		expect(resolveAuthRedirect("/register", withWorkspace)).toBe(
			"/dashboard",
		);
		expect(resolveAuthRedirect("/login", withoutWorkspace)).toBe(
			"/onboarding",
		);
		expect(resolveAuthRedirect("/register", withoutWorkspace)).toBe(
			"/onboarding",
		);
	});

	it("no produce loops: ningún destino vuelve a redirigir al origen", () => {
		for (const path of ["/", "/login", "/register", "/onboarding", "/dashboard"]) {
			for (const state of [anonymous, withoutWorkspace, withWorkspace]) {
				const target = resolveAuthRedirect(path, state);
				if (target === null) continue;
				const second = resolveAuthRedirect(target, state);
				expect(second).toBeNull();
			}
		}
	});
});
