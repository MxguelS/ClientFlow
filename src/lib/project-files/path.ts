import { getFileExtension, sanitizeFileName } from "@/lib/project-files/validation";

export function buildStoragePath(
	workspaceId: string,
	projectId: string,
	fileName: string,
): string {
	const safe = sanitizeFileName(fileName);
	const ext = getFileExtension(safe);
	const uuidPart = globalThis.crypto.randomUUID();
	return `${workspaceId}/${projectId}/${uuidPart}${ext}`;
}
