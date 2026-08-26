import { DEFAULT_THEME } from "@/lib/theme/config";
import { isAppearance, type Appearance } from "@/lib/theme/appearance";

export const APPEARANCE_STORAGE_KEY = "cf.appearance";
export const THEME_STORAGE_KEY = "cf.theme";
export const SIDEBAR_STORAGE_KEY = "cf.sidebar-collapsed";

export function readStoredAppearance(): Appearance | null {
	try {
		const value = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
		return isAppearance(value) ? value : null;
	} catch {
		return null;
	}
}

export function readStoredTheme(): string {
	try {
		return window.localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
}

export function writeAppearance(value: Appearance): void {
	try {
		window.localStorage.setItem(APPEARANCE_STORAGE_KEY, value);
	} catch {
		/* almacenamiento no disponible: la preferencia vive solo en memoria */
	}
}

export function writeTheme(value: string): void {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, value);
	} catch {
		/* almacenamiento no disponible: la preferencia vive solo en memoria */
	}
}
