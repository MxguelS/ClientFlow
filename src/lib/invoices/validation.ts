import { z } from "zod";

export const INVOICE_STATUSES = [
	"draft",
	"sent",
	"paid",
	"overdue",
	"cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: "Borrador",
	sent: "Enviada",
	paid: "Pagada",
	overdue: "Vencida",
	cancelled: "Anulada",
};

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
	return (
		typeof value === "string" &&
		(INVOICE_STATUSES as readonly string[]).includes(value)
	);
}

export const optionalText = z
	.union([z.string(), z.null(), z.undefined()])
	.transform((value) => {
		const trimmed = (value ?? "").trim();
		return trimmed.length === 0 ? null : trimmed;
	})
	.optional();

export const optionalDate = z
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

export const invoiceFormSchema = z
	.object({
		clientId: z.string().uuid("Selecciona un cliente válido"),
		invoiceNumber: z
			.string()
			.trim()
			.min(1, "El número de factura es obligatorio")
			.max(50, "El número no puede superar 50 caracteres"),
		status: z.enum(INVOICE_STATUSES).default("draft"),
		currency: z.string().length(3).default("USD"),
		issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
		dueDate: optionalDate,
		notes: optionalText,
	})
	.superRefine((data, ctx) => {
		if (
			data.dueDate &&
			data.issueDate &&
			data.dueDate < data.issueDate
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"La fecha de vencimiento debe ser posterior o igual a la fecha de emisión.",
				path: ["dueDate"],
			});
		}
	});

export type InvoiceFormInput = z.input<typeof invoiceFormSchema>;
export type InvoiceFormData = z.output<typeof invoiceFormSchema>;

export function parseInvoiceForm(
	input: unknown,
): { ok: true; data: InvoiceFormData } | { ok: false } {
	const result = invoiceFormSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}

export const invoiceItemSchema = z.object({
	description: z
		.string()
		.trim()
		.min(1, "La descripción es obligatoria")
		.max(500, "La descripción no puede superar 500 caracteres"),
	quantity: z
		.number()
		.positive("La cantidad debe ser mayor que 0")
		.max(9999999.99, "Cantidad demasiado grande"),
	unitPrice: z
		.number()
		.min(0, "El precio unitario no puede ser negativo")
		.max(9999999999.99, "Precio demasiado grande"),
});

export type InvoiceItemInput = z.input<typeof invoiceItemSchema>;
export type InvoiceItemData = z.output<typeof invoiceItemSchema>;

export function parseInvoiceItemForm(
	input: unknown,
): { ok: true; data: InvoiceItemData } | { ok: false } {
	const result = invoiceItemSchema.safeParse(input);
	return result.success ? { ok: true, data: result.data } : { ok: false };
}