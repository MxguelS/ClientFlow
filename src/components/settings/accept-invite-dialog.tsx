"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { acceptInviteAction } from "@/app/(app)/settings/team-actions";
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
import { FormAlert } from "@/components/ui/field";

const ACCEPT_ERRORS: Record<string, string> = {
	not_authenticated:
		"Primero inicia sesión o crea tu cuenta. Después vuelve a este enlace y acepta.",
	invalid_token:
		"Este enlace ya no es válido. Puede haber sido usado, revocado o caducado.",
	email_mismatch:
		"La invitación está destinada a otro email. Inicia sesión con la cuenta invitada.",
	already_in_workspace:
		"Esta cuenta ya pertenece a un workspace. De momento ClientFlow permite un único workspace por usuario.",
	expired: "Esta invitación ha expirado. Solicita una nueva al administrador.",
};

export function AcceptInviteDialog({
	token,
	open = true,
	onOpenChange,
	cancelHref,
}: {
	token: string;
	open?: boolean;
	/** Opcional: cerrar desde la UI embebida. En modo landing pública no se pasa. */
	onOpenChange?: (open: boolean) => void;
	/** Destino al pulsar Cancelar (p. ej. /login en la landing pública). */
	cancelHref?: string;
}) {
	const handleClose = (next: boolean) => {
		if (submitting) return;
		if (!next && !cancelHref) {
			onOpenChange?.(false);
			return;
		}
	};
	void handleClose;
	const router = useRouter();
	const [errorKey, setErrorKey] = useState<string | null>(null);
	const [acceptedName, setAcceptedName] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function onAccept() {
		setSubmitting(true);
		setErrorKey(null);

		const result = await acceptInviteAction(token);

		if (result.status === "success") {
			setAcceptedName(result.workspaceName || "tu nuevo workspace");
			setSubmitting(false);
			return;
		}

		setErrorKey(result.status === "error" ? "__generic" : result.status);
		setSubmitting(false);
	}

	return (
		<Dialog open={open} onOpenChange={cancelHref ? undefined : (onOpenChange ?? undefined)}>
			<DialogContent className="sm:max-w-md">
				{acceptedName !== null ? (
					<>
						<DialogHeader>
							<DialogTitle className={dialogTitleClasses}>
								<span className="inline-flex items-center gap-1.5">
									<Check aria-hidden="true" className="size-4 text-success" />
									Invitación aceptada
								</span>
							</DialogTitle>
							<DialogDescription className={dialogDescriptionClasses}>
								Ahora formas parte de{" "}
								<b className="font-medium text-primary">{acceptedName}</b>.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								type="button"
								onClick={() => {
									router.push("/dashboard");
									router.refresh();
								}}
							>
								Ir al dashboard
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle className={dialogTitleClasses}>
								Aceptar invitación
							</DialogTitle>
							<DialogDescription className={dialogDescriptionClasses}>
								Solo se aceptará si iniciaste sesión con el email exacto al que
								se creó esta invitación.
							</DialogDescription>
						</DialogHeader>

						{errorKey ? (
							<FormAlert>
								{errorKey === "__generic"
									? "No se pudo aceptar la invitación. Inténtalo de nuevo."
									: (ACCEPT_ERRORS[errorKey] ?? ACCEPT_ERRORS.invalid_token)}
							</FormAlert>
						) : null}

						<DialogFooter>
							<Button
								type="button"
								variant="secondary"
								onClick={() =>
									cancelHref ? router.push(cancelHref) : onOpenChange?.(false)
								}
								disabled={submitting}
							>
								Cancelar
							</Button>
							<Button type="button" onClick={onAccept} disabled={submitting}>
								{submitting ? (
									<Loader2 aria-hidden="true" className="size-4 animate-spin" />
								) : null}
								Aceptar e incorporarme
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}