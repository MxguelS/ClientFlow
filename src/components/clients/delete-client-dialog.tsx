"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteClientAction } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

export function DeleteClientDialog({
	open,
	onOpenChange,
	client,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	client: { id: string; name: string };
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	function handleClose(next: boolean) {
		if (!isDeleting) {
			setError(null);
			onOpenChange(next);
		}
	}

	async function onDelete() {
		setIsDeleting(true);
		setError(null);

		const result = await deleteClientAction(client.id);

		if (result.status === "success") {
			onOpenChange(false);
			setIsDeleting(false);
			router.push("/clients");
			router.refresh();
			return;
		}

		setIsDeleting(false);
		if (result.status === "has_related_records") {
			setError(result.message);
		} else if (result.status === "not_found") {
			setError("Este cliente ya no existe o no tienes acceso.");
		} else if (result.status === "not_authenticated") {
			setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
		} else if (result.status === "no_workspace") {
			setError("No tienes un workspace activo.");
		} else if (result.status === "invalid") {
			setError(result.message);
		} else {
			setError(result.message);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<div className="flex items-start gap-3">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
						<TriangleAlert aria-hidden="true" className="size-4" />
					</span>
					<div>
						<DialogTitle className="text-base font-semibold text-primary">
							Eliminar cliente
						</DialogTitle>
						<DialogDescription className="mt-1.5 text-sm leading-6 text-secondary">
							Se eliminará <span className="font-medium text-primary">{client.name}</span> y
							esta acción no se puede deshacer.
						</DialogDescription>
					</div>
				</div>

				{error ? (
					<div role="alert" className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
						{error}
					</div>
				) : null}

				<div className="mt-5 flex justify-end gap-2">
					<Button type="button" variant="secondary" onClick={() => handleClose(false)} disabled={isDeleting}>
						Cancelar
					</Button>
					<Button type="button" variant="danger" onClick={onDelete} disabled={isDeleting}>
						{isDeleting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
						Eliminar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
