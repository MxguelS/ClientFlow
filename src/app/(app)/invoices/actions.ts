"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, getPrimaryWorkspace } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
	parseInvoiceForm,
	parseInvoiceItemForm,
} from "@/lib/invoices/validation";

export type InvoiceActionResult =
	| { status: "success"; id: string }
	| { status: "not_authenticated" }
	| { status: "no_workspace" }
	| { status: "invalid"; message: string }
	| { status: "client_not_found" }
	| { status: "not_found" }
	| { status: "invoice_not_found" }
	| { status: "item_not_found" }
	| { status: "error"; message: string };

const GENERIC_ERROR =
	"No se pudo completar la operación. Inténtalo de nuevo.";

function isUuid(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		value,
	);
}

async function resolveWorkspace(): Promise<{
	ok: true; id: string
} | { ok: false; status: InvoiceActionResult }> {
	if (!(await getCurrentUser())) return { ok: false, status: { status: "not_authenticated" } };
	const workspace = await getPrimaryWorkspace();
	if (!workspace) return { ok: false, status: { status: "no_workspace" } };
	return { ok: true, id: workspace.id };
}

export async function createInvoiceAction(
	values: unknown,
): Promise<InvoiceActionResult> {
	const parsed = parseInvoiceForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos de factura inválidos." };
	}

	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: client, error: clientError } = await supabase
		.from("clients")
		.select("id, workspace_id")
		.eq("id", parsed.data.clientId)
		.maybeSingle();

	if (clientError) {
		console.error("invoice client lookup failed:", clientError.code, clientError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!client || client.workspace_id !== ws.id) {
		return { status: "client_not_found" };
	}

	const { data, error } = await supabase
		.from("invoices")
		.insert({
			workspace_id: ws.id,
			client_id: client.id,
			invoice_number: parsed.data.invoiceNumber,
			status: parsed.data.status,
			currency: parsed.data.currency,
			issue_date: parsed.data.issueDate,
			due_date: parsed.data.dueDate,
			notes: parsed.data.notes,
		})
		.select("id")
		.single();

	if (error) {
		if (error.code === "23505") {
			return {
				status: "invalid",
				message: "Ya existe una factura con este número en tu workspace.",
			};
		}
		if (
			error.code === "23514" &&
			error.message?.includes("invoice_dates_valid")
		) {
			return {
				status: "invalid",
				message:
					"La fecha de vencimiento debe ser posterior o igual a la fecha de emisión.",
			};
		}
		console.error("invoice insert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/invoices");
	revalidatePath(`/clients/${client.id}`);
	return { status: "success", id: data.id };
}

export async function updateInvoiceAction(
	id: string,
	values: unknown,
): Promise<InvoiceActionResult> {
	if (!isUuid(id)) return { status: "not_found" };

	const parsed = parseInvoiceForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos de factura inválidos." };
	}

	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: existing, error: existingError } = await supabase
		.from("invoices")
		.select("id, workspace_id, client_id")
		.eq("id", id)
		.maybeSingle();

	if (existingError) {
		console.error("invoice lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing || existing.workspace_id !== ws.id) {
		return { status: "not_found" };
	}

	const { data: client, error: clientError } = await supabase
		.from("clients")
		.select("id, workspace_id")
		.eq("id", parsed.data.clientId)
		.maybeSingle();

	if (clientError) {
		console.error("invoice client lookup failed:", clientError.code, clientError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!client || client.workspace_id !== ws.id) {
		return { status: "client_not_found" };
	}

	const { data: updated, error } = await supabase
		.from("invoices")
		.update({
			client_id: client.id,
			invoice_number: parsed.data.invoiceNumber,
			status: parsed.data.status,
			currency: parsed.data.currency,
			issue_date: parsed.data.issueDate,
			due_date: parsed.data.dueDate,
			notes: parsed.data.notes,
		})
		.eq("id", id)
		.select("id")
		.maybeSingle();

	if (error) {
		if (error.code === "23505") {
			return {
				status: "invalid",
				message: "Ya existe otra factura con este número en tu workspace.",
			};
		}
		if (
			error.code === "23514" &&
			error.message?.includes("invoice_dates_valid")
		) {
			return {
				status: "invalid",
				message:
					"La fecha de vencimiento debe ser posterior o igual a la fecha de emisión.",
			};
		}
		console.error("invoice update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!updated) return { status: "not_found" };

	revalidatePath("/invoices");
	revalidatePath(`/invoices/${id}`);
	revalidatePath(`/clients/${existing.client_id}`);
	revalidatePath(`/clients/${client.id}`);
	return { status: "success", id };
}

export async function deleteInvoiceAction(
	id: string,
): Promise<InvoiceActionResult> {
	if (!isUuid(id)) return { status: "not_found" };
	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: existing, error: existingError } = await supabase
		.from("invoices")
		.select("id, workspace_id, client_id")
		.eq("id", id)
		.maybeSingle();

	if (existingError) {
		console.error("invoice lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing || existing.workspace_id !== ws.id) {
		return { status: "not_found" };
	}

	const { data: deleted, error } = await supabase
		.from("invoices")
		.delete()
		.eq("id", id)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("invoice delete failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!deleted) return { status: "not_found" };

	revalidatePath("/invoices");
	revalidatePath(`/clients/${existing.client_id}`);
	return { status: "success", id };
}

export async function createInvoiceItemAction(
	invoiceId: string,
	values: unknown,
): Promise<InvoiceActionResult> {
	if (!isUuid(invoiceId)) return { status: "not_found" };

	const parsed = parseInvoiceItemForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del artículo inválidos." };
	}

	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: invoice, error: invoiceError } = await supabase
		.from("invoices")
		.select("id, workspace_id, client_id")
		.eq("id", invoiceId)
		.maybeSingle();

	if (invoiceError) {
		console.error("invoice lookup failed:", invoiceError.code, invoiceError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!invoice || invoice.workspace_id !== ws.id) {
		return { status: "invoice_not_found" };
	}

	const { data, error } = await supabase
		.from("invoice_items")
		.insert({
			invoice_id: invoice.id,
			description: parsed.data.description,
			quantity: parsed.data.quantity,
			unit_price: parsed.data.unitPrice,
		})
		.select("id")
		.single();

	if (error) {
		console.error("invoice item insert failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}

	revalidatePath("/invoices");
	revalidatePath(`/invoices/${invoiceId}`);
	revalidatePath(`/clients/${invoice.client_id}`);
	return { status: "success", id: data.id };
}

export async function updateInvoiceItemAction(
	itemId: string,
	invoiceId: string,
	values: unknown,
): Promise<InvoiceActionResult> {
	if (!isUuid(itemId) || !isUuid(invoiceId))
		return { status: "not_found" };

	const parsed = parseInvoiceItemForm(values);
	if (!parsed.ok) {
		return { status: "invalid", message: "Datos del artículo inválidos." };
	}

	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: invoice, error: invoiceError } = await supabase
		.from("invoices")
		.select("id, workspace_id")
		.eq("id", invoiceId)
		.maybeSingle();

	if (invoiceError) {
		console.error("invoice lookup failed:", invoiceError.code, invoiceError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!invoice || invoice.workspace_id !== ws.id) {
		return { status: "invoice_not_found" };
	}

	const { data: existing, error: existingError } = await supabase
		.from("invoice_items")
		.select("id")
		.eq("id", itemId)
		.eq("invoice_id", invoiceId)
		.maybeSingle();

	if (existingError) {
		console.error("invoice item lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing) return { status: "item_not_found" };

	const { data: updated, error } = await supabase
		.from("invoice_items")
		.update({
			description: parsed.data.description,
			quantity: parsed.data.quantity,
			unit_price: parsed.data.unitPrice,
		})
		.eq("id", itemId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("invoice item update failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!updated) return { status: "item_not_found" };

	revalidatePath(`/invoices/${invoiceId}`);
	return { status: "success", id: itemId };
}

export async function deleteInvoiceItemAction(
	itemId: string,
	invoiceId: string,
): Promise<InvoiceActionResult> {
	if (!isUuid(itemId) || !isUuid(invoiceId))
		return { status: "not_found" };

	const ws = await resolveWorkspace();
	if (!ws.ok) return ws.status;

	const supabase = await createClient();
	const { data: invoice, error: invoiceError } = await supabase
		.from("invoices")
		.select("id, workspace_id")
		.eq("id", invoiceId)
		.maybeSingle();

	if (invoiceError) {
		console.error("invoice lookup failed:", invoiceError.code, invoiceError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!invoice || invoice.workspace_id !== ws.id) {
		return { status: "invoice_not_found" };
	}

	const { data: existing, error: existingError } = await supabase
		.from("invoice_items")
		.select("id")
		.eq("id", itemId)
		.eq("invoice_id", invoiceId)
		.maybeSingle();

	if (existingError) {
		console.error("invoice item lookup failed:", existingError.code, existingError.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!existing) return { status: "item_not_found" };

	const { data: deleted, error } = await supabase
		.from("invoice_items")
		.delete()
		.eq("id", itemId)
		.select("id")
		.maybeSingle();

	if (error) {
		console.error("invoice item delete failed:", error.code, error.message);
		return { status: "error", message: GENERIC_ERROR };
	}
	if (!deleted) return { status: "item_not_found" };

	revalidatePath(`/invoices/${invoiceId}`);
	return { status: "success", id: itemId };
}
