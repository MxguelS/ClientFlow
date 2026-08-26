import Link from "next/link";

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
		<main className="relative flex min-h-screen items-center justify-center overflow-y-auto p-5 sm:p-8">
			<div className="relative z-10 w-full max-w-sm">
				<Link href="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold tracking-tight text-primary">
					<span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-contrast shadow-subtle">C</span>
					ClientFlow
				</Link>
				<div className="mt-6 rounded-xl border border-line-strong bg-surface/90 p-6 shadow-window backdrop-blur-sm">
					<h1 className="text-lg font-semibold tracking-tight text-primary">{title}</h1>
					{subtitle ? (
						<p className="mt-1 text-sm text-secondary">
							{subtitle}
						</p>
					) : null}
					<div className="mt-5">{children}</div>
				</div>
			</div>
		</main>
	);
}
