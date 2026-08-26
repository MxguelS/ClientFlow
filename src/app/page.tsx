import Link from "next/link";
import {
	FolderKanban,
	ListChecks,
	Receipt,
	Users,
} from "lucide-react";

const workspaceRows = [
	{ label: "Clientes", keyword: "relaciones", icon: Users },
	{ label: "Proyectos", keyword: "progreso", icon: FolderKanban },
	{ label: "Entregables", keyword: "ritmo", icon: ListChecks },
	{ label: "Facturación", keyword: "control", icon: Receipt },
];

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col overflow-y-auto px-5 py-5 sm:px-10 sm:py-6 sm:pb-10">
			<header className="relative z-10 mx-auto flex h-10 w-full max-w-[1440px] items-center justify-between">
				<Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-primary"><span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-contrast">C</span>ClientFlow</Link>
				<a href="/login" className="text-sm text-secondary underline-offset-4 hover:text-primary hover:underline">Iniciar sesión</a>
			</header>
			<section className="relative z-10 mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.78fr)] lg:gap-20 lg:pb-28 lg:pt-10">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Tu escritorio de operaciones</p>
					<h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.06em] text-primary sm:text-6xl lg:text-[4.25rem]">El trabajo de tu estudio,<br className="hidden lg:block" /> en foco.</h1>
					<p className="mt-6 max-w-xl text-base leading-7 text-primary/75">ClientFlow reúne clientes, proyectos, entregables y facturación en un espacio de trabajo claro para equipos pequeños.</p>
					<div className="mt-9 flex flex-wrap gap-3"><a href="/register" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-contrast shadow-subtle hover:bg-accent-hover">Crear cuenta</a><a href="/login" className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-primary hover:bg-surface-hover">Ya tengo una cuenta</a></div>
				</div>
				<div aria-hidden="true" className="relative hidden min-h-[380px] items-center lg:flex"><div className="absolute right-0 top-0 h-px w-40 bg-accent/60" /><div className="w-full border-y border-line py-2"><div className="mb-4 flex items-center justify-between px-1"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tertiary">Espacio de trabajo</span><span className="font-mono text-[10px] text-tertiary">ClientFlow</span></div>{workspaceRows.map(({ label, keyword, icon: Icon }, index) => (
					<div key={label} className={`flex items-center justify-between border-t border-line px-3 py-[17px] text-sm ${index === 0 ? "-mx-3 mt-2 rounded-md bg-accent-soft" : ""}`}>
						<span className="flex items-center gap-3">
							{index === 0 ? <span className="size-1.5 rounded-full bg-accent" /> : null}
							<Icon aria-hidden="true" className={`size-3.5 ${index === 0 ? "text-accent" : "text-tertiary"}`} strokeWidth={1.75} />
							<span className={index === 0 ? "font-medium text-primary" : "text-secondary"}>{label}</span>
						</span>
						<span className="font-mono text-[10px] text-tertiary">{keyword}</span>
					</div>
				))}</div><div className="absolute bottom-0 right-8 h-36 w-36 rounded-full bg-accent/10 blur-3xl" /></div>
			</section>
			<section className="relative z-10 mx-auto grid w-full max-w-[1440px] gap-3 border-t border-line py-6 sm:grid-cols-3 sm:py-7"><div className="text-sm"><p className="font-medium text-primary">Clientes y proyectos</p><p className="mt-1 text-xs leading-5 text-secondary">Un contexto compartido para cada relación.</p></div><div className="text-sm"><p className="font-medium text-primary">Entregas sin ruido</p><p className="mt-1 text-xs leading-5 text-secondary">Menos pestañas, más claridad operativa.</p></div><div className="text-sm"><p className="font-medium text-primary">Facturación en contexto</p><p className="mt-1 text-xs leading-5 text-secondary">La parte administrativa junto al trabajo.</p></div></section>
		</main>
	);
}
