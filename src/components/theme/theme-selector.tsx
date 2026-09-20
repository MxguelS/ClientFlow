"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { APPEARANCES, APPEARANCE_LABELS } from "@/lib/theme/appearance";

const appearanceIcons = { system: Monitor, light: Sun, dark: Moon } as const;

export function ThemeSelector() {
	const { appearance, setAppearance } = useTheme();

	return (
		<div className="space-y-8">
			<section>
				<div className="mb-3"><h2 className="text-sm font-semibold text-primary">Appearance</h2><p className="mt-1 text-xs text-secondary">Controla la superficie de la aplicación.</p></div>
				<div role="radiogroup" aria-label="Appearance" className="grid gap-2 sm:grid-cols-3">
					{APPEARANCES.map((value) => { const Icon = appearanceIcons[value]; return <button key={value} type="button" role="radio" aria-checked={appearance === value} onClick={() => setAppearance(value)} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${appearance === value ? "border-accent bg-accent-soft" : "border-line bg-surface-raised hover:bg-surface-hover"}`}><span className={`flex size-8 items-center justify-center rounded-md ${appearance === value ? "bg-accent text-accent-contrast" : "bg-surface-sunken text-secondary"}`}><Icon aria-hidden="true" className="size-4" /></span><span><span className="block text-sm font-medium text-primary">{APPEARANCE_LABELS[value]}</span><span className="block text-[11px] text-secondary">{value === "system" ? "Sigue el sistema" : value === "light" ? "Superficie clara" : "Superficie oscura"}</span></span></button>; })}
				</div>
			</section>
			<p className="border-t border-line pt-4 text-xs leading-5 text-tertiary">Las preferencias se guardan en este dispositivo. La sincronización por cuenta llegará más adelante.</p>
		</div>
	);
}
