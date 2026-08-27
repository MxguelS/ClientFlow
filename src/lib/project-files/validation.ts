const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MiB

const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
	"text/csv",
	"text/markdown",
	"application/zip",
	"application/gzip",
	"application/x-rar-compressed",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
	return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export function validateFile(
	file: { name: string; size: number; type: string },
): string | null {
	if (file.size > MAX_FILE_SIZE) {
		const maxMb = MAX_FILE_SIZE / (1024 * 1024);
		return `El archivo supera el límite de ${maxMb} MB.`;
	}
	if (file.size <= 0) {
		return "El archivo está vacío.";
	}
	if (!file.name || file.name.trim().length === 0) {
		return "El nombre del archivo es obligatorio.";
	}
	if (!isAllowedMimeType(file.type)) {
		return "Este tipo de archivo no está permitido.";
	}
	return null;
}

export function sanitizeFileName(name: string): string {
	return name
		.normalize("NFC")
		.replace(/\.\.\//g, "")
		.replace(/\/+/g, "_")
		.replace(/[\x00-\x1f]/g, "")
		.trim();
}

export function getFileExtension(name: string): string {
	const dot = name.lastIndexOf(".");
	if (dot === -1) return "";
	return name.slice(dot);
}