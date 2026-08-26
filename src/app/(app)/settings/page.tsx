import { Palette } from "lucide-react";

import { ThemeSelector } from "@/components/theme/theme-selector";

export const metadata = { title: "Ajustes · ClientFlow" };

export default function SettingsPage() {
	return (
		<div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 lg:px-10">
			<header className="border-b border-line pb-5">
				<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">Preferencias</p>
				<div className="mt-2 flex items-center gap-2.5"><Palette aria-hidden="true" className="size-4 text-accent" /><h1 className="text-2xl font-semibold tracking-[-0.03em] text-primary">Ajustes</h1></div>
				<p className="mt-1.5 max-w-xl text-sm text-secondary">Personaliza la apariencia de tu espacio de trabajo.</p>
			</header>
			<div className="mt-8 pb-8"><ThemeSelector /></div>
		</div>
	);
}
