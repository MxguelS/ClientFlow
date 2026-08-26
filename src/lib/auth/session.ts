import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
	id: string;
	email: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	return {
		id: user.id,
		email: user.email ?? "",
	};
}

/**
 * Devuelve la membresía primaria del usuario autenticado junto al nombre
 * de su workspace. RLS garantiza que solo se ven las membresías propias.
 */
export async function getPrimaryMembership(): Promise<{
	workspaceName: string;
	role: string;
} | null> {
	const supabase = await createClient();

	const { data } = await supabase
		.from("workspace_members")
		.select("role, workspace:workspaces(name)")
		.limit(1)
		.maybeSingle();

	if (!data) return null;

	return {
		role: data.role,
		// El embed tipado devuelve objeto por la FK real.
		workspaceName:
			typeof data.workspace === "object" && data.workspace !== null
				? (data.workspace.name as string)
				: "",
	};
}

export async function hasAnyWorkspace(): Promise<boolean> {
	return (await getPrimaryMembership()) !== null;
}
