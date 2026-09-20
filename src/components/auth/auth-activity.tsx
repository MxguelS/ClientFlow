"use client";

import { Check, CircleDollarSign, FilePlus2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const activity = [
	{ icon: UserRound, label: "Cliente añadido", detail: "North Studio", time: "ahora" },
	{ icon: Check, label: "Entrega aprobada", detail: "Identidad visual", time: "hace 2 min" },
	{ icon: CircleDollarSign, label: "Factura pagada", detail: "#F-1042 · $1,280", time: "ahora" },
	{ icon: FilePlus2, label: "Proyecto actualizado", detail: "Website redesign", time: "hace 5 min" },
] as const;

export function AuthActivity() {
	const [active, setActive] = useState(0);

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (media.matches) return;
		const timer = window.setInterval(() => setActive((value) => (value + 1) % activity.length), 2600);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<div className="cf-auth-activity mt-12 border-l border-line-strong pl-4" aria-label="Actividad de demostración">
			<p className="text-xs font-medium text-secondary">Actividad reciente</p>
			<div className="mt-4 space-y-1">
				{activity.map(({ icon: Icon, label, detail, time }, index) => <div key={label} className={`flex items-start gap-3 py-2 transition-[opacity,transform] duration-500 ${index === active ? "translate-x-1 opacity-100" : "opacity-45"}`}><Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={1.8} /><div className="min-w-0"><p className="text-xs font-medium text-primary">{label}</p><p className="mt-0.5 text-xs text-secondary">{detail} <span className="text-tertiary">· {time}</span></p></div></div>)}
			</div>
		</div>
	);
}
