import { NextResponse } from "next/server";

import { RECOVERY_COOKIE, RECOVERY_PATH } from "@/lib/auth/recovery";

export async function POST() {
	const response = NextResponse.json({ ok: true });
	response.cookies.set(RECOVERY_COOKIE, "", { httpOnly: true, maxAge: 0, path: RECOVERY_PATH });
	return response;
}
