import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	hasValidRecoveryState,
	isValidRecoveryCallback,
	RECOVERY_CONFIRMATION_MESSAGE,
	RECOVERY_PATH,
	recoveryRedirectUrl,
	safeRecoveryPath,
} from "@/lib/auth/recovery";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

describe("auth recovery", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
	});

	afterEach(() => {
		if (ORIGINAL_APP_URL === undefined) {
			delete process.env.NEXT_PUBLIC_APP_URL;
		} else {
			process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
		}
	});

	it("uses the configured application origin and local development origins", () => {
		expect(recoveryRedirectUrl("http://localhost:3000")).toBe(
			"http://localhost:3000/auth/callback?flow=recovery&next=%2Freset-password",
		);
		expect(recoveryRedirectUrl("http://127.0.0.1:3000")).toContain(
			"http://127.0.0.1:3000/auth/callback",
		);
		expect(recoveryRedirectUrl("https://app.example.com")).toContain(
			"https://app.example.com/auth/callback",
		);
		expect(recoveryRedirectUrl("https://untrusted.example")).toContain(
			"https://app.example.com/auth/callback",
		);
	});

	it("allows only the reset-password destination", () => {
		expect(safeRecoveryPath(RECOVERY_PATH)).toBe(RECOVERY_PATH);
		expect(safeRecoveryPath("https://evil.example")).toBe("/login");
		expect(safeRecoveryPath(null)).toBe("/login");
	});

	it("requires both an authenticated user and recovery marker", () => {
		expect(hasValidRecoveryState(true, "1")).toBe(true);
		expect(hasValidRecoveryState(false, "1")).toBe(false);
		expect(hasValidRecoveryState(true, undefined)).toBe(false);
	});

	it("only marks a callback carrying the recovery flow", () => {
		expect(isValidRecoveryCallback({ code: "code", error: null, flow: "recovery", next: RECOVERY_PATH })).toBe(true);
		expect(isValidRecoveryCallback({ code: "code", error: null, flow: null, next: RECOVERY_PATH })).toBe(false);
		expect(isValidRecoveryCallback({ code: "code", error: "access_denied", flow: "recovery", next: RECOVERY_PATH })).toBe(false);
	});

	it("uses a generic confirmation without user enumeration", () => {
		expect(RECOVERY_CONFIRMATION_MESSAGE).not.toMatch(/no existe|no encontrado|registrad/i);
	});
});
