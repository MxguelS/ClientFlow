"use client";

import { Menu, Search, SunMedium } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { WindowControls } from "@/components/shell/window-controls";

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
		<header className="relative z-[var(--z-topbar)] flex h-12 shrink-0 items-center border-b border-line bg-surface/80 px-3 backdrop-blur-sm md:px-4">
			<div className="hidden items-center gap-4 md:flex">
				<WindowControls maximized={maximized} onToggleSidebar={onToggleSidebar} onToggleMaximized={onToggleMaximized} />
				<div className="h-4 w-px bg-line-strong" />
				<span className="text-xs font-medium text-secondary">{workspaceName}</span>
			</div>
			<div className="flex items-center gap-2 md:hidden">
				<button type="button" aria-label="Abrir navegación" onClick={onOpenMobileNav} className="inline-flex size-8 items-center justify-center rounded-md text-secondary hover:bg-surface-hover hover:text-primary"><Menu aria-hidden="true" className="size-4" /></button>
				<span className="text-sm font-semibold tracking-tight text-primary">ClientFlow</span>
			</div>
			<div className="ml-auto flex items-center gap-1.5">
				<button type="button" onClick={onOpenPalette} aria-label="Abrir acciones rápidas" className="hidden h-8 items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 text-xs text-tertiary transition-colors hover:border-line-strong hover:text-secondary sm:flex">
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
