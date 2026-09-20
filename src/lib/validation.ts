import { z } from "zod";

/**
 * Coincide con la constraint real de la BD:
 * workspaces.name -> check (char_length(name) between 1 and 100)
 */
export const WORKSPACE_NAME_MAX = 100;

const emailField = z.email("Introduce un email válido").trim();

const passwordField = z
	.string()
	.min(8, "La contraseña debe tener al menos 8 caracteres");

export const registerSchema = z
	.object({
		fullName: z
			.string()
			.trim()
			.min(1, "El nombre es obligatorio")
			.max(WORKSPACE_NAME_MAX, `Máximo ${WORKSPACE_NAME_MAX} caracteres`),
		email: emailField,
		password: passwordField,
		confirmPassword: z.string().min(1, "Confirma tu contraseña"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	email: emailField,
	password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordRecoveryRequestSchema = z.object({ email: emailField });

export type PasswordRecoveryRequestInput = z.infer<typeof passwordRecoveryRequestSchema>;

export const passwordResetSchema = z
	.object({
		password: passwordField,
		confirmPassword: z.string().min(1, "Confirma tu contraseña"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const onboardingSchema = z.object({
	workspaceName: z
		.string()
		.trim()
		.min(1, "El nombre del workspace es obligatorio")
		.max(
			WORKSPACE_NAME_MAX,
			`Máximo ${WORKSPACE_NAME_MAX} caracteres`,
		),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
