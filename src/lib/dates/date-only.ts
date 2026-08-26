/**
 * Formateo de valores DATE-only de PostgreSQL ("YYYY-MM-DD").
 *
 * `new Date("2026-09-01")` se interpreta como medianoche UTC y, al
 * formatear en la timezone local (UTC negativo), la fecha retrocede un día.
 * Aquí se fija tanto el instante como el formatter a UTC para que la fecha
 * mostrada sea exactamente la almacenada, independiente de la máquina.
 */

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
	timeZone: "UTC",
});

export function formatDateOnly(value: string): string {
	const [year, month, day] = value.split("-").map(Number);

	if (!year || !month || !day) return value;

	return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}
