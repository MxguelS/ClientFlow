"use client";

import { ListFilter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	DeliverableFormDialog,
	type DeliverableDialogProject,
} from "@/components/deliverables/deliverable-form-dialog";
import { DeliverableStatusBadge } from "@/components/deliverables/deliverable-status-badge";
import { Button } from "@/components/ui/button";
import { Input, selectClasses } from "@/components/ui/input";
import { formatDateOnly } from "@/lib/dates/date-only";
import {
	DELIVERABLE_STATUSES,
	DELIVERABLE_STATUS_LABELS,
} from "@/lib/deliverables/validation";
import { filterByQuery } from "@/lib/search/filter";

export interface DeliverableRow {
	id: string;
	title: string;
	projectName: string;
	clientName: string;
	status: string;
	dueDate: string | null;
}

export function DeliverablesView({
	deliverables,
	projects,
}: {
	deliverables: DeliverableRow[];
	projects: DeliverableDialogProject[];
}) {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("all");
	const [createOpen, setCreateOpen] = useState(
		searchParams.get("create") === "1",
	);

	useEffect(() => {
		if (searchParams.get("create") !== "1") return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCreateOpen(true);
		const url = new URL(window.location.href);
		url.searchParams.delete("create");
		window.history.replaceState(null, "", url.toString());
	}, [searchParams]);

	const filtered = useMemo(() => {
		const searched = filterByQuery(deliverables, query, (deliverable) => [
			deliverable.title,
			deliverable.projectName,
			deliverable.clientName,
		]);
		return status === "all"
			? searched
			: searched.filter((deliverable) => deliverable.status === status);
	}, [deliverables, query, status]);

	const hasDeliverables = deliverables.length > 0;

	return (
		<div className="cf-page-enter">
			<div className="flex items-end justify-between gap-4 border-b border-line pb-5">
				<div><h1 className="text-2xl font-semibold tracking-[-0.03em] text-primary">Entregables <span className="ml-2 text-sm font-normal tracking-normal text-secondary">{deliverables.length}</span></h1><p className="mt-1.5 max-w-lg text-sm text-secondary">Organiza lo que debes completar y entregar en cada proyecto.</p></div>
				{projects.length > 0 ? (
					<Button type="button" onClick={() => setCreateOpen(true)}>
						<Plus aria-hidden="true" className="size-4" />
						Nuevo entregable
					</Button>
				) : null}
			</div>

			{!hasDeliverables && projects.length === 0 ? (
				<div className="mt-6 border-y border-line py-10 text-center">
					<p className="text-sm font-medium text-primary">
						Primero necesitas un proyecto.
					</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Los entregables pertenecen siempre a un proyecto de tu workspace.
					</p>
					<Link
						href="/projects"
						className="mt-5 inline-flex h-10 items-center rounded-md border border-line-strong bg-surface-raised px-4 text-sm font-medium text-primary transition-colors hover:bg-surface-hover"
					>
						Ir a Proyectos
					</Link>
				</div>
			) : !hasDeliverables ? (
				<div className="mt-6 border-y border-line py-10 text-center">
					<p className="text-sm font-medium text-primary">
						Todavía no hay entregables.
					</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Los entregables son resultados concretos de un proyecto, como un diseño, documento, video o versión final.
					</p>
					<Button
						type="button"
						variant="secondary"
						className="mt-5"
						onClick={() => setCreateOpen(true)}
					>
						<Plus aria-hidden="true" className="size-4" />
						Crear primer entregable
					</Button>
				</div>
			) : (
				<>
					<div className="mt-5 flex max-w-2xl flex-col gap-2 sm:flex-row">
						<div className="relative min-w-0 flex-1">
							<Search
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary"
							/>
							<Input
								type="search"
								placeholder="Buscar por título, proyecto o cliente..."
								aria-label="Buscar entregables"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="relative sm:w-44">
							<ListFilter
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary"
							/>
							<select
								aria-label="Filtrar por estado"
								className={`${selectClasses} pl-9`}
								value={status}
								onChange={(event) => setStatus(event.target.value)}
							>
								<option value="all">Todos</option>
								{DELIVERABLE_STATUSES.map((value) => (
									<option key={value} value={value}>
										{DELIVERABLE_STATUS_LABELS[value]}
									</option>
								))}
							</select>
						</div>
					</div>

					{filtered.length === 0 ? (
						<div className="mt-6 border-y border-line py-12 text-center">
							<p className="text-sm font-medium text-primary">Sin resultados.</p>
							<p className="mt-1.5 text-sm text-secondary">
								Ningún entregable coincide con esta búsqueda o filtro.
							</p>
						</div>
					) : (
						<div className="mt-4 border-y border-line">
							<div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_140px_120px] gap-4 border-b border-line px-3 py-2.5 text-xs font-medium text-secondary md:grid">
								<span>Título</span>
								<span>Proyecto</span>
								<span>Estado</span>
								<span className="text-right">Fecha límite</span>
							</div>
							<ul>
								{filtered.map((deliverable) => (
									<li key={deliverable.id} className="border-b border-line last:border-b-0">
										<Link
											href={`/deliverables/${deliverable.id}`}
											className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 transition-colors hover:bg-surface-hover md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_140px_120px]"
										>
											<span className="min-w-0">
												<span className="block truncate text-sm font-medium text-primary">
													{deliverable.title}
												</span>
												<span className="mt-0.5 block truncate text-xs text-tertiary md:hidden">
													{deliverable.projectName} · {deliverable.clientName}
												</span>
											</span>
											<span className="hidden min-w-0 md:block">
												<span className="block truncate text-sm text-secondary">
													{deliverable.projectName}
												</span>
												<span className="block truncate text-xs text-tertiary">
													{deliverable.clientName}
												</span>
											</span>
											<span className="justify-self-start md:justify-self-auto">
												<DeliverableStatusBadge status={deliverable.status} />
											</span>
											<span className="col-span-2 text-right font-mono text-[10px] text-tertiary md:col-span-1 md:text-xs">
												{deliverable.dueDate
													? formatDateOnly(deliverable.dueDate)
													: "—"}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</>
			)}

			{projects.length > 0 ? (
				<DeliverableFormDialog
					open={createOpen}
					onOpenChange={setCreateOpen}
					projects={projects}
				/>
			) : null}
		</div>
	);
}
