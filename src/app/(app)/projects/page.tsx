import { createClient } from "@/lib/supabase/server";

import {
	ProjectsView,
	type ProjectRow,
} from "@/components/projects/projects-view";
import type { ProjectDialogClient } from "@/components/projects/project-form-dialog";

export const metadata = { title: "Proyectos · ClientFlow" };

export default async function ProjectsPage() {
	const supabase = await createClient();

	const [{ data: projects }, { data: clients }] = await Promise.all([
		supabase
			.from("projects")
			.select("id, name, status, created_at, client:clients(name)")
			.order("created_at", { ascending: false }),
		supabase.from("clients").select("id, name").order("name"),
	]);

	const rows: ProjectRow[] = (projects ?? []).map((project) => ({
		id: project.id,
		name: project.name,
		clientName:
			typeof project.client === "object" && project.client !== null
				? (project.client.name as string)
				: "Sin cliente",
		status: project.status,
		createdAt: project.created_at,
	}));

	const dialogClients: ProjectDialogClient[] = (clients ?? []).map(
		(client) => ({ id: client.id, name: client.name }),
	);

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<ProjectsView projects={rows} clients={dialogClients} />
		</div>
	);
}
