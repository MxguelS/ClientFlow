/**
 * Utilidades de fechas ISO para comparaciones calendario puras.
 *
 * NUNCA se parsea un valor DATE-only ("YYYY-MM-DD") con el constructor
 * Date: eso introduciría el bug de desfase por timezone corregido en
 * Ticket #4. Aquí todo es aritmética sobre Date.UTC y de vuelta a ISO,
 * determinista e independiente de la zona horaria del servidor.
 */

export function todayISO(reference: Date = new Date()): string {
	return reference.toISOString().slice(0, 10);
}

export function addDaysISO(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split("-").map(Number);

	if (!year || !month || !day) return isoDate;

	const next = new Date(Date.UTC(year, month - 1, day + days));

	return next.toISOString().slice(0, 10);
}

/** Días desde `fromISO` hasta `toISO`. Negativo si `toISO` ya pasó. */
export function diffDaysISO(fromISO: string, toISORaw: string): number {
	const [fy, fm, fd] = fromISO.split("-").map(Number);
	const [ty, tm, td] = toISORaw.split("-").map(Number);

	if (!fy || !fm || !fd || !ty || !tm || !td) return 0;

	const ms =
		Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd);

	return Math.round(ms / 86_400_000);
}

export function isValidISODate(value: unknown): value is string {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}