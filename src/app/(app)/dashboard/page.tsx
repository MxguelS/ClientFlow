import { ArrowUpRight, CircleAlert, Plus } from "lucide-react";

import { getCurrentUser, getPrimaryMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · ClientFlow" };

export default async function DashboardPage() {
	const user = await getCurrentUser();
	const membership = await getPrimaryMembership();
	const supabase = await createClient();
	const { data: profile } = user
		? await supabase.from("profiles").select("full_name, created_at").eq("id", user.id).maybeSingle()
		: { data: null };
	const displayName = profile?.full_name || user?.email || "tu workspace";

	const date = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<header className="flex items-end justify-between border-b border-line pb-5">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">{date}</p>
					<h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary sm:text-3xl">Hola, {displayName}</h1>
					<p className="mt-1.5 max-w-xl text-sm text-secondary">El trabajo que requiere tu atención aparecerá aquí.</p>
				</div>
				<span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary sm:block">{membership?.workspaceName}</span>
			</header>

			<section className="mt-6 border-y border-line">
				<div className="flex items-center justify-between border-b border-line py-3"><div className="flex items-center gap-2"><CircleAlert aria-hidden="true" className="size-4 text-accent" /><h2 className="text-sm font-semibold text-primary">Requiere atención</h2></div><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">0 pendientes</span></div>
				<div className="flex min-h-48 items-center justify-center px-5 py-10 text-center"><div><p className="text-base font-medium text-primary">No hay trabajo pendiente.</p><p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">Cuando existan clientes, entregas o facturas que requieran una decisión, aparecerán en esta lista.</p><span className="mt-5 inline-flex items-center gap-2 text-xs text-tertiary"><Plus aria-hidden="true" className="size-3.5" />Los módulos de trabajo estarán disponibles próximamente</span></div></div>
			</section>

			<section className="mt-6 grid gap-x-10 gap-y-5 border-b border-line pb-7 sm:grid-cols-2 lg:grid-cols-3">
				<div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">Workspace</p><p className="mt-2 text-sm font-medium text-primary">{membership?.workspaceName}</p><p className="mt-1 text-xs text-secondary">Tu espacio de trabajo activo</p></div>
				<div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">Cuenta</p><p className="mt-2 truncate text-sm font-medium text-primary">{user?.email}</p><p className="mt-1 text-xs text-secondary">Propietario del workspace</p></div>
				<div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-tertiary">Próximo</p><p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">Construye tu flujo <ArrowUpRight aria-hidden="true" className="size-3.5 text-accent" /></p><p className="mt-1 text-xs text-secondary">Los módulos se habilitarán por fases</p></div>
			</section>
		</div>
	);
}
