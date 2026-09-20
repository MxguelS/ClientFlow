import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectDeliverablesSection } from "@/components/deliverables/project-deliverables-section";
import { ProjectFilesSection } from "@/components/project-files/project-files-section";
import { EditProjectButton } from "@/components/projects/edit-project-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { formatDateOnly } from "@/lib/dates/date-only";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Proyecto · ClientFlow" };

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-2.5">
		<span className="shrink-0 text-xs font-medium text-secondary">{label}</span>
			<span className="min-w-0 truncate text-right text-sm text-primary">
				{value ?? <span className="text-tertiary">—</span>}
			</span>
		</div>
	);
}

export default async function ProjectDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();

	const [
		{ data: project },
		{ data: clients },
		{ data: allProjects },
		{ data: deliverables },
		{ data: projectFiles },
	] =
		await Promise.all([
			supabase
				.from("projects")
				.select(
					"id, name, description, status, budget, start_date, due_date, created_at, updated_at, client_id, workspace_id, client:clients(name)",
				)
				.eq("id", id)
				.maybeSingle(),
			supabase.from("clients").select("id, name").order("name"),
			supabase
				.from("projects")
				.select("id, name, status")
				.order("created_at", { ascending: false }),
			supabase
				.from("deliverables")
				.select("id, title, status, due_date")
				.eq("project_id", id)
				.order("created_at", { ascending: false }),
			supabase
				.from("project_files")
				.select("id, file_name, mime_type, size_bytes, created_at")
				.eq("project_id", id)
				.order("created_at", { ascending: false }),
		]);

	if (!project) notFound();

	const clientName =
		typeof project.client === "object" && project.client !== null
			? (project.client.name as string)
			: "Sin cliente";

	const budgetFormatter = new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	});

	return (
		<div className="cf-page-enter mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<Link
				href="/projects"
				className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
			>
				<ArrowLeft aria-hidden="true" className="size-3.5" />
				Proyectos
			</Link>

			<div className="mt-4 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
				<aside className="hidden lg:block" aria-label="Lista de proyectos">
					<p className="border-b border-line pb-2 text-xs font-medium text-secondary">
						Todos los proyectos
					</p>
					<ul className="mt-1">
						{allProjects?.map((row) => (
							<li key={row.id}>
								<Link
									href={`/projects/${row.id}`}
									aria-current={row.id === project.id ? "page" : undefined}
									className={`flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
										row.id === project.id
											? "bg-accent-soft font-medium text-accent-strong"
											: "text-secondary hover:bg-surface-hover hover:text-primary"
									}`}
								>
									<span className="min-w-0 truncate">{row.name}</span>
									<ProjectStatusBadge status={row.status} />
								</Link>
							</li>
						))}
					</ul>
				</aside>

				<div className="min-w-0">
					<div className="flex items-start justify-between gap-4 border-b border-line pb-5">
						<div className="min-w-0">
							<h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-primary">{project.name}</h1>
							<div className="mt-2">
								<ProjectStatusBadge status={project.status} />
							</div>
						</div>
						<EditProjectButton
							project={{
								id: project.id,
								name: project.name,
								clientId: project.client_id,
								description: project.description,
								status: project.status,
								budget: project.budget,
								startDate: project.start_date,
								dueDate: project.due_date,
							}}
							clients={(clients ?? []).map((client) => ({
								id: client.id,
								name: client.name,
							}))}
						/>
					</div>

					<section className="border-b border-line py-2" aria-label="Datos del proyecto">
						<InfoRow
							label="Cliente"
							value={
								project.client_id ? <Link href={`/clients/${project.client_id}`} className="text-accent hover:underline">{clientName}</Link> : <span className="text-secondary">{clientName}</span>
							}
						/>
						<InfoRow
							label="Presupuesto"
							value={project.budget !== null ? budgetFormatter.format(project.budget) : null}
						/>
						<InfoRow
							label="Inicio"
							value={project.start_date ? formatDateOnly(project.start_date) : null}
						/>
						<InfoRow
							label="Fin"
							value={project.due_date ? formatDateOnly(project.due_date) : null}
						/>
					</section>

					<section className="py-4" aria-label="Descripción del proyecto">
						<p className="text-xs font-medium text-secondary">Descripción</p>
						{project.description ? (
							<p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">{project.description}</p>
						) : (
							<p className="mt-2 text-sm text-tertiary">Sin descripción.</p>
						)}
					</section>

					<ProjectDeliverablesSection
						currentProjectId={project.id}
						projects={(allProjects ?? []).map((row) => ({
							id: row.id,
							name: row.name,
						}))}
						deliverables={(deliverables ?? []).map((deliverable) => ({
							id: deliverable.id,
							title: deliverable.title,
							status: deliverable.status,
							dueDate: deliverable.due_date,
						}))}
					/>

					<ProjectFilesSection
						files={(projectFiles ?? []).map((file) => ({
							id: file.id,
							fileName: file.file_name,
							mimeType: file.mime_type,
							sizeBytes: file.size_bytes,
							createdAt: file.created_at,
						}))}
						projectId={project.id}
						workspaceId={project.workspace_id}
					/>

					<p className="border-t border-line pt-3 font-mono text-[10px] text-tertiary">
						Creado {dateTimeFormatter.format(new Date(project.created_at))} · Actualizado{" "}
						{dateTimeFormatter.format(new Date(project.updated_at))}
					</p>
				</div>
			</div>
		</div>
	);
}
