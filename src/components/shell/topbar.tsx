"use client";

import { Maximize2, Menu, PanelLeft, Search, SunMedium } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";

export function Topbar({
	workspaceName,
	maximized,
	onToggleSidebar,
	onToggleMaximized,
	onOpenPalette,
	onOpenMobileNav,
}: {
	workspaceName: string;
	maximized: boolean;
	onToggleSidebar: () => void;
	onToggleMaximized: () => void;
	onOpenPalette: () => void;
	onOpenMobileNav: () => void;
}) {
	return (
		<header className="relative z-[var(--z-topbar)] flex h-12 shrink-0 items-center border-b border-line bg-surface px-3 md:px-4">
			<div className="hidden items-center gap-4 md:flex">
				<button type="button" aria-label="Alternar barra lateral" onClick={onToggleSidebar} className="inline-flex size-7 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"><PanelLeft aria-hidden="true" className="size-3.5" /></button>
				<button type="button" aria-label={maximized ? "Restaurar ventana" : "Maximizar ventana"} onClick={onToggleMaximized} className="inline-flex size-7 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"><Maximize2 aria-hidden="true" className="size-3.5" /></button>
				<div className="h-4 w-px bg-line-strong" />
				<span className="text-xs font-medium text-secondary">{workspaceName}</span>
			</div>
			<div className="flex items-center gap-2 md:hidden">
				<button type="button" aria-label="Abrir navegación" onClick={onOpenMobileNav} className="inline-flex size-8 items-center justify-center rounded-md text-secondary hover:bg-surface-hover hover:text-primary"><Menu aria-hidden="true" className="size-4" /></button>
				<span className="text-sm font-semibold tracking-tight text-primary">ClientFlow</span>
			</div>
			<div className="ml-auto flex items-center gap-1.5">
				<button type="button" onClick={onOpenPalette} aria-label="Abrir acciones rápidas" className="hidden h-8 items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 text-xs text-secondary transition-colors hover:border-line-strong hover:text-primary sm:flex">
					<Search aria-hidden="true" className="size-3.5" /><span>Acciones rápidas</span><Kbd>Cmd K</Kbd>
				</button>
				<Tooltip content="Acciones rápidas">
					<button type="button" onClick={onOpenPalette} aria-label="Abrir acciones rápidas" className="inline-flex size-8 items-center justify-center rounded-md text-secondary hover:bg-surface-hover hover:text-primary sm:hidden"><Search aria-hidden="true" className="size-4" /></button>
				</Tooltip>
				<Tooltip content="Cambiar apariencia">
					<button type="button" onClick={onOpenPalette} aria-label="Cambiar apariencia" className="inline-flex size-8 items-center justify-center rounded-md text-secondary hover:bg-surface-hover hover:text-primary"><SunMedium aria-hidden="true" className="size-4" /></button>
				</Tooltip>
			</div>
		</header>
	);
}
