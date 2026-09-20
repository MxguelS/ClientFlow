import { z } from "zod";

/**
 * Esquema de formulario de proyecto.
 *
 * Constraints REALES de PostgreSQL reflejadas:
 * - name: check (char_length between 1 and 150)
 * - client_id: uuid nullable (FK -> clients ON DELETE RESTRICT)
 * - status: check in ('planning','active','on_hold','completed','cancelled')
 * - budget: numeric(12,2) nullable, check (>= 0) -> max 9.999.999.999,99
 * - start_date/due_date: date nullable
 * - project_dates_valid: due_date >= start_date cuando ambas existen
 */

export const PROJECT_STATUSES = [
	"planning",
	"active",
	"on_hold",
	"completed",
	"cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
	planning: "Planificación",
	active: "Activo",
	on_hold: "En pausa",
	completed: "Completado",
	cancelled: "Cancelado",
};

export function isProjectStatus(value: unknown): value is ProjectStatus {
	return (
		typeof value === "string" &&
		(PROJECT_STATUSES as readonly string[]).includes(value)
	);
}

const dateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

const optionalDate = z
	.union([dateString, z.literal(""), z.null(), z.undefined()])
	.transform((value) =>
		value === "" || value === undefined || value === null ? null : value,
	)
	.optional();

const optionalBudget = z
	.union([z.number(), z.literal(""), z.null(), z.undefined()])
	.transform((value) =>
		value === "" || value === undefined || value === null ? null : value,
	)
	.refine(
		(value) => value === null || value === undefined || (value >= 0 && value <= 9_999_999_999.99),
		"El presupuesto debe estar entre 0 y 9.999.999.999,99",
	)
	.optional();

const optionalText = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((value) => {
		const trimmed = (value ?? "").trim();
		return trimmed.length === 0 ? null : trimmed;
	})
	.optional();

export const projectFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "El nombre es obligatorio")
			.max(150, "El nombre no puede superar 150 caracteres"),
		clientId: z
			.union([z.string().uuid("Selecciona un cliente válido"), z.literal(""), z.null(), z.undefined()])
			.transform((value) => value === "" || value === undefined ? null : value),
		status: z.enum(PROJECT_STATUSES).default("planning"),
		budget: optionalBudget,
		startDate: optionalDate,
		dueDate: optionalDate,
		description: optionalText,
	})
	.refine(
		(data) =>
			!data.startDate || !data.dueDate || data.dueDate >= data.startDate,
		{
			message: "La fecha de fin no puede ser anterior a la de inicio",
			path: ["dueDate"],
		},
	);

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormData = z.output<typeof projectFormSchema>;

export function parseProjectForm(
	input: unknown,
): { ok: true; data: ProjectFormData } | { ok: false } {
	const result = projectFormSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}
