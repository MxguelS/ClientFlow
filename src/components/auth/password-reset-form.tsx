"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormAlert, buttonPrimaryClasses } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { passwordResetSchema, type PasswordResetInput } from "@/lib/validation";

export function PasswordResetForm() {
	const [complete, setComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordResetInput>();

	async function onSubmit(values: PasswordResetInput) {
		const parsed = passwordResetSchema.safeParse(values);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Revisa los datos introducidos.");
			return;
		}
		setError(null);
		const { error: updateError } = await createClient().auth.updateUser({ password: parsed.data.password });
		if (updateError) {
			setError("No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.");
			return;
		}
		await createClient().auth.signOut();
		await fetch("/auth/recovery/complete", { method: "POST" });
		setComplete(true);
	}

	if (complete) return <div className="space-y-4"><p className="text-sm leading-6 text-secondary">Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con ella.</p><a href="/login" className="inline-flex text-sm font-medium text-primary underline underline-offset-4 hover:text-white">Volver a iniciar sesión</a></div>;

	return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>{error ? <FormAlert>{error}</FormAlert> : null}<Field id="new-password" type="password" label="Nueva contraseña" autoComplete="new-password" error={errors.password?.message} {...register("password")} /><Field id="confirm-password" type="password" label="Confirmar nueva contraseña" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} /><button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClasses} group w-full justify-between px-4`}><span>{isSubmitting ? "Actualizando..." : "Actualizar contraseña"}</span><ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" /></button></form>;
}
