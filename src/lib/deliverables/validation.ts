import { z } from "zod";

export const DELIVERABLE_STATUSES = [
	"pending",
	"in_progress",
	"in_review",
	"approved",
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
	pending: "Pendiente",
	in_progress: "En progreso",
	in_review: "En revisión",
	approved: "Aprobado",
};

export function isDeliverableStatus(value: unknown): value is DeliverableStatus {
	return (
		typeof value === "string" &&
		(DELIVERABLE_STATUSES as readonly string[]).includes(value)
	);
}

const optionalText = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((value) => {
		const trimmed = (value ?? "").trim();
		return trimmed.length === 0 ? null : trimmed;
	})
	.optional();

const optionalDate = z
	.union([
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
		z.literal(""),
		z.null(),
		z.undefined(),
	])
	.transform((value) =>
		value === "" || value === null || value === undefined ? null : value,
	)
	.optional();

export const deliverableFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "El título es obligatorio")
		.max(200, "El título no puede superar 200 caracteres"),
	projectId: z.string().uuid("Selecciona un proyecto válido"),
	status: z.enum(DELIVERABLE_STATUSES).default("pending"),
	description: optionalText,
	dueDate: optionalDate,
});

export type DeliverableFormInput = z.input<typeof deliverableFormSchema>;
export type DeliverableFormData = z.output<typeof deliverableFormSchema>;

export function parseDeliverableForm(
	input: unknown,
): { ok: true; data: DeliverableFormData } | { ok: false } {
	const result = deliverableFormSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}
