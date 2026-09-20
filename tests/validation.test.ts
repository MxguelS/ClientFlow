import { describe, expect, it } from "vitest";

import {
	loginSchema,
	onboardingSchema,
	passwordRecoveryRequestSchema,
	passwordResetSchema,
	registerSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
	const valid = {
		fullName: "Antonio Ruiz",
		email: "antonio@example.com",
		password: "secreto123",
		confirmPassword: "secreto123",
	};

	it("acepta datos válidos", () => {
		expect(registerSchema.safeParse(valid).success).toBe(true);
	});

	it("rechaza nombre vacío o solo espacios", () => {
		expect(
			registerSchema.safeParse({ ...valid, fullName: "   " }).success,
		).toBe(false);
	});

	it("rechaza email inválido", () => {
		expect(
			registerSchema.safeParse({ ...valid, email: "no-email" }).success,
		).toBe(false);
	});

	it("rechaza contraseñas menores de 8 caracteres", () => {
		const result = registerSchema.safeParse({
			...valid,
			password: "corta12",
			confirmPassword: "corta12",
		});
		expect(result.success).toBe(false);
	});

	it("rechaza cuando la confirmación no coincide y apunta al campo correcto", () => {
		const result = registerSchema.safeParse({
			...valid,
			confirmPassword: "distinta123",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toEqual([
				"confirmPassword",
			]);
			expect(result.error.issues[0]?.message).toContain("coinciden");
		}
	});
});

describe("loginSchema", () => {
	it("acepta credenciales bien formadas", () => {
		expect(
			loginSchema.safeParse({
				email: "a@b.com",
				password: "loquesea1",
			}).success,
		).toBe(true);
	});

	it("exige password no vacío", () => {
		expect(
			loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
		).toBe(false);
	});
});

describe("passwordResetSchema", () => {
	it("acepta contraseñas válidas y coincidentes", () => {
		expect(passwordResetSchema.safeParse({ password: "secreto123", confirmPassword: "secreto123" }).success).toBe(true);
	});

	it("rechaza contraseñas diferentes o demasiado cortas", () => {
		expect(passwordResetSchema.safeParse({ password: "secreto123", confirmPassword: "diferente" }).success).toBe(false);
		expect(passwordResetSchema.safeParse({ password: "corta12", confirmPassword: "corta12" }).success).toBe(false);
	});

	it("valida el email usado para solicitar recuperación", () => {
		expect(passwordRecoveryRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
		expect(passwordRecoveryRequestSchema.safeParse({ email: "no-email" }).success).toBe(false);
	});
});

describe("onboardingSchema", () => {
	it("acepta un nombre de workspace válido", () => {
		expect(
			onboardingSchema.safeParse({
				workspaceName: "Estudio Antonio",
			}).success,
		).toBe(true);
	});

	it("aplica el límite real de la BD: char_length(name) <= 100", () => {
		expect(
			onboardingSchema.safeParse({
				workspaceName: "w".repeat(100),
			}).success,
		).toBe(true);
		expect(
			onboardingSchema.safeParse({
				workspaceName: "w".repeat(101),
			}).success,
		).toBe(false);
	});

	it("rechaza cadena vacía tras recortar espacios", () => {
		expect(
			onboardingSchema.safeParse({ workspaceName: "   " }).success,
		).toBe(false);
	});
});
