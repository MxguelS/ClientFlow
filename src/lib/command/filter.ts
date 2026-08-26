export interface CommandItem {
	id: string;
	label: string;
	keywords?: string[];
	group?: string;
}

/**
 * Normaliza texto para búsqueda: minúsculas y sin diacríticos.
 * "Configuración" -> "configuracion"
 */
export function normalizeQuery(input: string): string {
	return input
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

/**
 * Filtro con puntuación simple y determinista:
 * - coincidencia por prefijo en la etiqueta puntúa más alto
 * - después, coincidencia al inicio de alguna palabra
 * - después, subcadena en etiqueta o keywords
 * - todas las palabras de la consulta deben coincidir (AND)
 */
export function filterCommands<T extends CommandItem>(
	commands: readonly T[],
	query: string,
): T[] {
	const normalizedQuery = normalizeQuery(query);

	if (normalizedQuery.length === 0) {
		return [...commands];
	}

	const words = normalizedQuery.split(/\s+/);

	const scored: Array<{ item: T; score: number }> = [];

	for (const item of commands) {
		const label = normalizeQuery(item.label);
		const haystack = normalizeQuery(
			[item.label, ...(item.keywords ?? [])].join(" "),
		);

		let totalScore = 0;
		let matchesAll = true;

		for (const word of words) {
			let score = 0;

			if (label.startsWith(word)) {
				score = 100;
			} else if (label.includes(` ${word}`)) {
				score = 70;
			} else if (label.includes(word)) {
				score = 50;
			} else if (haystack.includes(word)) {
				score = 20;
			}

			if (score === 0) {
				matchesAll = false;
				break;
			}
			totalScore += score;
		}

		if (matchesAll) {
			scored.push({ item, score: totalScore });
		}
	}

	return scored
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);
}
