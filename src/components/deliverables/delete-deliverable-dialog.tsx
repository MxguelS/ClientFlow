"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteDeliverableAction } from "@/app/(app)/deliverables/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	dialogDescriptionClasses,
	dialogTitleClasses,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/ui/field";

export function DeleteDeliverableDialog({
	open,
	onOpenChange,
	deliverable,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	deliverable: { id: string; title: string };
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	function handleClose(next: boolean) {
		if (isDeleting) return;
		setError(null);
		onOpenChange(next);
	}

	async function onDelete() {
		setIsDeleting(true);
		setError(null);
		const result = await deleteDeliverableAction(deliverable.id);

		if (result.status === "success") {
			onOpenChange(false);
			setIsDeleting(false);
			router.push("/deliverables");
			router.refresh();
			return;
		}

		setIsDeleting(false);
		if (result.status === "not_found") {
			setError("Este entregable ya no existe o no tienes acceso.");
		} else if (result.status === "not_authenticated") {
			setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
		} else if (result.status === "no_workspace") {
			setError("No tienes un workspace activo.");
		} else if (result.status === "invalid") {
			setError(result.message);
		} else if (result.status === "error") {
			setError(result.message);
		} else {
			setError("No se pudo eliminar el entregable.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-start gap-3">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
							<TriangleAlert aria-hidden="true" className="size-4" />
						</span>
						<div className="min-w-0">
							<DialogTitle className={dialogTitleClasses}>
								Eliminar entregable
							</DialogTitle>
							<DialogDescription className={dialogDescriptionClasses}>
								Se eliminará <span className="font-medium text-primary">{deliverable.title}</span> y esta acción no se puede deshacer.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{error ? (
					<DialogBody className="pt-0">
						<FormAlert>{error}</FormAlert>
					</DialogBody>
				) : null}

				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => handleClose(false)} disabled={isDeleting}>
						Cancelar
					</Button>
					<Button type="button" variant="danger" onClick={onDelete} disabled={isDeleting}>
						{isDeleting ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
						Eliminar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
