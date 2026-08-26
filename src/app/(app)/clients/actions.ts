"use server";

import { revalidatePath } from "next/cache";

import { getPrimaryWorkspace } from "@/lib/auth/session";
import { parseClientForm } from "@/lib/clients/validation";
import { createClient } from "@/lib/supabase/server";

export type ClientActionResult =
	| { status: "success"; id: string }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "invalid"; message: string }
	| { status: "not_found" }
	| { status: "has_related_records"; message: string }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo completar la operación. Inténtalo de nuevo.";

/**
 * Crea un cliente en el workspace ACTIVO del usuario.
 * El workspace_id se resuelve en el servidor (RLS + workspace_members);
 * nunca se acepta del cliente.
 */
export async function createClientAction(
	values: unknown,
): Promise<ClientActionResult> {
	const parsed = parseClientForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del cliente inválidos." };
	}

	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { status: "no_workspace" };

	const supabase = await createClient();

	const { data, error } = await supabase
		.from("clients")
		.insert({
			workspace_id: workspace.id,
			name: parsed.data.name,
			company: parsed.data.company,
			email: parsed.data.email,
			phone: parsed.data.phone,
			notes: parsed.data.notes,
			status: parsed.data.status,
		})
		.select("id")
		.single();

	if (error) {
		console.error("client insert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/clients");
	return { status: "success", id: data.id };
}

/**
 * Actualiza un cliente existente. La pertenencia al workspace se valida
 * implícitamente por RLS al leer la fila; si el usuario no puede verla,
 * se trata como no encontrada. workspace_id NUNCA es modificable.
 */
export async function updateClientAction(
	id: string,
	values: unknown,
): Promise<ClientActionResult> {
	if (!isUuid(id)) return { status: "not_found" };

	const parsed = parseClientForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del cliente inválidos." };
	}

	const supabase = await createClient();

	// Lectura bajo RLS: solo visible si el usuario es miembro del workspace.
	const { data: existing } = await supabase
		.from("clients")
		.select("id")
		.eq("id", id)
		.maybeSingle();

	if (!existing) return { status: "not_found" };

	const { error } = await supabase
		.from("clients")
		.update({
			name: parsed.data.name,
			company: parsed.data.company,
			email: parsed.data.email,
			phone: parsed.data.phone,
			notes: parsed.data.notes,
			status: parsed.data.status,
		})
		.eq("id", id);

	if (error) {
		console.error("client update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/clients");
	revalidatePath(`/clients/${id}`);
	return { status: "success", id };
}

/**
 * Elimina un cliente. El schema usa ON DELETE RESTRICT desde projects e
 * invoices: si existen registros relacionados, PostgreSQL rechaza la
 * operación (23503) y se explica al usuario en lugar de forzarla.
 */
export async function deleteClientAction(
	id: string,
): Promise<ClientActionResult> {
	if (!isUuid(id)) return { status: "not_found" };

	const supabase = await createClient();

	const { data: existing } = await supabase
		.from("clients")
		.select("id")
		.eq("id", id)
		.maybeSingle();

	if (!existing) return { status: "not_found" };

	const { error } = await supabase.from("clients").delete().eq("id", id);

	if (error) {
		if (error.code === "23503") {
			return {
				status: "has_related_records",
				message:
					"Este cliente tiene proyectos o facturas asociadas. Elimina o reasigna esos registros antes de eliminar al cliente.",
			};
		}
		console.error("client delete failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/clients");
	return { status: "success", id };
}

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}
