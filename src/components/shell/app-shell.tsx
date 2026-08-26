"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/command/command-palette";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { SIDEBAR_STORAGE_KEY } from "@/lib/theme/storage";
import { useEffect, useState } from "react";

export function AppShell({
	children,
	user,
	workspace,
}: {
	children: React.ReactNode;
	user: { name: string; email: string };
	workspace: { name: string; slug: string };
}) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [maximized, setMaximized] = useState(false);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	useEffect(() => {
		try {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
		} catch {
			// El shell funciona aunque localStorage no esté disponible.
		}
	}, []);

	function toggleSidebar() {
		setSidebarCollapsed((value) => {
			const next = !value;
			try { window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch { /* memoria */ }
			return next;
		});
	}

	useEffect(() => {
		function onShortcut(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setPaletteOpen(true);
			}
		}
		window.addEventListener("keydown", onShortcut);
		return () => window.removeEventListener("keydown", onShortcut);
	}, []);

	return (
		<TooltipProvider>
			<div className={`relative z-[var(--z-window)] flex h-dvh w-full items-center justify-center transition-[padding] duration-200 ease-flow ${maximized ? "p-0" : "p-0 sm:p-1"}`}>
				<div className={`relative isolate flex h-full w-full flex-col overflow-hidden border border-line-strong bg-surface shadow-window transition-[border-radius] duration-200 ease-flow ${maximized ? "rounded-none" : "rounded-none sm:rounded-lg"}`}>
					<div aria-hidden="true" className="cf-ambient-glow">
						<div className="cf-ambient-glow-a" />
						<div className="cf-ambient-glow-b" />
					</div>
					<Topbar workspaceName={workspace.name} maximized={maximized} onToggleSidebar={toggleSidebar} onToggleMaximized={() => setMaximized((value) => !value)} onOpenPalette={() => setPaletteOpen(true)} onOpenMobileNav={() => setMobileNavOpen(true)} />
					<div className="flex min-h-0 flex-1">
						<div className="hidden md:flex"><Sidebar workspaceName={workspace.name} user={user} collapsed={sidebarCollapsed} onToggle={toggleSidebar} /></div>
						<main className="min-w-0 flex-1 overflow-y-auto bg-background/65">{children}</main>
					</div>
				</div>
			</div>

			<Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
				<DialogContent showClose={false} className="left-0 top-0 h-full w-72 -translate-x-0 -translate-y-0 rounded-none border-y-0 border-l-0 p-0 sm:hidden">
					<DialogTitle className="sr-only">Navegación</DialogTitle>
					<Sidebar workspaceName={workspace.name} user={user} collapsed={false} onToggle={() => setMobileNavOpen(false)} onNavigate={() => setMobileNavOpen(false)} />
				</DialogContent>
			</Dialog>
			<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
		</TooltipProvider>
	);
}
