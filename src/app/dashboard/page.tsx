import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import {
	getCurrentUser,
	getPrimaryMembership,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · ClientFlow" };

export default async function DashboardPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/login");

	const membership = await getPrimaryMembership();
	if (!membership) redirect("/onboarding");

	const supabase = await createClient();
	const { data: profile } = await supabase
		.from("profiles")
		.select("full_name")
		.eq("id", user.id)
		.maybeSingle();

	const displayName = profile?.full_name || user.email;
	const roleLabel =
		membership.role.charAt(0).toUpperCase() + membership.role.slice(1);

	return (
		<main className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
				<h1 className="text-xl font-bold tracking-tight">ClientFlow</h1>

				<p className="mt-4 text-2xl font-semibold">
					Hola, {displayName}
				</p>

				<dl className="mt-6 space-y-2 text-sm">
					<div className="flex justify-between gap-4">
						<dt className="text-neutral-500">Workspace:</dt>
						<dd className="font-medium">{membership.workspaceName}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-neutral-500">Rol:</dt>
						<dd className="font-medium">{roleLabel}</dd>
					</div>
					<div className="flex justify-between gap-4">
						<dt className="text-neutral-500">Email:</dt>
						<dd className="font-medium">{user.email}</dd>
					</div>
				</dl>

				<div className="mt-8 flex justify-end">
					<LogoutButton />
				</div>
			</div>
		</main>
	);
}
