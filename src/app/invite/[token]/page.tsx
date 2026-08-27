import { ShieldQuestion } from "lucide-react";
import Link from "next/link";

import { AcceptInviteDialog } from "@/components/settings/accept-invite-dialog";

export const metadata = { title: "Invitación · ClientFlow" };

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,50}$/;

/**
 * Landing pública de invitación. No revela ningún dato del workspace ni
 * de la invitación: la validación real (hash, estado, expiración, email)
 * ocurre dentro de accept_workspace_invitation al confirmar.
 */
export default async function InvitePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const validShape = TOKEN_PATTERN.test(token);

	return (
		<div className="flex min-h-svh items-center justify-center px-5 py-10">
			<div className="w-full max-w-md rounded-lg border border-line bg-surface-raised p-6">
				<div className="flex items-center gap-2.5">
					<ShieldQuestion aria-hidden="true" className="size-4 text-accent" />
					<h1 className="text-lg font-semibold tracking-[-0.02em] text-primary">
						{validShape ? "Te han invitado a ClientFlow" : "Enlace inválido"}
					</h1>
				</div>

				{validShape ? (
					<>
						<p className="mt-2 text-sm leading-6 text-secondary">
							Inicia sesión o crea tu cuenta con el email al que se dirigió esta
							invitación y confirma para incorporarte al workspace.
						</p>
						<AcceptInviteDialog
							token={token}
							cancelHref="/login"
						/>
						<p className="mt-4 text-xs leading-5 text-tertiary">
							Si necesitas iniciar sesión primero,{" "}
							<Link href="/login" className="text-accent hover:underline">
								accede aquí
							</Link>{" "}
							y vuelve a abrir este enlace.
						</p>
					</>
				) : (
					<p className="mt-2 text-sm leading-6 text-secondary">
						Este enlace no tiene el formato correcto. Pide una nueva invitación
						al administrador de tu workspace.
					</p>
				)}
			</div>
		</div>
	);
}