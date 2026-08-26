"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { Button } from "@/components/ui/button";

export interface ClientDetailData {
	id: string;
	name: string;
	company: string | null;
	email: string | null;
	phone: string | null;
	notes: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
	dateStyle: "medium",
	timeStyle: "short",
});

function InfoRow({ label, value }: { label: string; value: string | null }) {
	return (
		<div className="flex items-baseline justify-between gap-6 py-2.5">
			<span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">{label}</span>
			<span className="min-w-0 truncate text-right text-sm text-primary">
				{value ?? <span className="text-tertiary">—</span>}
			</span>
		</div>
	);
}

export function ClientPanel({ client }: { client: ClientDetailData }) {
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [pending, setPending] = useState<"edit" | "delete" | null>(null);

	return (
		<div>
			<div className="flex items-start justify-between gap-4 border-b border-line pb-5">
				<div className="min-w-0">
					<h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-primary">{client.name}</h1>
					<div className="mt-2">
						<ClientStatusBadge status={client.status} />
					</div>
				</div>
				<div className="flex shrink-0 gap-1.5">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => {
							setPending("edit");
							setEditOpen(true);
						}}
					>
						<Pencil aria-hidden="true" className="size-3.5" />
						Editar
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-danger hover:bg-danger-soft hover:text-danger"
						onClick={() => {
							setPending("delete");
							setDeleteOpen(true);
						}}
					>
						{pending === "delete" ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <Trash2 aria-hidden="true" className="size-3.5" />}
						Eliminar
					</Button>
				</div>
			</div>

			<section className="border-b border-line py-2" aria-label="Datos del cliente">
				<InfoRow label="Empresa" value={client.company} />
				<InfoRow label="Email" value={client.email} />
				<InfoRow label="Teléfono" value={client.phone} />
			</section>

			<section className="border-b border-line py-4" aria-label="Notas">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">Notas</p>
				{client.notes ? (
					<p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">{client.notes}</p>
				) : (
					<p className="mt-2 text-sm text-tertiary">Sin notas.</p>
				)}
			</section>

			<section className="border-b border-line py-4" aria-label="Proyectos del cliente">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">Proyectos</p>
				<p className="mt-2 text-sm text-tertiary">Los proyectos de este cliente aparecerán aquí.</p>
			</section>

			<section className="py-4" aria-label="Facturación del cliente">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">Facturación</p>
				<p className="mt-2 text-sm text-tertiary">Las facturas de este cliente aparecerán aquí.</p>
			</section>

			<p className="border-t border-line pt-3 font-mono text-[10px] text-tertiary">
				Creado {dateTimeFormatter.format(new Date(client.createdAt))} · Actualizado{" "}
				{dateTimeFormatter.format(new Date(client.updatedAt))}
			</p>

			<ClientFormDialog
				open={editOpen}
				onOpenChange={(open) => {
					setEditOpen(open);
					if (!open) setPending(null);
				}}
				client={client}
			/>
			<DeleteClientDialog
				open={deleteOpen}
				onOpenChange={(open) => {
					setDeleteOpen(open);
					if (!open) setPending(null);
				}}
				client={{ id: client.id, name: client.name }}
			/>
		</div>
	);
}
