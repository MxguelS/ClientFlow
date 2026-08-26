import { createClient } from "@/lib/supabase/server";

import { ClientsView, type ClientRow } from "@/components/clients/clients-view";

export const metadata = { title: "Clientes · ClientFlow" };

export default async function ClientsPage() {
	const supabase = await createClient();

	const { data } = await supabase
		.from("clients")
		.select("id, name, company, email, status, created_at")
		.order("created_at", { ascending: false });

	const clients: ClientRow[] = (data ?? []).map((client) => ({
		id: client.id,
		name: client.name,
		company: client.company,
		email: client.email,
		status: client.status,
		createdAt: client.created_at,
	}));

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<ClientsView clients={clients} />
		</div>
	);
}
