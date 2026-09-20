export const THEME_IDS = ["mono"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "mono";

export interface ThemePreview {
	surface: string;
	accent: string;
	glow: string;
	text: string;
}

export interface ThemeDefinition {
	id: ThemeId;
	label: string;
	description: string;
	preview: ThemePreview;
}

export const THEMES: readonly ThemeDefinition[] = [
	{
		id: "mono",
		label: "Monochrome",
		description: "Black, white and neutral tones for focused work.",
		preview: {
			surface: "#141414",
			accent: "#f5f5f5",
			glow: "#737373",
			text: "#f5f5f5",
		},
	},
] as const;

export function isThemeId(value: unknown): value is ThemeId {
	return value === "mono";
}

export function getTheme(id: ThemeId): ThemeDefinition {
	return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}
