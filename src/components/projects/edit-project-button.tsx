"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { ProjectFormDialog, type ProjectDialogClient } from "@/components/projects/project-form-dialog";
import { Button } from "@/components/ui/button";

export function EditProjectButton({
	project,
	clients,
}: {
	project: {
		id: string;
		name: string;
		clientId: string | null;
		description: string | null;
		status: string;
		budget: number | null;
		startDate: string | null;
		dueDate: string | null;
	};
	clients: ProjectDialogClient[];
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
				<Pencil aria-hidden="true" className="size-3.5" />
				Editar
			</Button>
			<ProjectFormDialog open={open} onOpenChange={setOpen} project={project} clients={clients} />
		</>
	);
}
