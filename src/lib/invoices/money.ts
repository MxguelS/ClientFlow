/**
 * Money formatting and calculation helpers para ClientFlow.
 *
 * ESTRATEGIA MONETARIA
 * ───────────────────
 * PostgreSQL almacena quantity como numeric(10,2) y unit_price como
 * numeric(12,2). Ambos con precisión fija de 2 decimales exactos.
 *
 * Supabase JS convierte numeric → Number (IEEE‑754 double). Dado que
 * los operandos tienen ≤2 decimales, el producto quantity × unit_price
 * tiene ≤4 decimales. `Math.round(product * 100) / 100` redondea a 2
 * decimales sin errores de precisión en este dominio acotado, porque
 * JavaScript puede representar exactamente todos los valores con ≤2
 * decimales hasta 2⁵³.
 *
 * AUTORIDAD SOBRE TOTALES
 * ───────────────────────
 * El servidor es la autoridad. Ningún total proveniente del frontend
 * se persiste — el server action calcula totals desde la DB si fuera
 * necesario. El frontend solo muestra previews para UX. Las columnas
 * subtotal/total no existen en el schema; se derivan del SUM de items.
 */

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
	const cached = currencyFormatterCache.get(currency);
	if (cached) return cached;
	const formatter = new Intl.NumberFormat("es-ES", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	currencyFormatterCache.set(currency, formatter);
	return formatter;
}

export function formatCurrency(amount: number, currency = "USD"): string {
	return getCurrencyFormatter(currency).format(amount);
}

/** quantity × unit_price redondeado a 2 decimales (ver estrategia arriba). */
export function calculateLineTotal(
	quantity: number,
	unitPrice: number,
): number {
	return Math.round(quantity * unitPrice * 100) / 100;
}

/** Suma de calculateLineTotal para todos los items. */
export function calculateInvoiceTotal(
	items: Array<{ quantity: number; unit_price: number }>,
): number {
	return items.reduce(
		(sum, item) => sum + calculateLineTotal(item.quantity, item.unit_price),
		0,
	);
}