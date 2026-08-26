"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ClientsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
			<div className="border-y border-line py-16 text-center">
				<h1 className="text-base font-medium text-primary">No se pudieron cargar los clientes.</h1>
				<p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-secondary">
					Ocurrió un problema al consultar la lista. Comprueba tu conexión e inténtalo de nuevo.
				</p>
				<Button type="button" variant="secondary" className="mt-5" onClick={reset}>
					<RotateCcw aria-hidden="true" className="size-4" />
					Reintentar
				</Button>
			</div>
		</div>
	);
}
