"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
	DeliverableFormDialog,
	type DeliverableDialogProject,
} from "@/components/deliverables/deliverable-form-dialog";
import { DeliverableStatusBadge } from "@/components/deliverables/deliverable-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/date-only";

export function ProjectDeliverablesSection({
	deliverables,
	projects,
	currentProjectId,
}: {
	deliverables: Array<{
		id: string;
		title: string;
		status: string;
		dueDate: string | null;
	}>;
	projects: DeliverableDialogProject[];
	currentProjectId: string;
}) {
	const [createOpen, setCreateOpen] = useState(false);

	return (
		<section className="border-t border-line py-4" aria-label="Entregables del proyecto">
			<div className="flex items-center justify-between gap-3">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
					Entregables
				</p>
				<Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
					<Plus aria-hidden="true" className="size-3.5" />
					Crear entregable
				</Button>
			</div>

			{deliverables.length === 0 ? (
				<p className="mt-2 text-sm text-tertiary">
					Este proyecto todavía no tiene entregables.
				</p>
			) : (
				<ul className="mt-2 border-y border-line">
					{deliverables.map((deliverable) => (
						<li key={deliverable.id} className="border-b border-line last:border-b-0">
							<Link
								href={`/deliverables/${deliverable.id}`}
								className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-2 py-2.5 transition-colors hover:bg-surface-hover sm:grid-cols-[minmax(0,1fr)_130px_110px]"
							>
								<span className="truncate text-sm font-medium text-primary">
									{deliverable.title}
								</span>
								<DeliverableStatusBadge status={deliverable.status} />
								<span className="col-span-2 font-mono text-[10px] text-tertiary sm:col-span-1 sm:text-right sm:text-xs">
									{deliverable.dueDate ? formatDateOnly(deliverable.dueDate) : "Sin fecha"}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			<DeliverableFormDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				projects={projects}
				defaultProjectId={currentProjectId}
			/>
		</section>
	);
}
