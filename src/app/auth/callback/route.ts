import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { parsePublicEnv } from "@/lib/env";
import { isValidRecoveryCallback, RECOVERY_COOKIE, RECOVERY_PATH, safeRecoveryPath } from "@/lib/auth/recovery";
import type { Database } from "@/types/database.types";

export async function GET(request: NextRequest) {
	const destination = safeRecoveryPath(request.nextUrl.searchParams.get("next"));
	const code = request.nextUrl.searchParams.get("code");
	if (!isValidRecoveryCallback({ code, error: request.nextUrl.searchParams.get("error"), flow: request.nextUrl.searchParams.get("flow"), next: destination })) return NextResponse.redirect(new URL(`${RECOVERY_PATH}?error=invalid`, request.url));
	if (!code) return NextResponse.redirect(new URL(`${RECOVERY_PATH}?error=invalid`, request.url));

	let response = NextResponse.redirect(new URL(destination, request.url));
	const env = parsePublicEnv();
	const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
				response = NextResponse.redirect(new URL(destination, request.url));
				for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
			},
		},
	});

	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) return NextResponse.redirect(new URL(`${RECOVERY_PATH}?error=invalid`, request.url));

	response.cookies.set(RECOVERY_COOKIE, "1", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: 10 * 60,
		path: RECOVERY_PATH,
	});
	return response;
}
