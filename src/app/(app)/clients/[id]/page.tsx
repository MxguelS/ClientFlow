import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientPanel } from "@/components/clients/client-panel";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Cliente · ClientFlow" };

export default async function ClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = await createClient();

	const [{ data: client }, { data: allClients }] = await Promise.all([
		supabase
			.from("clients")
			.select(
				"id, name, company, email, phone, notes, status, created_at, updated_at",
			)
			.eq("id", id)
			.maybeSingle(),
		supabase
			.from("clients")
			.select("id, name, status")
			.order("created_at", { ascending: false }),
	]);

	// RLS: un cliente de otro workspace simplemente no existe para esta consulta.
	if (!client) notFound();

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<Link
				href="/clients"
				className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
			>
				<ArrowLeft aria-hidden="true" className="size-3.5" />
				Clientes
			</Link>

			<div className="mt-4 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
				{/* Lista contextual: visible junto al panel en desktop. */}
				<aside className="hidden lg:block" aria-label="Lista de clientes">
					<p className="border-b border-line pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
						Todos los clientes
					</p>
					<ul className="mt-1">
						{allClients?.map((row) => (
							<li key={row.id}>
								<Link
									href={`/clients/${row.id}`}
									aria-current={row.id === client.id ? "page" : undefined}
									className={`flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
										row.id === client.id
											? "bg-accent-soft font-medium text-accent-strong"
											: "text-secondary hover:bg-surface-hover hover:text-primary"
									}`}
								>
									<span className="min-w-0 truncate">{row.name}</span>
									<ClientStatusBadge status={row.status} />
								</Link>
							</li>
						))}
					</ul>
				</aside>

				<div className="min-w-0">
					<ClientPanel
						client={{
							id: client.id,
							name: client.name,
							company: client.company,
							email: client.email,
							phone: client.phone,
							notes: client.notes,
							status: client.status,
							createdAt: client.created_at,
							updatedAt: client.updated_at,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
