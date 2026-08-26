import type { DeliverableDialogProject } from "@/components/deliverables/deliverable-form-dialog";
import {
	DeliverablesView,
	type DeliverableRow,
} from "@/components/deliverables/deliverables-view";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Entregables · ClientFlow" };

export default async function DeliverablesPage() {
	const supabase = await createClient();
	const [{ data: deliverables }, { data: projects }] = await Promise.all([
		supabase
			.from("deliverables")
			.select(
				"id, title, status, due_date, project:projects(name, client:clients(name))",
			)
			.order("created_at", { ascending: false }),
		supabase.from("projects").select("id, name").order("name"),
	]);

	const rows: DeliverableRow[] = (deliverables ?? []).map((deliverable) => {
		const project =
			typeof deliverable.project === "object" && deliverable.project !== null
				? deliverable.project
				: null;
		const client =
			project && typeof project.client === "object" && project.client !== null
				? project.client
				: null;
		return {
			id: deliverable.id,
			title: deliverable.title,
			status: deliverable.status,
			dueDate: deliverable.due_date,
			projectName: project?.name ?? "",
			clientName: client?.name ?? "",
		};
	});

	const dialogProjects: DeliverableDialogProject[] = (projects ?? []).map(
		(project) => ({ id: project.id, name: project.name }),
	);

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<DeliverablesView deliverables={rows} projects={dialogProjects} />
		</div>
	);
}
