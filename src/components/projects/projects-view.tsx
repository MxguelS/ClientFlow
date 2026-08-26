"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ProjectFormDialog, type ProjectDialogClient } from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterByQuery } from "@/lib/search/filter";

export interface ProjectRow {
	id: string;
	name: string;
	clientName: string;
	status: string;
	createdAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

export function ProjectsView({
	projects,
	clients,
}: {
	projects: ProjectRow[];
	clients: ProjectDialogClient[];
}) {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState("");
	const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "1");

	useEffect(() => {
		if (searchParams.get("create") !== "1") return;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCreateOpen(true);
		const url = new URL(window.location.href);
		url.searchParams.delete("create");
		window.history.replaceState(null, "", url.toString());
	}, [searchParams]);

	const filtered = useMemo(
		() =>
			filterByQuery(projects, query, (project) => [
				project.name,
				project.clientName,
			]),
		[projects, query],
	);

	const hasProjects = projects.length > 0;

	return (
		<div>
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-[-0.03em] text-primary">Proyectos</h1>
				{clients.length > 0 ? (
					<Button type="button" onClick={() => setCreateOpen(true)}>
						<Plus aria-hidden="true" className="size-4" />
						Nuevo proyecto
					</Button>
				) : null}
			</div>

			{!hasProjects && clients.length === 0 ? (
				<div className="mt-6 border-y border-line py-14 text-center">
					<p className="text-sm font-medium text-primary">Primero necesitas un cliente.</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Los proyectos se asocian siempre a un cliente de tu workspace.
					</p>
					<Link href="/clients" className="mt-5 inline-flex h-10 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-primary transition-colors hover:bg-surface-hover">
						Ir a Clientes
					</Link>
				</div>
			) : !hasProjects ? (
				<div className="mt-6 border-y border-line py-14 text-center">
					<p className="text-sm font-medium text-primary">Todavía no hay proyectos.</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Crea tu primer proyecto para organizar el trabajo de tus clientes.
					</p>
					<Button type="button" variant="secondary" className="mt-5" onClick={() => setCreateOpen(true)}>
						<Plus aria-hidden="true" className="size-4" />
						Crear primer proyecto
					</Button>
				</div>
			) : (
				<>
					<div className="relative mt-5 max-w-sm">
						<Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary" />
						<Input
							type="search"
							placeholder="Buscar por nombre o cliente..."
							aria-label="Buscar proyectos"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							className="pl-9"
						/>
					</div>

					{filtered.length === 0 ? (
						<div className="mt-6 border-y border-line py-12 text-center">
							<p className="text-sm font-medium text-primary">Sin resultados.</p>
							<p className="mt-1.5 text-sm text-secondary">
								Ningún proyecto coincide con esta búsqueda.
							</p>
						</div>
					) : (
						<div className="mt-4 border-y border-line">
							<div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_140px_110px] gap-4 border-b border-line px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary md:grid">
								<span>Nombre</span>
								<span>Cliente</span>
								<span>Estado</span>
								<span className="text-right">Creado</span>
							</div>
							<ul>
								{filtered.map((project) => (
									<li key={project.id} className="border-b border-line last:border-b-0">
										<Link
											href={`/projects/${project.id}`}
											className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 transition-colors hover:bg-surface-hover md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_140px_110px]"
										>
											<span className="min-w-0">
												<span className="block truncate text-sm font-medium text-primary">{project.name}</span>
												<span className="mt-0.5 block truncate text-xs text-tertiary md:hidden">{project.clientName}</span>
											</span>
											<span className="hidden min-w-0 truncate text-sm text-secondary md:block">{project.clientName}</span>
											<span className="justify-self-start md:justify-self-auto">
												<ProjectStatusBadge status={project.status} />
											</span>
											<span className="hidden text-right font-mono text-xs text-tertiary md:block">
												{dateFormatter.format(new Date(project.createdAt))}
											</span>
											<span className="text-right font-mono text-[10px] text-tertiary md:hidden">
												{dateFormatter.format(new Date(project.createdAt))}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</>
			)}

			{clients.length > 0 ? (
				<ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} />
			) : null}
		</div>
	);
}
