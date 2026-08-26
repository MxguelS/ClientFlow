import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { parsePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export async function updateSession(
	request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean }> {
	let response = NextResponse.next({ request });

	const env = parsePublicEnv();

	const supabase = createServerClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					response = NextResponse.next({ request });
					for (const { name, value, options } of cookiesToSet) {
						response.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	// Refresca el token si es necesario. No colocar código entre
	// createServerClient() y getUser(): de lo contrario la sesión podría
	// quedar inconsistente entre navegador y servidor.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return { response, isAuthenticated: user !== null };
}
