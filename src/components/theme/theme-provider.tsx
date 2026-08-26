"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import {
	resolveAppearance,
	type Appearance,
	type ResolvedAppearance,
} from "@/lib/theme/appearance";
import {
	DEFAULT_THEME,
	isThemeId,
	type ThemeId,
} from "@/lib/theme/config";
import {
	readStoredAppearance,
	readStoredTheme,
	writeAppearance,
	writeTheme,
} from "@/lib/theme/storage";

interface ThemeContextValue {
	appearance: Appearance;
	resolvedAppearance: ResolvedAppearance;
	theme: ThemeId;
	setAppearance: (value: Appearance) => void;
	setTheme: (value: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	// El script anti-FOUC ya dejó los atributos correctos en <html>;
	// el estado de React arranca en sync con ellos.
	const [appearance, setAppearanceState] = useState<Appearance>("system");
	const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
	const [systemDark, setSystemDark] = useState(false);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		// La lectura de preferencias ocurre una sola vez al montar el provider.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setAppearanceState(readStoredAppearance() ?? "system");
		const storedTheme = readStoredTheme();
		setThemeState(isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME);
		setSystemDark(systemPrefersDark());
		setHydrated(true);
	}, []);

	// System reacciona a cambios de prefers-color-scheme en vivo.
	useEffect(() => {
		if (!hydrated || appearance !== "system") return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = (event: MediaQueryListEvent) => {
			setSystemDark(event.matches);
		};

		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [appearance, hydrated]);

	const resolvedAppearance = resolveAppearance(appearance, systemDark);

	// Refleja el estado en <html> (el script inicial solo cubre el
	// primer pintado; los cambios en caliente pasan por aquí).
	useEffect(() => {
		if (!hydrated) return;
		document.documentElement.setAttribute(
			"data-appearance",
			resolvedAppearance,
		);
	}, [resolvedAppearance, hydrated]);

	useEffect(() => {
		if (!hydrated) return;
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme, hydrated]);

	const setAppearance = useCallback((value: Appearance) => {
		setAppearanceState(value);
		writeAppearance(value);
	}, []);

	const setTheme = useCallback((value: ThemeId) => {
		setThemeState(value);
		writeTheme(value);
	}, []);

	const value = useMemo(
		() => ({
			appearance,
			resolvedAppearance,
			theme,
			setAppearance,
			setTheme,
		}),
		[appearance, resolvedAppearance, theme, setAppearance, setTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
	}
	return context;
}
