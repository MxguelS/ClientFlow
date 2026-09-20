import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { DeliverableDialogProject } from "@/components/deliverables/deliverable-form-dialog";
import { DeliverablePanel } from "@/components/deliverables/deliverable-panel";
import { DeliverableStatusBadge } from "@/components/deliverables/deliverable-status-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Entregable · ClientFlow" };

export default async function DeliverableDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();
	const [{ data: deliverable }, { data: projects }, { data: allDeliverables }] =
		await Promise.all([
			supabase
				.from("deliverables")
				.select(
					"id, title, description, status, due_date, created_at, updated_at, project_id, project:projects(name, client_id, client:clients(id, name))",
				)
				.eq("id", id)
				.maybeSingle(),
			supabase.from("projects").select("id, name").order("name"),
			supabase
				.from("deliverables")
				.select("id, title, status")
				.order("created_at", { ascending: false }),
		]);

	if (!deliverable) notFound();

	const project =
		typeof deliverable.project === "object" && deliverable.project !== null
			? deliverable.project
			: null;
	const client =
		project && typeof project.client === "object" && project.client !== null
			? project.client
			: null;
	if (!project) notFound();

	const dialogProjects: DeliverableDialogProject[] = (projects ?? []).map(
		(projectOption) => ({ id: projectOption.id, name: projectOption.name }),
	);

	return (
		<div className="cf-page-enter mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<Link href="/deliverables" className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary">
				<ArrowLeft aria-hidden="true" className="size-3.5" />
				Entregables
			</Link>

			<div className="mt-4 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
				<aside className="hidden lg:block" aria-label="Lista de entregables">
					<p className="border-b border-line pb-2 text-xs font-medium text-secondary">
						Todos los entregables
					</p>
					<ul className="mt-1">
						{allDeliverables?.map((row) => (
							<li key={row.id}>
								<Link
									href={`/deliverables/${row.id}`}
									aria-current={row.id === deliverable.id ? "page" : undefined}
									className={`flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${row.id === deliverable.id ? "bg-accent-soft font-medium text-accent-strong" : "text-secondary hover:bg-surface-hover hover:text-primary"}`}
								>
									<span className="min-w-0 truncate">{row.title}</span>
									<DeliverableStatusBadge status={row.status} />
								</Link>
							</li>
						))}
					</ul>
				</aside>

				<div className="min-w-0">
					<DeliverablePanel
						deliverable={{
							id: deliverable.id,
							title: deliverable.title,
							projectId: deliverable.project_id,
							projectName: project.name,
							clientId: client?.id ?? null,
							clientName: client?.name ?? "Sin cliente",
							description: deliverable.description,
							status: deliverable.status,
							dueDate: deliverable.due_date,
							createdAt: deliverable.created_at,
							updatedAt: deliverable.updated_at,
						}}
						projects={dialogProjects}
					/>
				</div>
			</div>
		</div>
	);
}
