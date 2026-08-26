"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
	DeliverableFormDialog,
	type DeliverableDialogProject,
} from "@/components/deliverables/deliverable-form-dialog";
import { DeliverableStatusBadge } from "@/components/deliverables/deliverable-status-badge";
import { DeleteDeliverableDialog } from "@/components/deliverables/delete-deliverable-dialog";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/date-only";

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-2.5">
			<span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
				{label}
			</span>
			<span className="min-w-0 truncate text-right text-sm text-primary">
				{value ?? <span className="text-tertiary">—</span>}
			</span>
		</div>
	);
}

export function DeliverablePanel({
	deliverable,
	projects,
}: {
	deliverable: {
		id: string;
		title: string;
		projectId: string;
		projectName: string;
		clientId: string;
		clientName: string;
		description: string | null;
		status: string;
		dueDate: string | null;
		createdAt: string;
		updatedAt: string;
	};
	projects: DeliverableDialogProject[];
}) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	return (
		<>
			<div className="flex items-start justify-between gap-4 border-b border-line pb-5">
				<div className="min-w-0">
					<h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-primary">
						{deliverable.title}
					</h1>
					<div className="mt-2">
						<DeliverableStatusBadge status={deliverable.status} />
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<Button type="button" variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
						<Pencil aria-hidden="true" className="size-3.5" />
						Editar
					</Button>
					<Button type="button" variant="ghost" size="sm" className="text-danger hover:text-danger" onClick={() => setDeleteOpen(true)}>
						<Trash2 aria-hidden="true" className="size-3.5" />
						Eliminar
					</Button>
				</div>
			</div>

			<section className="border-b border-line py-2" aria-label="Datos del entregable">
				<InfoRow
					label="Proyecto"
					value={<Link href={`/projects/${deliverable.projectId}`} className="text-accent hover:underline">{deliverable.projectName}</Link>}
				/>
				<InfoRow
					label="Cliente"
					value={<Link href={`/clients/${deliverable.clientId}`} className="text-accent hover:underline">{deliverable.clientName}</Link>}
				/>
				<InfoRow
					label="Fecha límite"
					value={deliverable.dueDate ? formatDateOnly(deliverable.dueDate) : null}
				/>
			</section>

			<section className="py-4" aria-label="Descripción del entregable">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">Descripción</p>
				{deliverable.description ? (
					<p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">
						{deliverable.description}
					</p>
				) : (
					<p className="mt-2 text-sm text-tertiary">Sin descripción.</p>
				)}
			</section>

			<p className="border-t border-line pt-3 font-mono text-[10px] text-tertiary">
				Creado {dateTimeFormatter.format(new Date(deliverable.createdAt))} · Actualizado{" "}
				{dateTimeFormatter.format(new Date(deliverable.updatedAt))}
			</p>

			<DeliverableFormDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				projects={projects}
				deliverable={deliverable}
			/>
			<DeleteDeliverableDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				deliverable={{ id: deliverable.id, title: deliverable.title }}
			/>
		</>
	);
}
