import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LiveProductDemo } from "@/components/landing/live-product-demo";
import { AnimatedWords, FadeIn } from "@/components/motion/motion";

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col overflow-y-auto bg-background px-5 py-5 sm:px-10 sm:py-6 sm:pb-10">
			<header className="relative z-10 mx-auto flex h-10 w-full max-w-[1600px] items-center justify-between">
				<FadeIn className="flex items-center justify-between w-full" delay={80}><Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-primary"><span className="cf-logo-mark flex size-7 items-center justify-center rounded-md bg-accent text-accent-contrast">C</span>ClientFlow</Link><a href="/login" className="text-sm text-secondary underline-offset-4 hover:text-primary hover:underline">Iniciar sesión</a></FadeIn>
			</header>
			<section className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-12 py-12 lg:min-h-[clamp(32rem,calc(100svh-9rem),52rem)] lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,0.78fr)] lg:gap-24 lg:py-16">
				<div className="lg:pt-12"><FadeIn delay={220}><p className="text-sm font-medium text-secondary">Sistema operativo para tu estudio</p></FadeIn>
				<FadeIn delay={320}><h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.06em] text-primary sm:text-6xl lg:text-[4.25rem]">Todo el trabajo.<br className="hidden lg:block" /> Una sola vista.</h1></FadeIn>
				<FadeIn delay={440}><p className="mt-5 max-w-xl text-base leading-7 text-primary/75">ClientFlow reúne clientes, proyectos, entregables y facturación en un espacio de trabajo claro para equipos pequeños. <span className="mt-5 flex items-center gap-3 text-lg font-semibold leading-6 tracking-[-0.02em] text-primary"><span className="text-sm font-medium text-secondary">En foco:</span><AnimatedWords words={["Organiza.", "Entrega.", "Cobra.", "Colabora."]} /></span></p></FadeIn>
				<FadeIn delay={560}><div className="mt-8 flex flex-wrap gap-3"><a href="/register" className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-contrast shadow-subtle hover:bg-accent-hover">Crear cuenta <ArrowRight aria-hidden="true" className="size-4" /></a><a href="/login" className="inline-flex h-10 items-center rounded-md border border-line bg-transparent px-4 text-sm font-medium text-secondary hover:border-line-strong hover:bg-surface-hover hover:text-primary">Ya tengo una cuenta</a></div></FadeIn></div>
				<FadeIn className="relative hidden min-h-[380px] items-center lg:flex" delay={680}><LiveProductDemo /></FadeIn>
			</section>
			<section className="relative z-10 mx-auto grid w-full max-w-[1600px] gap-5 border-t border-line pb-6 pt-5 sm:grid-cols-4 sm:gap-3 sm:pb-7"><div className="text-sm"><p className="text-2xl font-semibold tracking-tight text-primary">01</p><p className="mt-2 font-medium text-primary">Clientes</p><p className="mt-1 text-xs leading-5 text-secondary">Contexto compartido.</p></div><div className="text-sm"><p className="text-2xl font-semibold tracking-tight text-primary">02</p><p className="mt-2 font-medium text-primary">Proyectos</p><p className="mt-1 text-xs leading-5 text-secondary">Progreso visible.</p></div><div className="text-sm"><p className="text-2xl font-semibold tracking-tight text-primary">03</p><p className="mt-2 font-medium text-primary">Entregables</p><p className="mt-1 text-xs leading-5 text-secondary">Ritmo sin ruido.</p></div><div className="text-sm"><p className="text-2xl font-semibold tracking-tight text-primary">04</p><p className="mt-2 font-medium text-primary">Facturación</p><p className="mt-1 text-xs leading-5 text-secondary">Cobros en contexto.</p></div></section>
		</main>
	);
}
