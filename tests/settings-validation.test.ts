import { describe, it, expect } from "vitest";

import {
	parseProfileSettings,
	parseWorkspaceSettings,
	profileSettingsSchema,
	workspaceSettingsSchema,
	PROFILE_NAME_MAX,
} from "@/lib/settings/validation";
import { WORKSPACE_NAME_MAX } from "@/lib/validation";

describe("profileSettingsSchema", () => {
	it("accepts a normal name and trims whitespace", () => {
		const result = profileSettingsSchema.safeParse({ fullName: "  Ana Pérez  " });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.fullName).toBe("Ana Pérez");
	});

	it("rejects empty or whitespace-only names", () => {
		expect(profileSettingsSchema.safeParse({ fullName: "" }).success).toBe(false);
		expect(profileSettingsSchema.safeParse({ fullName: "   " }).success).toBe(false);
	});

	it("rejects missing field", () => {
		expect(profileSettingsSchema.safeParse({}).success).toBe(false);
	});

	it(`rejects names beyond ${PROFILE_NAME_MAX} characters`, () => {
		expect(
			profileSettingsSchema.safeParse({
				fullName: "a".repeat(PROFILE_NAME_MAX + 1),
			}).success,
		).toBe(false);
		expect(
			profileSettingsSchema.safeParse({
				fullName: "a".repeat(PROFILE_NAME_MAX),
			}).success,
		).toBe(true);
	});

	it("preserves unicode and accents", () => {
		const result = profileSettingsSchema.safeParse({ fullName: "Ángel Müñoz" });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.fullName).toBe("Ángel Müñoz");
	});
});

describe("workspaceSettingsSchema", () => {
	it("accepts a valid name (matches DB CHECK 1..100)", () => {
		const result = workspaceSettingsSchema.safeParse({ name: "Estudio Central" });
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.name).toBe("Estudio Central");
	});

	it("rejects whitespace-only names before hitting the DB constraint", () => {
		expect(workspaceSettingsSchema.safeParse({ name: "  " }).success).toBe(false);
	});

	it(`rejects more than ${WORKSPACE_NAME_MAX} chars`, () => {
		expect(
			workspaceSettingsSchema.safeParse({ name: "x".repeat(WORKSPACE_NAME_MAX + 1) })
				.success,
		).toBe(false);
	});
});

describe("parse helpers degrade safely to booleans", () => {
	it("parseProfileSettings returns ok:false for non-object input", () => {
		expect(parseProfileSettings(null).ok).toBe(false);
		expect(parseProfileSettings("hack").ok).toBe(false);
		expect(parseProfileSettings(undefined).ok).toBe(false);
	});

	it("parseWorkspaceSettings returns ok:true for valid data and carries the value", () => {
		const parsed = parseWorkspaceSettings({ name: "Workspace B" });
		expect(parsed.ok).toBe(true);
		if (parsed.ok) expect(parsed.data.name).toBe("Workspace B");
	});
});