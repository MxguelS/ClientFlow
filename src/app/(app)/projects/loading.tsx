export default function ProjectsLoading() {
	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10" aria-busy="true" aria-label="Cargando proyectos">
			<div className="flex items-center justify-between">
				<div className="cf-animate-skeleton h-7 w-44 rounded-md bg-surface-sunken" />
				<div className="cf-animate-skeleton h-9 w-36 rounded-md bg-surface-sunken" />
			</div>
			<div className="cf-animate-skeleton mt-5 h-9 w-full max-w-sm rounded-md bg-surface-sunken" />
			<div className="mt-4 border-y border-line">
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={index} className="flex items-center justify-between border-b border-line px-3 py-3.5 last:border-b-0">
						<div className="cf-animate-skeleton h-4 w-52 rounded bg-surface-sunken" />
						<div className="cf-animate-skeleton hidden h-4 w-36 rounded bg-surface-sunken md:block" />
						<div className="cf-animate-skeleton h-5 w-20 rounded-full bg-surface-sunken" />
					</div>
				))}
			</div>
		</div>
	);
}
