"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormAlert, buttonPrimaryClasses } from "@/components/ui/field";
import { mapAuthError } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import {
	registerSchema,
	type RegisterInput,
} from "@/lib/validation";

export function RegisterForm() {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);
	const [confirmationPending, setConfirmationPending] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(values: RegisterInput) {
		setFormError(null);
		const supabase = createClient();

		let data: Awaited<ReturnType<typeof supabase.auth.signUp>>["data"];
		try {
			const { data: signUpData, error } = await supabase.auth.signUp({
				email: values.email,
				password: values.password,
				options: {
					emailRedirectTo: `${window.location.origin}/login`,
					data: { full_name: values.fullName },
				},
			});

			if (error) {
				setFormError(mapAuthError(error));
				return;
			}
			data = signUpData;
		} catch {
			setFormError(mapAuthError(new TypeError("network fetch failed")));
			return;
		}

		// Supabase puede exigir confirmación por email: en ese caso NO hay
		// sesión inmediata y se informa al usuario en lugar de asumirla.
		if (!data.session) {
			setConfirmationPending(true);
			return;
		}

		// Profile con el id devuelto POR AUTH (nunca uno arbitrario) y
		// únicamente los permisos del propio usuario (policy
		// profiles_insert_own: id = auth.uid()). Un 23505 significa que ya
		// existía: se considera éxito.
		if (data.user) {
			const { error: profileError } = await supabase
				.from("profiles")
				.insert({
					id: data.user.id,
					full_name: values.fullName,
				});
			if (profileError && profileError.code !== "23505") {
				console.warn(
					"No se pudo crear el profile:",
					profileError.message,
				);
			}
		}

		router.replace("/onboarding");
		router.refresh();
	}

	if (confirmationPending) {
		return (
			<div className="space-y-4 text-center">
				<CheckCircle2
					aria-hidden
					className="mx-auto size-10 text-green-600"
				/>
				<h2 className="text-lg font-semibold">Confirma tu email</h2>
				<p className="text-sm text-neutral-600">
					Te hemos enviado un enlace de confirmación. Al confirmarlo
					podrás iniciar sesión.
				</p>
				<a
					href="/login"
					className={`${buttonPrimaryClasses} no-underline`}
				>
					Ir a iniciar sesión
				</a>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
			{formError ? <FormAlert>{formError}</FormAlert> : null}

			<Field
				id="fullName"
				type="text"
				label="Nombre completo"
				placeholder="Ana García"
				autoComplete="name"
				error={errors.fullName?.message}
				{...register("fullName")}
			/>

			<Field
				id="email"
				type="email"
				label="Email"
				placeholder="tu@email.com"
				autoComplete="email"
				error={errors.email?.message}
				{...register("email")}
			/>

			<Field
				id="password"
				type="password"
				label="Contraseña"
				autoComplete="new-password"
				placeholder="Mínimo 8 caracteres"
				error={errors.password?.message}
				{...register("password")}
			/>

			<Field
				id="confirmPassword"
				type="password"
				label="Confirmar contraseña"
				autoComplete="new-password"
				error={errors.confirmPassword?.message}
				{...register("confirmPassword")}
			/>

			<button
				type="submit"
				disabled={isSubmitting}
				className={buttonPrimaryClasses}
			>
				{isSubmitting ? (
					<Loader2 aria-hidden className="size-4 animate-spin" />
				) : null}
				Crear cuenta
			</button>

			<p className="text-center text-sm text-neutral-500">
				¿Ya tienes cuenta?{" "}
				<a
					href="/login"
					className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
				>
					Inicia sesión
				</a>
			</p>
		</form>
	);
}
