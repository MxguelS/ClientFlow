"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterByQuery } from "@/lib/search/filter";

export interface ClientRow {
	id: string;
	name: string;
	company: string | null;
	email: string | null;
	status: string;
	createdAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

export function ClientsView({ clients }: { clients: ClientRow[] }) {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState("");
	const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "1");

	// Limpia ?create=1 tras abrir el diálogo por primera vez para que
	// recargar la página no vuelva a abrirlo.
	useEffect(() => {
		if (searchParams.get("create") === "1") {
			const url = new URL(window.location.href);
			url.searchParams.delete("create");
			window.history.replaceState(null, "", url.toString());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filtered = useMemo(
		() =>
			filterByQuery(clients, query, (client) => [
				client.name,
				client.company,
				client.email,
			]),
		[clients, query],
	);

	const hasClients = clients.length > 0;

	return (
		<div>
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-[-0.03em] text-primary">Clientes</h1>
				<Button type="button" onClick={() => setCreateOpen(true)}>
					<Plus aria-hidden="true" className="size-4" />
					Nuevo cliente
				</Button>
			</div>

			{hasClients ? (
				<div className="relative mt-5 max-w-sm">
					<Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary" />
					<Input
						type="search"
						placeholder="Buscar por nombre, empresa o email..."
						aria-label="Buscar clientes"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="pl-9"
					/>
				</div>
			) : null}

			{!hasClients ? (
				<div className="mt-6 border-y border-line py-14 text-center">
					<p className="text-sm font-medium text-primary">Todavía no hay clientes.</p>
					<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
						Crea tu primer cliente para empezar a asociar proyectos y facturación.
					</p>
					<Button type="button" variant="secondary" className="mt-5" onClick={() => setCreateOpen(true)}>
						<Plus aria-hidden="true" className="size-4" />
						Crear primer cliente
					</Button>
				</div>
			) : filtered.length === 0 ? (
				<div className="mt-6 border-y border-line py-12 text-center">
					<p className="text-sm font-medium text-primary">Sin resultados.</p>
					<p className="mt-1.5 text-sm text-secondary">
						Ningún cliente coincide con esta búsqueda.
					</p>
				</div>
			) : (
				<div className="mt-4 border-y border-line">
					<div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_120px_110px] gap-4 border-b border-line px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary md:grid">
						<span>Nombre</span>
						<span>Email</span>
						<span>Estado</span>
						<span className="text-right">Creado</span>
					</div>
					<ul>
						{filtered.map((client) => (
							<li key={client.id} className="border-b border-line last:border-b-0">
								<Link
									href={`/clients/${client.id}`}
									className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-3 py-3 transition-colors hover:bg-surface-hover md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_120px_110px]"
								>
									<span className="min-w-0">
										<span className="block truncate text-sm font-medium text-primary">{client.name}</span>
										{client.company ? (
											<span className="mt-0.5 block truncate text-xs text-tertiary md:hidden">{client.company}</span>
										) : null}
									</span>
									<span className="hidden min-w-0 truncate text-sm text-secondary md:block">
										{client.email ?? <span className="text-tertiary">—</span>}
									</span>
									<span className="justify-self-start md:justify-self-auto">
										<ClientStatusBadge status={client.status} />
									</span>
									<span className="hidden text-right font-mono text-xs text-tertiary md:block">
										{dateFormatter.format(new Date(client.createdAt))}
									</span>
									<span className="text-right font-mono text-[10px] text-tertiary md:hidden">
										{dateFormatter.format(new Date(client.createdAt))}
									</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}

			<ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
