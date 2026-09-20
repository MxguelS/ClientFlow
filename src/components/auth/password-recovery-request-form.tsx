"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, buttonPrimaryClasses } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import { passwordRecoveryRequestSchema, type PasswordRecoveryRequestInput } from "@/lib/validation";
import { RECOVERY_CONFIRMATION_MESSAGE, recoveryRedirectUrl } from "@/lib/auth/recovery";

export function PasswordRecoveryRequestForm() {
	const [submitted, setSubmitted] = useState(false);
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordRecoveryRequestInput>({ resolver: zodResolver(passwordRecoveryRequestSchema), defaultValues: { email: "" } });

	async function onSubmit(values: PasswordRecoveryRequestInput) {
		await createClient().auth.resetPasswordForEmail(values.email, { redirectTo: recoveryRedirectUrl(window.location.origin) });
		setSubmitted(true);
	}

	if (submitted) {
		return <p className="text-sm leading-6 text-secondary">{RECOVERY_CONFIRMATION_MESSAGE}</p>;
	}

	return <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate><Field id="recovery-email" type="email" label="Email" placeholder="tu@email.com" autoComplete="email" error={errors.email?.message} {...register("email")} /><button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClasses} group w-full justify-between px-4`}> <span>{isSubmitting ? "Enviando..." : "Enviar enlace de recuperación"}</span><ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" /></button></form>;
}
