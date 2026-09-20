import Link from "next/link";

import { FadeIn } from "@/components/motion/motion";
import { AuthActivity } from "@/components/auth/auth-activity";

export default function AuthLayout({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-background p-5 sm:p-8">
			<div className="relative z-10 grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-24">
				<FadeIn className="hidden lg:block" delay={120}><p className="text-sm font-medium text-secondary">ClientFlow</p><p className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em] text-primary">La operación de tu estudio, sin perder el hilo.</p><p className="mt-5 max-w-sm text-sm leading-6 text-secondary">Clientes, proyectos, entregables y cobros reunidos en un espacio claro.</p><AuthActivity /></FadeIn>
				<div className="w-full max-w-[440px] justify-self-center"><Link href="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold tracking-tight text-primary">
					<span className="cf-logo-mark flex size-7 items-center justify-center rounded-md bg-accent text-accent-contrast shadow-subtle">C</span>
					ClientFlow
				</Link>
				<FadeIn className="w-full" delay={180}><div className="mt-6 border-l border-line-strong bg-transparent py-2 pl-6">
					<div className="mb-5 border-b border-line pb-5"><p className="text-xs font-medium text-secondary">ClientFlow</p><h1 className="mt-3 text-xl font-semibold tracking-tight text-primary">{title}</h1>
					{subtitle ? (
						<p className="mt-1 text-sm text-secondary">
							{subtitle}
						</p>
					) : null}
					</div>
					<div className="mt-5">{children}</div>
				</div></FadeIn></div>
			</div>
		</main>
	);
}
