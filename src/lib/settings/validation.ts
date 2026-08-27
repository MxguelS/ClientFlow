import { z } from "zod";

import { WORKSPACE_NAME_MAX } from "@/lib/validation";

/**
 * Coincide exactamente con las constraints reales:
 *   profiles.full_name   -> text (null permitido, pero UI exige valor)
 *   workspaces.name      -> check (char_length between 1 and 100)
 *
 * El email NO es editable aquí: pertenece a Supabase Auth y cambiarlo
 * implica un flujo dedicado de re-autenticación/confirmación.
 */
export const PROFILE_NAME_MAX = 100;

const nameField = z
	.string()
	.trim()
	.min(1, "El nombre es obligatorio")
	.max(
		PROFILE_NAME_MAX,
		`El nombre no puede superar ${PROFILE_NAME_MAX} caracteres`,
	);

export const profileSettingsSchema = z.object({
	fullName: nameField,
});

export type ProfileSettingsInput = z.input<typeof profileSettingsSchema>;
export type ProfileSettingsData = z.output<typeof profileSettingsSchema>;

/** El id del workspace NUNCA llega del cliente: se resuelve server-side. */
export const workspaceSettingsSchema = z.object({
	name: nameField.max(
		WORKSPACE_NAME_MAX,
		`El nombre no puede superar ${WORKSPACE_NAME_MAX} caracteres`,
	),
});

export type WorkspaceSettingsInput = z.input<typeof workspaceSettingsSchema>;
export type WorkspaceSettingsData = z.output<typeof workspaceSettingsSchema>;

export function parseProfileSettings(
	input: unknown,
): { ok: true; data: ProfileSettingsData } | { ok: false } {
	const result = profileSettingsSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}

export function parseWorkspaceSettings(
	input: unknown,
): { ok: true; data: WorkspaceSettingsData } | { ok: false } {
	const result = workspaceSettingsSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}