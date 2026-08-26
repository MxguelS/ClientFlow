"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { APPEARANCES, APPEARANCE_LABELS } from "@/lib/theme/appearance";
import { THEMES, type ThemeId } from "@/lib/theme/config";

const appearanceIcons = { system: Monitor, light: Sun, dark: Moon } as const;

function ThemePreview({ theme, selected, onSelect }: { theme: (typeof THEMES)[number]; selected: boolean; onSelect: () => void }) {
	return (
		<button type="button" aria-pressed={selected} onClick={onSelect} className={`group relative overflow-hidden rounded-xl border p-2 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 ${selected ? "border-accent ring-2 ring-accent/20" : "border-line hover:border-line-strong"}`}>
			<div className="relative h-16 overflow-hidden rounded-md border border-white/10" style={{ backgroundColor: theme.preview.surface }}>
				<div className="absolute -right-8 -top-10 size-32 rounded-full opacity-45 blur-2xl" style={{ backgroundColor: theme.preview.glow }} />
				<div className="absolute bottom-0 left-0 h-1/2 w-2/3 rounded-tr-[40px] opacity-20" style={{ backgroundColor: theme.preview.accent }} />
				<div className="relative flex h-full flex-col justify-between p-3"><div className="h-1.5 w-1/3 rounded-full bg-white/20" /><div className="flex items-end justify-between"><div className="space-y-1.5"><div className="h-1.5 w-16 rounded-full bg-white/10" /><div className="h-1.5 w-10 rounded-full bg-white/10" /></div><div className="h-6 w-16 rounded border border-white/15 bg-white/5" /></div><div className="h-1.5 w-1/4 rounded-full" style={{ backgroundColor: theme.preview.accent }} /></div>
			</div>
			<div className="mt-2 flex items-center justify-between px-0.5"><span className="text-xs font-medium text-primary">{theme.label}</span>{selected ? <span className="flex size-4 items-center justify-center rounded-full bg-accent text-accent-contrast"><Check aria-hidden="true" className="size-3" /></span> : null}</div>
		</button>
	);
}

export function ThemeSelector() {
	const { appearance, theme, setAppearance, setTheme } = useTheme();

	return (
		<div className="space-y-8">
			<section>
				<div className="mb-3"><h2 className="text-sm font-semibold text-primary">Appearance</h2><p className="mt-1 text-xs text-secondary">Controla la superficie de la aplicación.</p></div>
				<div role="radiogroup" aria-label="Appearance" className="grid gap-2 sm:grid-cols-3">
					{APPEARANCES.map((value) => { const Icon = appearanceIcons[value]; return <button key={value} type="button" role="radio" aria-checked={appearance === value} onClick={() => setAppearance(value)} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${appearance === value ? "border-accent bg-accent-soft" : "border-line bg-surface-raised hover:bg-surface-hover"}`}><span className={`flex size-8 items-center justify-center rounded-md ${appearance === value ? "bg-accent text-accent-contrast" : "bg-surface-sunken text-secondary"}`}><Icon aria-hidden="true" className="size-4" /></span><span><span className="block text-sm font-medium text-primary">{APPEARANCE_LABELS[value]}</span><span className="block text-[11px] text-secondary">{value === "system" ? "Sigue el sistema" : value === "light" ? "Superficie clara" : "Superficie oscura"}</span></span></button>; })}
				</div>
			</section>
			<section>
				<div className="mb-3"><h2 className="text-sm font-semibold text-primary">Accent theme</h2><p className="mt-1 text-xs text-secondary">Elige la iluminación y el acento de ClientFlow. Los colores semánticos no cambian.</p></div>
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{THEMES.map((item) => <ThemePreview key={item.id} theme={item} selected={theme === item.id} onSelect={() => setTheme(item.id as ThemeId)} />)}</div>
			</section>
			<p className="border-t border-line pt-4 text-xs leading-5 text-tertiary">Las preferencias se guardan en este dispositivo. La sincronización por cuenta llegará más adelante.</p>
		</div>
	);
}
