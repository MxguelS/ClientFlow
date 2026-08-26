"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormAlert, buttonPrimaryClasses } from "@/components/ui/field";
import {
	claimOwnershipAction,
	createWorkspaceAction,
	type OnboardingResult,
} from "@/app/onboarding/actions";
import { slugify } from "@/lib/auth/slug";
import {
	onboardingSchema,
	type OnboardingInput,
} from "@/lib/validation";

export function OnboardingForm() {
	const router = useRouter();
	const [formError, setFormError] = useState<string | null>(null);
	const [inconsistentWorkspaceId, setInconsistentWorkspaceId] = useState<
		string | null
	>(null);
	const [retrying, setRetrying] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<OnboardingInput>({
		resolver: zodResolver(onboardingSchema),
		defaultValues: { workspaceName: "" },
	});

	const [slugPreview, setSlugPreview] = useState("workspace");

	async function finish() {
		router.replace("/dashboard");
		router.refresh();
	}

	async function onSubmit(values: OnboardingInput) {
		setFormError(null);
		setInconsistentWorkspaceId(null);

		let result: OnboardingResult;
		try {
			result = await createWorkspaceAction(values);
		} catch {
			setFormError(
				"Error de red al crear el workspace. Inténtalo de nuevo.",
			);
			return;
		}

		switch (result.status) {
			case "success":
			case "already_onboarded":
				await finish();
				break;
			case "not_authenticated":
				router.replace("/login");
				break;
			case "membership_failed":
				setInconsistentWorkspaceId(result.workspaceId);
				setFormError(
					`${result.message} El estado es recuperable: reintenta el registro de tu acceso.`,
				);
				break;
			default:
				setFormError(result.message);
		}
	}

	async function retryOwnership() {
		if (!inconsistentWorkspaceId) return;
		setRetrying(true);
		setFormError(null);

		let result: { status: "success" | "failed" };
		try {
			result = await claimOwnershipAction(inconsistentWorkspaceId);
		} catch {
			result = { status: "failed" };
		}

		setRetrying(false);
		if (result.status === "success") {
			await finish();
			return;
		}
		setFormError(
			"El reintento falló. El workspace quedó creado pero sin acceso. Contacta con soporte indicando este identificador: " +
				inconsistentWorkspaceId,
		);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
			{formError ? <FormAlert>{formError}</FormAlert> : null}

			<Field
				id="workspaceName"
				type="text"
				label="Nombre de tu workspace"
				placeholder='p. ej. "Estudio Antonio"'
				autoComplete="organization"
				error={errors.workspaceName?.message}
				{...register("workspaceName", {
					onChange: (event) => setSlugPreview(slugify(event.target.value)),
				})}
			/>

			<p className="text-xs text-neutral-500">
				Identificador público:{" "}
				<code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-neutral-700">
					{slugPreview}
				</code>
			</p>

			{inconsistentWorkspaceId ? (
				<button
					type="button"
					onClick={retryOwnership}
					disabled={retrying}
					className={buttonPrimaryClasses}
				>
					{retrying ? (
						<Loader2 aria-hidden className="size-4 animate-spin" />
					) : null}
					Reintentar acceso propietario
				</button>
			) : (
				<button
					type="submit"
					disabled={isSubmitting}
					className={buttonPrimaryClasses}
				>
					{isSubmitting ? (
						<Loader2 aria-hidden className="size-4 animate-spin" />
					) : null}
					Crear workspace
				</button>
			)}
		</form>
	);
}
