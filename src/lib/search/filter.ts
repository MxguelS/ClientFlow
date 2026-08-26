/**
 * Búsqueda client-side genérica para listas de tamaño moderado
 * (un workspace de freelance/equipo pequeño).
 *
 * Normaliza acentos y mayúsculas y exige que TODAS las palabras
 * de la consulta aparezcan en alguno de los campos evaluados.
 */
export function normalizeText(input: string): string {
	return input
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

export function filterByQuery<T>(
	rows: readonly T[],
	query: string,
	getFields: (row: T) => Array<string | null | undefined>,
): T[] {
	const normalized = normalizeText(query);
	if (normalized.length === 0) return [...rows];

	const words = normalized.split(/\s+/);

	return rows.filter((row) => {
		const haystack = normalizeText(
			getFields(row)
				.filter((field): field is string => typeof field === "string")
				.join(" "),
		);
		return words.every((word) => haystack.includes(word));
	});
}
