"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, CircleDollarSign, FileText, FolderKanban, Users } from "lucide-react";

const scenes = [
	{ label: "Clientes", icon: Users, title: "Nova Studio", detail: "Nuevo cliente · Añadido ahora", value: "01" },
	{ label: "Proyectos", icon: FolderKanban, title: "Website redesign", detail: "En progreso · 84% completado", value: "84%" },
	{ label: "Entregables", icon: FileText, title: "Brand guidelines", detail: "Revisión · Entrega hoy", value: "HOY" },
	{ label: "Facturación", icon: CircleDollarSign, title: "Factura #0042", detail: "Pagada · Nova Studio", value: "$1,280" },
] as const;

export function LiveProductDemo() {
	const [active, setActive] = useState(0);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (media.matches) return;
		const timer = window.setInterval(() => setActive((value) => (value + 1) % scenes.length), 2600);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<div className="relative w-full max-w-2xl border-y border-line py-5">
			<div className="mb-4 flex items-center justify-between px-1 text-xs"><span className="font-medium text-primary">ClientFlow / en vivo</span><span className="flex items-center gap-1.5 text-tertiary"><span className="size-1.5 rounded-full bg-primary" /> Workspace activo</span></div>
			<div className="space-y-1">
				{scenes.map(({ label, icon: Icon, title, detail, value }, index) => {
					const isActive = index === active;
					return <div key={label} className={`relative overflow-hidden border border-transparent px-3 py-5 transition-[background-color,border-color,transform] duration-500 ${isActive ? "border-line-strong bg-surface-raised" : "hover:bg-surface-hover"}`}>
						<div className="flex items-center gap-3"><Icon aria-hidden="true" className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-tertiary"}`} strokeWidth={1.8} /><span className={`min-w-0 text-xs ${isActive ? "font-medium text-primary" : "text-secondary"}`}>{label}</span><span className="ml-auto shrink-0 whitespace-nowrap font-mono text-[10px] text-tertiary">{value}</span><ArrowUpRight aria-hidden="true" className={`size-3.5 shrink-0 transition-transform duration-300 ${isActive ? "translate-x-0 text-primary" : "-translate-x-1 text-transparent"}`} /></div>
						<div className={`grid transition-[grid-template-rows,opacity] duration-500 ${isActive ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden pl-7"><div className="flex items-center gap-2 text-sm text-primary"><span>{title}</span>{index === 3 ? <Check aria-hidden="true" className="size-3.5" /> : null}</div><p className="mt-1 text-xs text-secondary">{detail}</p>{index === 1 ? <div className="mt-3 h-1 w-full bg-surface-hover"><div className="h-full w-[84%] bg-primary transition-[width] duration-700" /></div> : null}</div></div>
					</div>;
				})}
			</div>
		</div>
	);
}
