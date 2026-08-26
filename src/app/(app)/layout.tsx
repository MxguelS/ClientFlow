import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getCurrentUser, getPrimaryMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	const user = await getCurrentUser();
	if (!user) redirect("/login");

	const membership = await getPrimaryMembership();
	if (!membership) redirect("/onboarding");

	const supabase = await createClient();
	const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

	return (
		<AppShell
			user={{ name: profile?.full_name || user.email, email: user.email }}
			workspace={{ name: membership.workspaceName, slug: "" }}
		>
			{children}
		</AppShell>
	);
}
