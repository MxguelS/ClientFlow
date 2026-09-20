import { Building2, User } from "lucide-react";

import { ProfileForm } from "@/components/settings/profile-form";
import {
	TeamSection,
	type TeamMemberRow,
	type TeamInvitationRow,
} from "@/components/settings/team-section";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { ThemeSelector } from "@/components/theme/theme-selector";
import {
	getCurrentUser,
	getPrimaryMembership,
	getPrimaryWorkspace,
} from "@/lib/auth/session";
import { isWorkspaceRole } from "@/lib/settings/team";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ajustes · ClientFlow" };

function SectionHeading({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof User;
	title: string;
	description: string;
}) {
	return (
		<div className="mb-4">
			<div className="flex items-center gap-2">
				<Icon aria-hidden="true" className="size-4 text-accent" />
				<h2 className="text-sm font-semibold text-primary">{title}</h2>
			</div>
			<p className="mt-1 text-xs leading-5 text-secondary">{description}</p>
		</div>
	);
}

export default async function SettingsPage() {
	const user = await getCurrentUser();
	const membership = await getPrimaryMembership();
	const workspace = await getPrimaryWorkspace();

	const supabase = await createClient();
	const [{ data: profile }, { data: members }, { data: invitations }] =
		await Promise.all([
			user
				? supabase
						.from("profiles")
						.select("full_name")
						.eq("id", user.id)
						.maybeSingle()
				: Promise.resolve({ data: null } as const),
			workspace
				? supabase.rpc("list_workspace_members", {
						p_workspace_id: workspace.id,
					})
				: Promise.resolve({ data: null } as const),
			workspace
				? supabase.rpc("list_workspace_invitations", {
						p_workspace_id: workspace.id,
					})
				: Promise.resolve({ data: null } as const),
		]);

	const viewerRole = isWorkspaceRole(membership?.role)
		? membership.role
		: "member";

	const teamMembers: TeamMemberRow[] = (members ?? []).map((row) => ({
		userId: row.user_id,
		role: row.role ?? "member",
		fullName: row.full_name,
		email: row.email,
		joinedAt: row.joined_at ?? "",
	}));

	const pendingInvitations: TeamInvitationRow[] = (invitations ?? []).map(
		(row) => ({
			id: row.id,
			email: row.email,
			role: row.role,
			expiresAt: row.expires_at ?? "",
		}),
	);

	return (
		<div className="mx-auto max-w-5xl px-5 py-6 sm:px-8 lg:px-10">
			<header className="border-b border-line pb-5">
				<p className="text-sm font-medium text-secondary">
					Cuenta y preferencias
				</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary sm:text-3xl">
					Ajustes
				</h1>
				<p className="mt-1.5 max-w-xl text-sm text-secondary">
					Gestiona tu perfil, tu workspace y la apariencia de la aplicación.
				</p>
			</header>

			<div className="mt-6 space-y-6 pb-10">
				<section
					aria-labelledby="settings-profile-heading"
					className="border-b border-line py-5 sm:py-6"
				>
					<div id="settings-profile-heading">
						<SectionHeading
							icon={User}
							title="Perfil"
							description="Cómo te muestran los demás miembros del workspace."
						/>
					</div>
					<ProfileForm
						fullName={profile?.full_name ?? ""}
						email={user?.email ?? ""}
					/>
				</section>

				<section
					aria-labelledby="settings-workspace-heading"
					className="border-b border-line py-5 sm:py-6"
				>
					<div id="settings-workspace-heading">
						<SectionHeading
							icon={Building2}
							title="Workspace"
							description="Datos del espacio de trabajo activo."
						/>
					</div>
					<WorkspaceForm
						name={membership?.workspaceName ?? ""}
						canEdit={viewerRole === "owner" || viewerRole === "admin"}
					/>

					{user ? (
						<TeamSection
							currentUserId={user.id}
							viewerRole={viewerRole}
							initialMembers={teamMembers}
							initialInvitations={pendingInvitations}
						/>
					) : null}
				</section>

				<section
					aria-labelledby="settings-appearance-heading"
					className="border-b border-line py-5 sm:py-6"
				>
					{/* El selector mantiene las tres opciones de apariencia aprobadas. */}
					<span id="settings-appearance-heading" className="sr-only">
						Apariencia
					</span>
					<ThemeSelector />
				</section>
			</div>
		</div>
	);
}
