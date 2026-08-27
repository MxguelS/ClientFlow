"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { updateWorkspaceAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { WORKSPACE_NAME_MAX } from "@/lib/validation";
import {
	workspaceSettingsSchema,
	type WorkspaceSettingsInput,
} from "@/lib/settings/validation";

const ACTION_ERRORS: Record<string, string> = {
	not_authenticated: "Tu sesión ha expirado. Vuelve a iniciar sesión.",
	no_workspace: "No tienes un workspace activo.",
	forbidden:
		"Solo el propietario o un administrador pueden modificar el workspace.",
};

export function WorkspaceForm({
	name,
	canEdit,
}: {
	name: string;
	canEdit: boolean;
}) {
	const [serverError, setServerError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const defaultValues = { name };

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<WorkspaceSettingsInput>({
		resolver: zodResolver(workspaceSettingsSchema),
		defaultValues,
	});

	useEffect(() => {
		reset({ name });
	}, [name, reset]);

	async function onSubmit(values: WorkspaceSettingsInput) {
		setServerError(null);
		setSaved(false);

		const result = await updateWorkspaceAction(values);

		switch (result.status) {
			case "success":
				reset(values);
				setSaved(true);
				break;
			case "invalid":
				setServerError(result.message);
				break;
			default:
				setServerError(
					ACTION_ERRORS[result.status] ??
						"No se pudo guardar. Inténtalo de nuevo.",
				);
		}
	}

	if (!canEdit) {
		return (
			<div className="space-y-4">
				<div>
					<span
						className="block text-[13px] font-medium text-primary"
						id="settings-workspace-name-label"
					>
						Nombre del workspace
					</span>
					<p
						className="mt-1.5 text-sm text-secondary"
						aria-labelledby="settings-workspace-name-label"
					>
						{name}
					</p>
				</div>
				<p className="inline-flex items-center gap-1.5 text-xs text-tertiary">
					<Lock aria-hidden="true" className="size-3" />
					Solo el propietario o un administrador pueden modificar estos datos.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
			{serverError ? <FormAlert>{serverError}</FormAlert> : null}

			<Field
				id="settings-workspace-name"
				label="Nombre del workspace"
				placeholder="Nombre de tu negocio"
				maxLength={WORKSPACE_NAME_MAX}
				error={errors.name?.message}
				{...register("name")}
			/>

			<div className="flex items-center gap-3 pt-1">
				<Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
					{isSubmitting ? (
						<Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
					) : null}
					Guardar cambios
				</Button>
				<span aria-live="polite" role="status">
					{saved && !isDirty ? (
						<span className="inline-flex items-center gap-1 text-xs font-medium text-success">
							<Check aria-hidden="true" className="size-3.5" />
							Cambios guardados
						</span>
					) : null}
				</span>
			</div>
		</form>
	);
}