"use client";

import {
	SlidersHorizontal,
	ArrowRight,
	Command,
	FolderKanban,
	House,
	ListChecks,
	LogOut,
	Moon,
	Plus,
	Receipt,
	Search,
	Sun,
	SunMoon,
	Users,
	} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useTheme } from "@/components/theme/theme-provider";
import { filterCommands, type CommandItem } from "@/lib/command/filter";
import { createClient } from "@/lib/supabase/client";

type Action = CommandItem & {
	icon: typeof House;
	shortcut?: string;
	action: () => void;
	accent?: string;
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const router = useRouter();
	const { setAppearance } = useTheme();
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const close = useCallback(() => onOpenChange(false), [onOpenChange]);
	const navigate = useCallback((path: string) => { close(); router.push(path); }, [close, router]);
	const logout = useCallback(async () => { close(); await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }, [close, router]);

	// Actions capture the current router/theme callbacks for this palette.
	const actions = useMemo<Action[]>(() => [
		{ id: "dashboard", label: "Ir al dashboard", keywords: ["inicio home resumen"], group: "Navegación", icon: House, shortcut: "G D", action: () => navigate("/dashboard") },
		{ id: "clients", label: "Ir a Clientes", keywords: ["clientes customers"], group: "Navegación", icon: Users, shortcut: "G C", action: () => navigate("/clients") },
		{ id: "projects", label: "Ir a Proyectos", keywords: ["proyectos projects"], group: "Navegación", icon: FolderKanban, shortcut: "G P", action: () => navigate("/projects") },
		{ id: "deliverables", label: "Ir a Entregables", keywords: ["entregables deliverables"], group: "Navegación", icon: ListChecks, shortcut: "G E", action: () => navigate("/deliverables") },
		{ id: "invoices", label: "Ir a Facturación", keywords: ["facturas invoices billing"], group: "Navegación", icon: Receipt, shortcut: "G I", action: () => navigate("/invoices") },
		{ id: "new-client", label: "Nuevo cliente", keywords: ["crear cliente añadir"], group: "Navegación", icon: Plus, shortcut: "N C", action: () => navigate("/clients?create=1") },
		{ id: "new-project", label: "Nuevo proyecto", keywords: ["crear proyecto añadir"], group: "Navegación", icon: Plus, shortcut: "N P", action: () => navigate("/projects?create=1") },
		{ id: "new-deliverable", label: "Nuevo entregable", keywords: ["crear entregable añadir"], group: "Navegación", icon: Plus, shortcut: "N E", action: () => navigate("/deliverables?create=1") },
		{ id: "new-invoice", label: "Nueva factura", keywords: ["crear factura añadir"], group: "Navegación", icon: Plus, shortcut: "N I", action: () => navigate("/invoices?create=1") },
		{ id: "settings", label: "Abrir ajustes", keywords: ["configuracion preferencias"], group: "Navegación", icon: SlidersHorizontal, shortcut: "G S", action: () => navigate("/settings") },
		{ id: "appearance-system", label: "Apariencia: System", keywords: ["tema automatico"], group: "Apariencia", icon: SunMoon, action: () => { setAppearance("system"); close(); } },
		{ id: "appearance-light", label: "Apariencia: Light", keywords: ["tema claro"], group: "Apariencia", icon: Sun, action: () => { setAppearance("light"); close(); } },
		{ id: "appearance-dark", label: "Apariencia: Dark", keywords: ["tema oscuro"], group: "Apariencia", icon: Moon, action: () => { setAppearance("dark"); close(); } },
		{ id: "logout", label: "Cerrar sesión", keywords: ["salir logout"], group: "Cuenta", icon: LogOut, action: logout },
	], [close, logout, navigate, setAppearance]);

	const filtered = useMemo(() => filterCommands(actions, query), [actions, query]);

	useEffect(() => { if (open) { // eslint-disable-next-line react-hooks/set-state-in-effect
		setQuery(""); setActiveIndex(0); requestAnimationFrame(() => inputRef.current?.focus()); } }, [open]);
	const safeActiveIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

	function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % Math.max(filtered.length, 1)); }
		if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + filtered.length) % Math.max(filtered.length, 1)); }
		if (event.key === "Enter" && filtered[safeActiveIndex]) { event.preventDefault(); filtered[safeActiveIndex].action(); }
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showClose={false} className="top-[18%] -translate-y-0! p-0 sm:max-w-xl">
				<DialogTitle className="sr-only">Acciones rápidas</DialogTitle>
				<DialogDescription className="sr-only">Busca una acción y pulsa Enter para ejecutarla.</DialogDescription>
				<div className="flex items-center gap-3 border-b border-line px-4">
					<Search aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
					<input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Buscar acciones..." aria-label="Buscar acciones" aria-controls="command-list" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary" />
					<Kbd>Esc</Kbd>
				</div>
				<div id="command-list" role="listbox" aria-label="Acciones disponibles" className="max-h-[min(52vh,420px)] overflow-y-auto p-2">
					{filtered.length === 0 ? <div className="px-3 py-10 text-center text-sm text-secondary">No hay acciones para esta búsqueda.</div> : filtered.map((item, index) => {
						const Icon = item.icon;
						return <button key={item.id} id={`command-${item.id}`} type="button" role="option" aria-selected={index === safeActiveIndex} onMouseEnter={() => setActiveIndex(index)} onClick={item.action} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${index === safeActiveIndex ? "bg-accent-soft text-accent-strong" : "text-primary hover:bg-surface-hover"}`}>
							<span className="flex size-7 items-center justify-center rounded-md bg-surface-sunken text-secondary">{item.accent ? <span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: item.accent }} /> : <Icon aria-hidden="true" className="size-4" />}</span>
							<span className="flex-1">{item.label}</span>{index === safeActiveIndex ? <ArrowRight aria-hidden="true" className="size-3.5 text-accent" /> : null}{item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
						</button>;
					})}
				</div>
				<div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[10px] text-tertiary"><span><Kbd>Up</Kbd> <Kbd>Down</Kbd> navegar</span><span><Kbd>Enter</Kbd> seleccionar</span><span className="ml-auto"><Command aria-hidden="true" className="inline size-3" />K abrir</span></div>
			</DialogContent>
		</Dialog>
	);
}
