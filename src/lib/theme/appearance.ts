export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = (typeof APPEARANCES)[number];

export type ResolvedAppearance = "light" | "dark";

export const APPEARANCE_LABELS: Record<Appearance, string> = {
	system: "System",
	light: "Light",
	dark: "Dark",
};

/**
 * Resuelve la preferencia del usuario contra el esquema del sistema.
 * Función pura para poder testearla sin DOM.
 */
export function resolveAppearance(
	preference: Appearance,
	systemPrefersDark: boolean,
): ResolvedAppearance {
	if (preference === "system") {
		return systemPrefersDark ? "dark" : "light";
	}
	return preference;
}

export function isAppearance(value: unknown): value is Appearance {
	return (
		typeof value === "string" &&
		(APPEARANCES as readonly string[]).includes(value)
	);
}
