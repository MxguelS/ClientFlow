"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormAlert, buttonPrimaryClasses } from "@/components/ui/field";
import { mapAuthError } from "@/lib/auth/errors";
import { resolveAuthRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation";

export function LoginForm() {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	async function onSubmit(values: LoginInput) {
		setFormError(null);
		const supabase = createClient();

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email: values.email,
				password: values.password,
			});

			if (error) {
				setFormError(mapAuthError(error));
				return;
			}

			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data: membership } = await supabase
				.from("workspace_members")
				.select("workspace_id")
				.limit(1)
				.maybeSingle();

			const target = resolveAuthRedirect("/login", {
				isAuthenticated: true,
				hasWorkspace: membership !== null,
			});

			router.replace(target ?? "/dashboard");
			router.refresh();
		} catch {
			setFormError(mapAuthError(new TypeError("network fetch failed")));
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
			{formError ? <FormAlert>{formError}</FormAlert> : null}

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
				autoComplete="current-password"
				error={errors.password?.message}
				{...register("password")}
			/>

			<button
				type="submit"
				disabled={isSubmitting}
				className={buttonPrimaryClasses}
			>
				{isSubmitting ? (
					<Loader2 aria-hidden className="size-4 animate-spin" />
				) : null}
				Iniciar sesión
			</button>

			<p className="text-center text-sm text-neutral-500">
				¿No tienes cuenta?{" "}
				<a
					href="/register"
					className="font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
				>
					Regístrate
				</a>
			</p>
		</form>
	);
}
