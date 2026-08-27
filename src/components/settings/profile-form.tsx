"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { updateProfileAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import {
	profileSettingsSchema,
	type ProfileSettingsInput,
} from "@/lib/settings/validation";

const ACTION_ERRORS: Record<string, string> = {
	not_authenticated: "Tu sesión ha expirado. Vuelve a iniciar sesión.",
	forbidden: "No tienes permiso para modificar este perfil.",
	no_workspace: "No tienes un workspace activo.",
};

export function ProfileForm({
	fullName,
	email,
}: {
	fullName: string;
	email: string;
}) {
	const [serverError, setServerError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const defaultValues = { fullName };

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<ProfileSettingsInput>({
		resolver: zodResolver(profileSettingsSchema),
		defaultValues,
	});

	useEffect(() => {
		reset({ fullName });
	}, [fullName, reset]);

	async function onSubmit(values: ProfileSettingsInput) {
		setServerError(null);
		setSaved(false);

		const result = await updateProfileAction(values);

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

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
			{serverError ? <FormAlert>{serverError}</FormAlert> : null}

			<Field
				id="settings-profile-name"
				label="Nombre"
				placeholder="Tu nombre"
				autoComplete="name"
				error={errors.fullName?.message}
				{...register("fullName")}
			/>

			<div>
				<span
					className="block text-[13px] font-medium text-primary"
					id="settings-profile-email-label"
				>
					Email
				</span>
				<p
					className="mt-1.5 font-mono text-sm text-secondary"
					aria-labelledby="settings-profile-email-label"
				>
					{email}
				</p>
				<p className="mt-1 text-xs text-tertiary">
					Pertenece a tu cuenta y no puede modificarse aquí.
				</p>
			</div>

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