export default function Home() {
	return (
		<main className="flex min-h-screen items-center justify-center p-8">
			<div className="max-w-md text-center">
				<h1 className="text-3xl font-bold tracking-tight">ClientFlow</h1>
				<p className="mt-2 text-neutral-500">
					Gestión de clientes, proyectos y facturación para freelancers
					y pequeños equipos.
				</p>
				<nav className="mt-6 flex items-center justify-center gap-3 text-sm font-medium">
					<a
						href="/register"
						className="rounded-md bg-neutral-900 px-4 py-2 text-white no-underline transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
					>
						Crear cuenta
					</a>
					<a
						href="/login"
						className="rounded-md border border-neutral-300 px-4 py-2 no-underline transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
					>
						Iniciar sesión
					</a>
				</nav>
			</div>
		</main>
	);
}
