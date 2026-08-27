import { describe, it, expect, vi } from "vitest";
import {
	validateFile,
	sanitizeFileName,
	isAllowedMimeType,
} from "@/lib/project-files/validation";
import { buildStoragePath } from "@/lib/project-files/path";

describe("isAllowedMimeType", () => {
	it("accepts PDF", () => {
		expect(isAllowedMimeType("application/pdf")).toBe(true);
	});

	it("accepts PNG", () => {
		expect(isAllowedMimeType("image/png")).toBe(true);
	});

	it("rejects executables", () => {
		expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
		expect(isAllowedMimeType("application/x-sh")).toBe(false);
	});

	it("rejects unknown types", () => {
		expect(isAllowedMimeType("image/tiff")).toBe(false);
		expect(isAllowedMimeType("video/mp4")).toBe(false);
	});
});

describe("validateFile", () => {
	it("accepts valid file", () => {
		expect(
			validateFile({
				name: "reporte.pdf",
				size: 1024,
				type: "application/pdf",
			}),
		).toBeNull();
	});

	it("rejects oversized file", () => {
		const result = validateFile({
			name: "big.pdf",
			size: 60 * 1024 * 1024, // 60 MB
			type: "application/pdf",
		});
		expect(result).toContain("50 MB");
	});

	it("rejects empty file", () => {
		const result = validateFile({
			name: "empty.pdf",
			size: 0,
			type: "application/pdf",
		});
		expect(result).toBe("El archivo está vacío.");
	});

	it("rejects empty filename", () => {
		const result = validateFile({
			name: "   ",
			size: 100,
			type: "application/pdf",
		});
		expect(result).toBe("El nombre del archivo es obligatorio.");
	});

	it("rejects disallowed mime type", () => {
		const result = validateFile({
			name: "script.exe",
			size: 100,
			type: "application/x-msdownload",
		});
		expect(result).toBe("Este tipo de archivo no está permitido.");
	});

	it("rejects oversized file exactly at boundary", () => {
		const result = validateFile({
			name: "ok.pdf",
			size: 50 * 1024 * 1024 + 1,
			type: "application/pdf",
		});
		expect(result).not.toBeNull();
	});

	it("accepts file exactly at 50 MB", () => {
		expect(
			validateFile({
				name: "exact.pdf",
				size: 50 * 1024 * 1024,
				type: "application/pdf",
			}),
		).toBeNull();
	});
});

describe("sanitizeFileName", () => {
	it("preserves normal filenames", () => {
		expect(sanitizeFileName("reporte.pdf")).toBe("reporte.pdf");
	});

	it("removes path traversal", () => {
		expect(sanitizeFileName("../../evil.pdf")).toBe("evil.pdf");
	});

	it("replaces forward slashes with underscore", () => {
		expect(sanitizeFileName("folder/file.pdf")).toBe("folder_file.pdf");
	});

	it("removes control characters", () => {
		expect(sanitizeFileName("file\x00\x01name.pdf")).toBe("filename.pdf");
	});

	it("preserves unicode characters", () => {
		expect(sanitizeFileName("áéíóú documento.pdf")).toBe(
			"áéíóú documento.pdf",
		);
	});

	it("handles multiple slashes", () => {
		expect(sanitizeFileName("a/b/c/file.pdf")).toBe("a_b_c_file.pdf");
	});
});

describe("buildStoragePath", () => {
	const wsId = "00000000-0000-0000-0000-000000000001";
	const projId = "00000000-0000-0000-0000-000000000002";

	it("builds path with workspace and project", () => {
		const path = buildStoragePath(wsId, projId, "test.pdf");
		expect(path).toContain(wsId);
		expect(path).toContain(projId);
		expect(path).toMatch(/\.pdf$/);
	});

	it("uses UUID-like random part", () => {
		const path = buildStoragePath(wsId, projId, "test.pdf");
		const parts = path.split("/");
		expect(parts).toHaveLength(3);
		expect(parts[2]!.length).toBeGreaterThan(36);
	});

	it("produces different paths for same inputs", () => {
		const a = buildStoragePath(wsId, projId, "test.pdf");
		const b = buildStoragePath(wsId, projId, "test.pdf");
		expect(a).not.toBe(b);
	});

	it("uses the Web Crypto UUID source available in client code", () => {
		const original = globalThis.crypto.randomUUID;
		const randomUUID = vi.fn(() => "11111111-1111-4111-8111-111111111111");
		Object.defineProperty(globalThis.crypto, "randomUUID", {
			configurable: true,
			value: randomUUID,
		});

		try {
			expect(buildStoragePath(wsId, projId, "test.pdf")).toContain(
				"11111111-1111-4111-8111-111111111111",
			);
			expect(randomUUID).toHaveBeenCalledOnce();
		} finally {
			Object.defineProperty(globalThis.crypto, "randomUUID", {
				configurable: true,
				value: original,
			});
		}
	});
});
