/**
 * Genera un slug URL-safe a partir de un nombre.
 *
 * El schema solo exige `slug text not null unique`, así que aquí no hay
 * límites inventados que lo contradigan: se normaliza (minúsculas, sin
 * acentos, separadores "-") y se recorta a una longitud razonable.
 */
const SLUG_MAX_LENGTH = 80;
const FALLBACK_SLUG = "workspace";

export function slugify(input: string): string {
	const base = input
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX_LENGTH)
		.replace(/-+$/g, "");

	return base.length > 0 ? base : FALLBACK_SLUG;
}

/**
 * Candidatos sucesivos ante colisión del unique(workspaces.slug):
 * "estudio" -> "estudio" | "estudio-2" | "estudio-3" ...
 */
export function slugCandidate(base: string, attempt: number): string {
	if (attempt <= 0) return base;

	const suffix = `-${attempt + 1}`;
	const keptLength = Math.max(0, SLUG_MAX_LENGTH - suffix.length);

	return `${base.slice(0, keptLength).replace(/-+$/g, "")}${suffix}`;
}

export const MAX_SLUG_ATTEMPTS = 5;
