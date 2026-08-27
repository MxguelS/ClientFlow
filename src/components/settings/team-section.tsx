"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
	createInviteAction,
	removeMemberAction,
	revokeInviteAction,
	updateMemberRoleAction,
} from "@/app/(app)/settings/team-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	dialogDescriptionClasses,
	dialogTitleClasses,
} from "@/components/ui/dialog";
import { Field, FormAlert, fieldLabelClasses } from "@/components/ui/field";
import { inputClasses, selectClasses } from "@/components/ui/input";
import { formatDateOnly } from "@/lib/dates/date-only";
import {
	canChangeRoles,
	canInvite,
	canManageMembers,
	isInvitableRole,
	isWorkspaceRole,
	INVITABLE_ROLES,
	inviteMemberSchema,
	type WorkspaceRole,
} from "@/lib/settings/team";

export interface TeamMemberRow {
	userId: string;
	role: string;
	fullName: string | null;
	email: string | null;
	joinedAt: string;
}

export interface TeamInvitationRow {
	id: string;
	email: string;
	role: string;
	expiresAt: string;
}

const invitationLink = (token: string) => `/invite/${token}`;

// ---------------------------------------------------------------
// Sub-vistas
// ---------------------------------------------------------------

function MemberLine({
	member,
	viewerRole,
	currentUserId,
	onRoleChange,
	onRemove,
	busyId,
}: {
	member: TeamMemberRow;
	viewerRole: WorkspaceRole;
	currentUserId: string;
	onRoleChange: (userId: string, role: "admin" | "member") => void;
	onRemove: (userId: string) => void;
	busyId: string | null;
}) {
	const role = isWorkspaceRole(member.role) ? member.role : "member";
	const isSelf = member.userId === currentUserId;
	const canAct = canChangeRoles(viewerRole);
	const removable =
		canAct && !(role === "owner"); // trigger protege al último owner igualmente

	return (
		<li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-1 py-3 last:border-b-0">
			<div className="min-w-0 flex-1 basis-56">
				<span className="block truncate text-sm font-medium text-primary">
					{member.fullName || member.email || "Miembro"}
					{isSelf ? <span className="ml-1.5 text-xs text-tertiary">(tú)</span> : null}
				</span>
				{member.email ? (
					<span className="block truncate text-xs text-tertiary">{member.email}</span>
				) : null}
			</div>

			{canAct && !isSelf && isInvitableRole(role) ? (
				<>
					<label className="sr-only" htmlFor={`role-${member.userId}`}>
						Cambiar rol de {member.fullName ?? member.email}
					</label>
					<select
						id={`role-${member.userId}`}
						className={`${selectClasses} h-8 w-auto pr-7 text-xs`}
						value={role}
						disabled={busyId === member.userId}
						onChange={(event) =>
							onRoleChange(member.userId, event.target.value as "admin" | "member")
						}
					>
						<option value="admin">Administrador</option>
						<option value="member">Miembro</option>
					</select>
				</>
			) : (
				<Badge variant={role === "owner" ? "accent" : "neutral"}>
					{role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro"}
				</Badge>
			)}

			{removable ? (
				<button
					type="button"
					aria-label={`Eliminar a ${member.fullName ?? member.email}`}
					disabled={busyId === member.userId}
					onClick={() => onRemove(member.userId)}
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
				>
					<Trash2 aria-hidden="true" className="size-3.5" />
				</button>
			) : null}
		</li>
	);
}

// ---------------------------------------------------------------
// Sección principal
// ---------------------------------------------------------------

export function TeamSection({
	currentUserId,
	viewerRole,
	initialMembers,
	initialInvitations,
}: {
	currentUserId: string;
	viewerRole: WorkspaceRole;
	initialMembers: TeamMemberRow[];
	initialInvitations: TeamInvitationRow[];
}) {
	const [members] = useState(initialMembers);
	const [invitations, setInvitations] = useState(initialInvitations);
	const [actionError, setActionError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	// Diálogo de invitación
	const [inviteOpen, setInviteOpen] = useState(false);
	const [createdLink, setCreatedLink] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	// Confirmación de expulsión
	const [removeTarget, setRemoveTarget] = useState<TeamMemberRow | null>(null);

	const manage = canManageMembers(viewerRole);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
		setError,
	} = useForm({
		resolver: zodResolver(inviteMemberSchema),
		defaultValues: { email: "", role: "member" as const },
	});

	async function openDialog() {
		setCreatedLink(null);
		setCopied(false);
		setInviteOpen(true);
	}

	async function onInvite(values: {
		email: string;
		role: "admin" | "member";
	}) {
		const result = await createInviteAction({
			email: values.email,
			role: values.role,
		});

		switch (result.status) {
			case "success": {
				setCreatedLink(invitationLink(result.token));
				setInvitations((prev) => [
					{
						id: crypto.randomUUID(), // solo para key local; el real llega en refresh
						email: result.email,
						role: values.role,
						expiresAt: result.expiresAt,
					},
					...prev.filter(
						(item) => item.email.toLowerCase() !== result.email.toLowerCase(),
					),
				]);
				reset({ email: "", role: values.role });
				break;
			}
			case "invalid":
				setError("email", { type: "server", message: result.message });
				break;
			case "forbidden":
				setError("email", {
					type: "server",
					message:
						"No tienes permisos para invitar con ese rol en este workspace.",
				});
				break;
			case "not_authenticated":
			case "no_workspace":
				setError("email", {
					type: "server",
					message: "Tu sesión ha expirado o no tienes workspace activo.",
				});
				break;
			default:
				setError("email", {
					type: "server",
					message:
						result.status === "error" ? result.message : "No se pudo invitar.",
				});
		}
	}

	async function onRevoke(inviteId: string) {
		setBusyId(inviteId);
		setActionError(null);
		const result = await revokeInviteAction(inviteId);
		if (result.status === "success") {
			setInvitations((prev) => prev.filter((item) => item.id !== inviteId));
		} else if (result.status === "error") {
			setActionError(result.message);
		} else if (result.status === "not_found") {
			setActionError("La invitación ya no está disponible.");
		}
		setBusyId(null);
	}

	async function onRoleChange(userId: string, role: "admin" | "member") {
		setBusyId(userId);
		setActionError(null);
		const result = await updateMemberRoleAction({ userId, role });
		if (
			result.status === "success" ||
			(result.status === "error" && false)
		) {
			refreshTeam();
		} else if (result.status === "invalid") {
			setActionError(result.message);
		} else if (result.status === "not_found") {
			setActionError("El miembro ya no está disponible.");
		}
		setBusyId(null);
	}

	async function refreshTeam() {
		window.location.reload();
	}

	async function onConfirmRemove() {
		if (!removeTarget) return;
		setBusyId(removeTarget.userId);
		setActionError(null);
		const result = await removeMemberAction(removeTarget.userId);
		setBusyId(null);
		if (result.status === "success") {
			setRemoveTarget(null);
			refreshTeam();
		} else if ("message" in result && result.message) {
			setActionError(result.message);
		} else {
			setActionError("No se pudo eliminar el miembro.");
		}
	}

	if (!manage) {
		return (
			<section aria-labelledby="team-heading" className="pt-6">
				<div id="team-heading" className="mb-4">
					<h2 className="text-sm font-semibold text-primary">Equipo</h2>
					<p className="mt-1 text-xs leading-5 text-secondary">
						Solo el propietario o un administrador gestionan los miembros.
					</p>
				</div>
				<ul className="rounded-lg border border-line bg-surface-raised px-4 py-1">
					{members.map((member) => (
						<MemberLine
							key={member.userId}
							member={member}
							viewerRole={viewerRole}
							currentUserId={currentUserId}
							onRoleChange={() => {}}
							onRemove={() => {}}
							busyId={null}
						/>
					))}
				</ul>
			</section>
		);
	}

	return (
		<section aria-labelledby="team-heading" className="pt-6">
			<div id="team-heading" className="mb-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h2 className="text-sm font-semibold text-primary">Equipo</h2>
						<p className="mt-1 text-xs leading-5 text-secondary">
							Miembros e invitaciones de tu workspace.
						</p>
					</div>
					<Button type="button" size="sm" onClick={openDialog}>
						<UserPlus aria-hidden="true" className="size-3.5" />
						Invitar miembro
					</Button>
				</div>
			</div>

			{actionError ? (
				<div className="mb-3">
					<FormAlert>{actionError}</FormAlert>
				</div>
			) : null}

			{/* Miembros */}
			<ul className="rounded-t-lg border border-line bg-surface-raised px-4 py-1">
				{members.map((member) => (
					<MemberLine
						key={member.userId}
						member={member}
						viewerRole={viewerRole}
						currentUserId={currentUserId}
						onRoleChange={onRoleChange}
						onRemove={(userId) =>
							setRemoveTarget(members.find((m) => m.userId === userId) ?? null)
						}
						busyId={busyId}
					/>
				))}
			</ul>

			{/* Invitaciones pendientes */}
			{invitations.length > 0 ? (
				<div className="mt-5">
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-tertiary">
						Invitaciones pendientes
					</p>
					<ul className="mt-2 rounded-b-lg border border-t-0 border-line bg-surface-raised">
						{invitations.map((invite) => (
							<li
								key={`${invite.id}-${invite.email}`}
								className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 last:border-b-0"
							>
								<div className="min-w-0 flex-1 basis-56">
									<span className="block truncate text-sm text-primary">{invite.email}</span>
									<span className="block text-xs text-tertiary">
										Expira {invite.expiresAt ? formatDateOnly(invite.expiresAt.slice(0, 10)) : "—"}
									</span>
								</div>
								<Badge variant={invite.role === "admin" ? "accent" : "neutral"}>
									{invite.role === "admin" ? "Administrador" : "Miembro"}
								</Badge>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-danger hover:bg-danger-soft hover:text-danger"
									disabled={busyId === invite.id}
									onClick={() => onRevoke(invite.id)}
								>
									{busyId === invite.id ? (
										<Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
									) : null}
									Revocar
								</Button>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{/* Dialog invitar / enlace dev */}
			<Dialog
				open={inviteOpen}
				onOpenChange={(next) => {
					setInviteOpen(next);
					if (!next) reset({ email: "", role: "member" });
				}}
			>
				<DialogContent className="sm:max-w-md">
					{createdLink ? (
						<>
							<DialogHeader>
								<DialogTitle className={dialogTitleClasses}>
									<span className="inline-flex items-center gap-1.5">
										<ShieldCheck aria-hidden="true" className="size-4 text-success" />
										Invitación creada
									</span>
								</DialogTitle>
								<DialogDescription className={dialogDescriptionClasses}>
									Este enlace funciona una única vez y expira en 7 días.
								</DialogDescription>
							</DialogHeader>
							<div className="rounded-md border border-line bg-surface-sunken p-3">
								<code className="break-all text-xs text-secondary">{createdLink}</code>
							</div>
							<p className="text-xs leading-5 text-tertiary">
								Mecanismo temporal de desarrollo: comparte el enlace con la persona invitada. No se volverá a mostrar.
							</p>
							<DialogFooter>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										void navigator.clipboard.writeText(window.location.origin + createdLink);
										setCopied(true);
									}}
								>
									{copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
									{copied ? "Copiado" : "Copiar enlace"}
								</Button>
								<Button
									type="button"
									onClick={() => {
										setInviteOpen(false);
										window.location.reload();
									}}
								>
									Listo
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle className={dialogTitleClasses}>Invitar miembro</DialogTitle>
								<DialogDescription className={dialogDescriptionClasses}>
									Se creará un enlace único válido por 7 días para{" "}
									<b className="font-medium text-primary">{viewerRole === "owner" ? "administrador o miembro" : "miembro"}</b>.
								</DialogDescription>
							</DialogHeader>
							<form
								id="invite-form"
								onSubmit={handleSubmit(onInvite)}
								className="space-y-4"
								noValidate
							>
								<Field
									id="invite-email"
									label="Email"
									type="email"
									placeholder="persona@empresa.com"
									autoComplete="off"
									error={errors.email?.message}
									{...register("email")}
								/>
								<div>
									<label htmlFor="invite-role" className={fieldLabelClasses}>
										Rol
									</label>
									<select
										id="invite-role"
										className={`${inputClasses} mt-1.5 cursor-pointer`}
										aria-invalid={errors.role ? true : undefined}
										{...register("role")}
									>
										{(INVITABLE_ROLES as readonly string[])
											.filter((value) => canInvite(viewerRole, value as never))
											.map((value) => (
												<option key={value} value={value}>
													{value === "admin" ? "Administrador" : "Miembro"}
												</option>
											))}
									</select>
									{errors.role?.message ? (
										<p role="alert" className="mt-1.5 text-[13px] text-danger">
											{errors.role.message}
										</p>
									) : null}
								</div>
							</form>
							<DialogFooter>
								<Button
									type="button"
									variant="secondary"
									onClick={() => setInviteOpen(false)}
									disabled={isSubmitting}
								>
									Cancelar
								</Button>
								<Button type="submit" form="invite-form" disabled={isSubmitting}>
									{isSubmitting ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
									Crear invitación
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Confirmar expulsión */}
			<Dialog
				open={removeTarget !== null}
				onOpenChange={(next) => {
					if (!next && busyId === null) setRemoveTarget(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className={dialogTitleClasses}>Eliminar miembro</DialogTitle>
						<DialogDescription className={dialogDescriptionClasses}>
							Se quitará el acceso de{" "}
							<b className="font-medium text-primary">
								{removeTarget?.fullName || removeTarget?.email}
							</b>{" "}
							a este workspace y no podrá recuperar sus datos sin una nueva invitación.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							onClick={() => setRemoveTarget(null)}
							disabled={busyId !== null}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							variant="danger"
							onClick={onConfirmRemove}
							disabled={busyId !== null}
						>
							{busyId !== null ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
							Eliminar acceso
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
