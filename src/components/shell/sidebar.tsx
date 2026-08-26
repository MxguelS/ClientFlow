"use client";

import {
	SlidersHorizontal,
	BriefcaseBusiness,
	ChevronLeft,
	FolderKanban,
	House,
	ListChecks,
	Receipt,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip } from "@/components/ui/tooltip";
import { UserArea } from "@/components/shell/user-area";

const modules = [
	{ label: "Clientes", icon: Users, href: "/clients" },
	{ label: "Proyectos", icon: FolderKanban, href: "/projects" },
	{ label: "Entregables", icon: ListChecks, href: "/deliverables" },
	{ label: "Facturas", icon: Receipt },
] as const;

function Brand({ collapsed }: { collapsed: boolean }) {
	return (
		<div className={`flex items-center gap-2.5 px-2 ${collapsed ? "justify-center" : ""}`}>
			<div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-contrast shadow-subtle">
				<BriefcaseBusiness aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
			</div>
			{collapsed ? null : <span className="text-sm font-semibold tracking-tight text-primary">ClientFlow</span>}
		</div>
	);
}

export function Sidebar({
	workspaceName,
	collapsed,
	onToggle,
	onNavigate,
	user,
}: {
	workspaceName: string;
	collapsed: boolean;
	onToggle: () => void;
	onNavigate?: () => void;
	user?: { name: string; email: string };
}) {
	const pathname = usePathname();

	const navLink = (active: boolean) =>
		`group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors ${collapsed ? "justify-center px-0" : ""} ${active ? "bg-accent-soft font-medium text-accent-strong" : "text-secondary hover:bg-surface-hover hover:text-primary"}`;

	return (
		<aside className={`flex h-full shrink-0 flex-col border-r border-line bg-surface/80 py-4 transition-[width] duration-200 ease-flow ${collapsed ? "w-16" : "w-60"}`}>
			<Brand collapsed={collapsed} />

			{collapsed ? null : (
				<div className="mx-3 mt-5 flex items-center gap-2 border-y border-line px-1 py-3">
					<div className="flex size-6 items-center justify-center rounded-md bg-accent-soft text-[10px] font-semibold text-accent-strong">
						{workspaceName.slice(0, 1).toUpperCase()}
					</div>
					<span className="min-w-0 truncate text-xs font-medium text-primary">{workspaceName}</span>
				</div>
			)}

			<nav aria-label="Navegación principal" className="mt-5 flex-1 space-y-5 px-2">
				<div>
					{collapsed ? null : <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary">General</p>}
					{collapsed ? (
						<Tooltip content="Dashboard"><Link onClick={onNavigate} href="/dashboard" aria-label="Dashboard" className={navLink(pathname === "/dashboard")}><House aria-hidden="true" className="size-4" /></Link></Tooltip>
					) : (
						<Link onClick={onNavigate} href="/dashboard" className={navLink(pathname === "/dashboard")}><House aria-hidden="true" className="size-4" /><span>Dashboard</span></Link>
					)}
				</div>

				<div>
					{collapsed ? null : <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-tertiary">Trabajo</p>}
					<div className="space-y-1">
						{modules.map(({ label, icon: Icon, ...rest }) => {
							const href = "href" in rest ? rest.href : undefined;
							const active = href !== undefined && (href === "/clients" ? pathname === href || pathname.startsWith(`${href}/`) : pathname.startsWith(href));

							if (href) {
								return collapsed ? (
									<Tooltip key={label} content={label}>
										<Link onClick={onNavigate} href={href} aria-label={label} className={navLink(active)}>
											<Icon aria-hidden="true" className="size-4" />
										</Link>
									</Tooltip>
								) : (
									<Link key={label} onClick={onNavigate} href={href} className={navLink(active)}>
										<Icon aria-hidden="true" className="size-4" />
										<span>{label}</span>
									</Link>
								);
							}

							return collapsed ? (
								<Tooltip key={label} content={`${label} · Próximamente`}><span aria-disabled="true" aria-label={`${label}, próximamente`} className={`${navLink(false)} cursor-not-allowed opacity-40`}><Icon aria-hidden="true" className="size-4" /></span></Tooltip>
							) : (
								<span key={label} aria-disabled="true" className={`${navLink(false)} cursor-not-allowed opacity-50`}><Icon aria-hidden="true" className="size-4" /><span>{label}</span><span className="ml-auto text-[10px] text-tertiary">Pronto</span></span>
							);
						})}
					</div>
				</div>
			</nav>

			<div className="space-y-2 px-2">
			{user ? <UserArea name={user.name} email={user.email} /> : null}
			{collapsed ? (
				<Tooltip content="Ajustes"><Link onClick={onNavigate} href="/settings" aria-label="Ajustes" className={navLink(pathname.startsWith("/settings"))}><SlidersHorizontal aria-hidden="true" className="size-4" /></Link></Tooltip>
			) : (
				<Link onClick={onNavigate} href="/settings" className={navLink(pathname.startsWith("/settings"))}><SlidersHorizontal aria-hidden="true" className="size-4" /><span>Ajustes</span></Link>
			)}
			{collapsed ? (
				<Tooltip content="Expandir barra lateral"><button type="button" aria-label="Expandir barra lateral" onClick={onToggle} className={`${navLink(false)} w-full`}><ChevronLeft aria-hidden="true" className="size-4 rotate-180" /></button></Tooltip>
			) : (
				<button type="button" onClick={onToggle} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-xs text-tertiary hover:bg-surface-hover hover:text-primary"><ChevronLeft aria-hidden="true" className="size-3.5" /><span>Contraer barra lateral</span></button>
			)}
			</div>
		</aside>
	);
}
