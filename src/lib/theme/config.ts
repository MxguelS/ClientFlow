export const THEME_IDS = [
	"midnight",
	"crimson",
	"ocean",
	"aurora",
	"ember",
	"forest",
	"mono",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "midnight";

export interface ThemePreview {
	/** Fondo de superficie de la miniatura */
	surface: string;
	/** Color de acento principal */
	accent: string;
	/** Color ambiental del glow */
	glow: string;
	/** Texto sobre la superficie de la miniatura */
	text: string;
}

export interface ThemeDefinition {
	id: ThemeId;
	label: string;
	description: string;
	preview: ThemePreview;
}

/**
 * Paletas diseñadas a mano. Los valores de preview son independientes de
 * las CSS variables para que cada tarjeta muestre SIEMPRE su propio tema.
 *
 * El acento NO altera los colores semánticos (success/warning/danger).
 */
export const THEMES: readonly ThemeDefinition[] = [
	{
		id: "midnight",
		label: "Midnight",
		description: "Azul índigo nocturno. El original de ClientFlow.",
		preview: {
			surface: "#141419",
			accent: "#6E79F4",
			glow: "#4C51D6",
			text: "#E4E4EA",
		},
	},
	{
		id: "crimson",
		label: "Crimson",
		description: "Rojo profundo y preciso, para sesiones intensas.",
		preview: {
			surface: "#171214",
			accent: "#E5484D",
			glow: "#B03A3E",
			text: "#EAE2E3",
		},
	},
	{
		id: "ocean",
		label: "Ocean",
		description: "Cian calmado con profundidad marina.",
		preview: {
			surface: "#0F1518",
			accent: "#26A6C6",
			glow: "#1D7F98",
			text: "#DFE9EC",
		},
	},
	{
		id: "aurora",
		label: "Aurora",
		description: "Violeta boreal con destello magnético.",
		preview: {
			surface: "#131019",
			accent: "#9B6DE8",
			glow: "#6D4BC7",
			text: "#E7E2EF",
		},
	},
	{
		id: "ember",
		label: "Ember",
		description: "Naranja brasa, cálido sin ser estridente.",
		preview: {
			surface: "#171310",
			accent: "#E8873C",
			glow: "#C05F1D",
			text: "#EFE7DE",
		},
	},
	{
		id: "forest",
		label: "Forest",
		description: "Verde bosque estable y concentrado.",
		preview: {
			surface: "#101512",
			accent: "#3FA96F",
			glow: "#2C7A50",
			text: "#E0EAE4",
		},
	},
	{
		id: "mono",
		label: "Mono",
		description: "Neutro absoluto. Cero color, máxima sobriedad.",
		preview: {
			surface: "#131315",
			accent: "#A0A0A8",
			glow: "#6B6B72",
			text: "#E8E8EA",
		},
	},
] as const;

export function isThemeId(value: unknown): value is ThemeId {
	return (
		typeof value === "string" &&
		(THEME_IDS as readonly string[]).includes(value)
	);
}

export function getTheme(id: ThemeId): ThemeDefinition {
	return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}
