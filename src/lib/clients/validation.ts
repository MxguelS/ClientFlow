import { z } from "zod";

/**
 * Esquema de formulario de cliente.
 *
 * Los límites reflejan constraints REALES de PostgreSQL:
 * - name: check (char_length(name) between 1 and 150)
 * - status: check (status in ('active','inactive','lead'))
 * - company/email/phone/notes: text nullable, sin límite en BD.
 *
 * Los campos opcionales se normalizan: string vacío -> null.
 */

export const CLIENT_STATUSES = ["active", "inactive", "lead"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
	active: "Activo",
	inactive: "Inactivo",
	lead: "Prospecto",
};

export function isClientStatus(value: unknown): value is ClientStatus {
	return (
		typeof value === "string" &&
		(CLIENT_STATUSES as readonly string[]).includes(value)
	);
}

const optionalText = z
	.string()
	.trim()
	.transform((value) => (value.length === 0 ? null : value))
	.nullish()
	.transform((value) => value ?? null);

export const clientFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "El nombre es obligatorio")
		.max(150, "El nombre no puede superar 150 caracteres"),
	company: optionalText,
	email: z
		.union([z.literal(""), z.email("Introduce un email válido")])
		.transform((value) => (value === "" ? null : value))
		.nullish()
		.transform((value) => value ?? null),
	phone: optionalText,
	notes: optionalText,
	status: z.enum(CLIENT_STATUSES).default("active"),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormData = z.output<typeof clientFormSchema>;

/**
 * Valida y normaliza el payload de cliente en el servidor.
 * Devuelve el objeto listo para Supabase o null si es inválido.
 */
export function parseClientForm(
	input: unknown,
): { ok: true; data: ClientFormData } | { ok: false } {
	const result = clientFormSchema.safeParse(input);
	return result.success
		? { ok: true, data: result.data }
		: { ok: false };
}
