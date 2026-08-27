import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
	canInvite,
	canManageMembers,
	canChangeRoles,
	normalizeEmail,
	parseInviteMemberForm,
	parseUpdateMemberRoleForm,
	generateInviteToken,
	hashInviteToken,
	isInvitableRole,
	isWorkspaceRole,
} from "@/lib/settings/team";

describe("normalizeEmail (paridad con el trigger SQL)", () => {
	it("trims and lowercases exactly like lower(btrim())", () => {
		expect(normalizeEmail("  Antonio@ClientFlow.TEST ")).toBe(
			"antonio@clientflow.test",
		);
	});

	it("keeps accented local parts untouched besides case", () => {
		expect(normalizeEmail("Ñoño.Correo@x.COM")).toBe("ñoño.correo@x.com");
	});
});

describe("role matrices", () => {
	it("owner can invite both roles; admin only member", () => {
		expect(canInvite("owner", "admin")).toBe(true);
		expect(canInvite("owner", "member")).toBe(true);
		expect(canInvite("admin", "admin")).toBe(false);
		expect(canInvite("admin", "member")).toBe(true);
		expect(canInvite("member", "member")).toBe(false);
	});

	it("only owner/admin manage members and only owner changes roles", () => {
		expect(canManageMembers("owner")).toBe(true);
		expect(canManageMembers("admin")).toBe(true);
		expect(canManageMembers("member")).toBe(false);
		expect(canChangeRoles("owner")).toBe(true);
		expect(canChangeRoles("admin")).toBe(false);
	});

	it("guards reject invalid role strings", () => {
		expect(isWorkspaceRole("superuser")).toBe(false);
		expect(isInvitableRole("owner")).toBe(false); // nunca invitable
		expect(isInvitableRole("member")).toBe(true);
	});
});

describe("parseInviteMemberForm", () => {
	it("normalizes email and accepts member for admin callers via schema", () => {
		const parsed = parseInviteMemberForm({
			email: "  Maria@X.com ",
			role: "member",
		});
		expect(parsed.ok).toBe(true);
		if (parsed.ok) {
			expect(parsed.data.email).toBe("maria@x.com");
			expect(parsed.data.role).toBe("member");
		}
	});

	it("rejects malformed emails and non-invitable roles", () => {
		expect(parseInviteMemberForm({ email: "no-arroba", role: "member" }).ok).toBe(false);
		expect(parseInviteMemberForm({ email: "a@b.co", role: "owner" }).ok).toBe(false);
	});
});

describe("parseUpdateMemberRoleSchema blocks owner escalation payload", () => {
	it("rejects target role owner outright", () => {
		expect(
			parseUpdateMemberRoleForm({
				userId: "550e8400-e29b-41d4-a716-446655440000",
				role: "owner",
			}).ok,
		).toBe(false);
	});

	it("accepts admin/member targets with valid uuid", () => {
		const parsed = parseUpdateMemberRoleForm({
			userId: "550e8400-e29b-41d4-a716-446655440000",
			role: "admin",
		});
		expect(parsed.ok).toBe(true);
	});
});

describe("invitation tokens", () => {
	it("is URL-safe, unpadded and exactly the expected length class", () => {
		const token = generateInviteToken();
		expect(token).toMatch(/^[A-Za-z0-9_-]{42,44}$/); // 32 bytes → ~43 chars
		expect(token.includes("+") || token.includes("/") || token.includes("=")).toBe(false);
	});

	it("accepts injected entropy deterministically", () => {
		const bytes = new Uint8Array(32).fill(7);
		expect(generateInviteToken(bytes)).toBe(generateInviteToken(bytes));
		expect(generateInviteToken()).not.toBe(generateInviteToken());
	});

	it("throws when entropy length is wrong", () => {
		expect(() =>
			generateInviteToken(new Uint8Array(8)),
		).toThrow(/entropy/);
	});

	it("hash matches the SHA-256 hex contract used by the SQL RPC", async () => {
		const hash = await hashInviteToken("tok-abc-123");
		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
		// Vector conocido: sha256("abc") desplazado por el token completo.
		expect(await hashInviteToken("")).toBe(
			"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		);
	});
});

describe("membership insert hardening migration", () => {
	const migration = readFileSync(
		resolve(
			process.cwd(),
			"supabase/migrations/20260827100000_workspace_members_insert_hardening.sql",
		),
		"utf8",
	);

	it("keeps only the empty-workspace owner bootstrap policy", () => {
		expect(migration).toContain('drop policy if exists "workspace_members_insert"');
		expect(migration).toContain('create policy "workspace_members_bootstrap_owner_only"');
		expect(migration).toContain("role = 'owner'");
		expect(migration).toContain("not exists");
		expect(migration).toContain(
			"revoke all on function public.caller_workspace_role(uuid)",
		);
		expect(migration).toContain(
			"revoke all on function public.can_manage_workspace(uuid)",
		);
	});
});
