"use server";

import { z } from "zod";

import {
	MAX_SLUG_ATTEMPTS,
	slugCandidate,
	slugify,
} from "@/lib/auth/slug";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validation";

export type OnboardingResult =
	| { status: "success" }
	| { status: "already_onboarded" }
	| { status: "not_authenticated" }
	| { status: "invalid"; message: string }
	| { status: "slug_exhausted"; message: string }
	| {
			status: "membership_failed";
			workspaceId: string;
			message: string;
	  }
	| { status: "error"; message: string };

export async function createWorkspaceAction(
	values: z.input<typeof onboardingSchema>,
): Promise<OnboardingResult> {
	const parsed = onboardingSchema.safeParse(values);
	if (!parsed.success) {
		return {
			status: "invalid",
			message:
				parsed.error.issues[0]?.message ??
				"Datos del workspace inválidos.",
		};
	}

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		return { status: "not_authenticated" };
	}

	// RLS: solo se ven las membresías propias. Si ya tiene workspace,
	// el onboarding no debe repetirse.
	const { data: existingMembership, error: membershipLookupError } = await supabase
		.from("workspace_members")
		.select("workspace_id")
		.limit(1)
		.maybeSingle();

	if (membershipLookupError) {
		console.error(
			"onboarding membership lookup failed:",
			membershipLookupError.code,
			membershipLookupError.message,
		);
		return { status: "error", message: "No se pudo comprobar el estado de tu workspace." };
	}
	if (existingMembership) {
		return { status: "already_onboarded" };
	}

	const name = parsed.data.workspaceName;

	/*
	 * El id se genera en el SERVIDOR y se envía en el propio INSERT:
	 * pedir RETURNING tras el insert fallaría porque la policy SELECT de
	 * workspaces solo muestra filas de workspaces donde ya eres miembro
	 * (y aún no lo eres). Con return=minimal (default de supabase-js sin
	 * .select()) el insert es válido y conservamos el id para encadenar
	 * la membresía.
	 */
	let workspaceId: string | null = null;

	for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
		const slug = slugCandidate(slugify(name), attempt);
		const candidateId = crypto.randomUUID();
		const { error } = await supabase.from("workspaces").insert({
			id: candidateId,
			name,
			slug,
		});

		if (!error) {
			workspaceId = candidateId;
			break;
		}

		if (error.code !== "23505") {
			console.error("workspace insert failed:", error.code, error.message);
			return {
				status: "error",
				message:
					"No se pudo crear el workspace. Inténtalo de nuevo.",
			};
		}
	}

	if (!workspaceId) {
		return {
			status: "slug_exhausted",
			message:
				"No se pudo generar un identificador único para ese nombre. Prueba con otro nombre.",
		};
	}

	// 2) Crear la membresía owner. El rol lo fija el SERVIDOR: nunca
	//    proviene del cliente. La policy RLS de bootstrap exige
	//    user_id = auth.uid(), role = 'owner' y workspace sin miembros.
	const { error: memberError } = await supabase
		.from("workspace_members")
		.insert({
			workspace_id: workspaceId,
			user_id: user.id,
			role: "owner",
		});

	if (memberError) {
		// Estado intermedio real: el workspace existe pero el usuario aún
		// no es miembro. NO se oculta: se devuelve el estado para que la UI
		// ofrezca reintentar SOLO este paso.
		return {
			status: "membership_failed",
			workspaceId,
			message:
				"El workspace se creó pero no se pudo registrar tu acceso de propietario.",
		};
	}

	return { status: "success" };
}

const claimSchema = z.string().uuid();

/**
 * Reintenta ÚNICAMENTE la membresía owner sobre un workspace existente.
 * Es seguro sin comprobaciones previas: la FK garantiza que el workspace
 * existe y la policy bootstrap de RLS garantiza que solo puede reclamarse
 * como owner un workspace SIN miembros y por el propio usuario autenticado.
 */
export async function claimOwnershipAction(
	rawWorkspaceId: string,
): Promise<{ status: "success" | "failed" }> {
	const workspaceId = claimSchema.safeParse(rawWorkspaceId);
	if (!workspaceId.success) return { status: "failed" };

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { status: "failed" };

	const { error } = await supabase.from("workspace_members").insert({
		workspace_id: workspaceId.data,
		user_id: user.id,
		role: "owner",
	});

	return error ? { status: "failed" } : { status: "success" };
}
