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
		<main className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-sm">
				<h1 className="text-center text-xl font-bold tracking-tight">
					ClientFlow
				</h1>
				<div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold">{title}</h2>
					{subtitle ? (
						<p className="mt-1 text-sm text-neutral-500">
							{subtitle}
						</p>
					) : null}
					<div className="mt-5">{children}</div>
				</div>
			</div>
		</main>
	);
}
