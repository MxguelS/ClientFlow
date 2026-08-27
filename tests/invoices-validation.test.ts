import { describe, it, expect } from "vitest";
import {
	invoiceFormSchema,
	invoiceItemSchema,
	INVOICE_STATUSES,
	INVOICE_STATUS_LABELS,
	isInvoiceStatus,
	parseInvoiceForm,
	parseInvoiceItemForm,
} from "@/lib/invoices/validation";
import {
	formatCurrency,
	calculateLineTotal,
	calculateInvoiceTotal,
} from "@/lib/invoices/money";

describe("INVOICE_STATUSES", () => {
	it("has all expected statuses", () => {
		expect(INVOICE_STATUSES).toEqual([
			"draft",
			"sent",
			"paid",
			"overdue",
			"cancelled",
		]);
	});

	it("has labels for every status", () => {
		for (const status of INVOICE_STATUSES) {
			expect(INVOICE_STATUS_LABELS[status]).toBeTruthy();
		}
	});

	it("isInvoiceStatus validates correctly", () => {
		expect(isInvoiceStatus("draft")).toBe(true);
		expect(isInvoiceStatus("paid")).toBe(true);
		expect(isInvoiceStatus("unknown")).toBe(false);
		expect(isInvoiceStatus(null)).toBe(false);
		expect(isInvoiceStatus(undefined)).toBe(false);
	});
});

describe("invoiceFormSchema", () => {
	it("accepts valid minimal input", () => {
		const result = invoiceFormSchema.safeParse({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "F-001",
			issueDate: "2026-08-26",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("draft");
			expect(result.data.currency).toBe("USD");
			// optional fields absent from input remain undefined
			expect(result.data.dueDate).toBeUndefined();
			expect(result.data.notes).toBeUndefined();
		}
	});

	it("rejects missing clientId", () => {
		const result = invoiceFormSchema.safeParse({
			invoiceNumber: "F-001",
			issueDate: "2026-08-26",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty invoice number", () => {
		const result = invoiceFormSchema.safeParse({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "   ",
			issueDate: "2026-08-26",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid full input", () => {
		const result = invoiceFormSchema.safeParse({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "F-001",
			status: "sent",
			currency: "EUR",
			issueDate: "2026-08-26",
			dueDate: "2026-09-26",
			notes: "Pago a 30 días",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("sent");
			expect(result.data.currency).toBe("EUR");
			expect(result.data.dueDate).toBe("2026-09-26");
			expect(result.data.notes).toBe("Pago a 30 días");
		}
	});

	it("normalizes empty string to null for optional fields", () => {
		const result = invoiceFormSchema.safeParse({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "F-001",
			issueDate: "2026-08-26",
			dueDate: "",
			notes: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.dueDate).toBeNull();
			expect(result.data.notes).toBeNull();
		}
	});

	it("rejects due_date before issue_date", () => {
		const result = invoiceFormSchema.safeParse({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "F-001",
			issueDate: "2026-08-26",
			dueDate: "2026-08-25",
		});
		expect(result.success).toBe(false);
	});
});

describe("invoiceItemSchema", () => {
	it("accepts valid item", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Consultoría",
			quantity: 1,
			unitPrice: 100,
		});
		expect(result.success).toBe(true);
	});

	it("accepts fractional quantities", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Horas de trabajo",
			quantity: 37.5,
			unitPrice: 50,
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty description", () => {
		const result = invoiceItemSchema.safeParse({
			description: "   ",
			quantity: 1,
			unitPrice: 100,
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero quantity", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Item",
			quantity: 0,
			unitPrice: 100,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative quantity", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Item",
			quantity: -1,
			unitPrice: 100,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative unit price", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Item",
			quantity: 1,
			unitPrice: -0.01,
		});
		expect(result.success).toBe(false);
	});

	it("accepts zero unit price", () => {
		const result = invoiceItemSchema.safeParse({
			description: "Item gratuito",
			quantity: 1,
			unitPrice: 0,
		});
		expect(result.success).toBe(true);
	});
});

describe("parseInvoiceForm", () => {
	it("returns ok=true for valid data", () => {
		const result = parseInvoiceForm({
			clientId: "550e8400-e29b-41d4-a716-446655440000",
			invoiceNumber: "F-001",
			issueDate: "2026-08-26",
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.invoiceNumber).toBe("F-001");
		}
	});

	it("returns ok=false for invalid data", () => {
		const result = parseInvoiceForm({ clientId: "bad" });
		expect(result.ok).toBe(false);
	});
});

describe("parseInvoiceItemForm", () => {
	it("returns ok=true for valid data", () => {
		const result = parseInvoiceItemForm({
			description: "Servicio",
			quantity: 2,
			unitPrice: 150,
		});
		expect(result.ok).toBe(true);
	});

	it("returns ok=false for invalid data", () => {
		const result = parseInvoiceItemForm({
			description: "",
			quantity: 0,
			unitPrice: -5,
		});
		expect(result.ok).toBe(false);
	});
});

describe("formatCurrency", () => {
	it("formats USD correctly", () => {
		const result = formatCurrency(1234.56, "USD");
		expect(result).toContain("1234");
		expect(result).toContain("56");
	});

	it("formats EUR correctly", () => {
		const result = formatCurrency(99.99, "EUR");
		expect(result).toContain("99");
		expect(result).toContain("99");
	});
});

describe("calculateLineTotal", () => {
	it("calculates integer multiplication correctly", () => {
		expect(calculateLineTotal(3, 100)).toBe(300);
	});

	it("handles fractional prices", () => {
		expect(calculateLineTotal(3, 19.99)).toBe(59.97);
	});

	it("handles fractional quantities", () => {
		expect(calculateLineTotal(37.5, 50)).toBe(1875);
	});

	it("handles zero unit price", () => {
		expect(calculateLineTotal(10, 0)).toBe(0);
	});

	it("handles precision correctly: 0.10 * 3", () => {
		expect(calculateLineTotal(3, 0.10)).toBe(0.30);
	});

	it("handles precision correctly: 100.50 * 2", () => {
		expect(calculateLineTotal(2, 100.50)).toBe(201);
	});

	it("handles precision correctly: 9999.99 * 1", () => {
		expect(calculateLineTotal(1, 9999.99)).toBe(9999.99);
	});
});

describe("calculateInvoiceTotal", () => {
	it("sums multiple items correctly", () => {
		const total = calculateInvoiceTotal([
			{ quantity: 2, unit_price: 100 },
			{ quantity: 1, unit_price: 50 },
		]);
		expect(total).toBe(250);
	});

	it("handles empty items array", () => {
		expect(calculateInvoiceTotal([])).toBe(0);
	});

	it("handles precision across items", () => {
		const total = calculateInvoiceTotal([
			{ quantity: 3, unit_price: 19.99 },
			{ quantity: 2, unit_price: 49.95 },
		]);
		expect(total).toBe(159.87);
	});

	it("handles large values", () => {
		const total = calculateInvoiceTotal([
			{ quantity: 1000, unit_price: 9999.99 },
		]);
		expect(total).toBe(9999990);
	});
});