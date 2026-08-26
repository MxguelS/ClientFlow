import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { parsePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export async function createClient() {
	const cookieStore = await cookies();
	const env = parsePublicEnv();

	return createServerClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						for (const { name, value, options } of cookiesToSet) {
							cookieStore.set(name, value, options);
						}
					} catch {
						// Llamado desde un Server Component: no se pueden escribir
						// cookies. El refresco real ocurre en src/proxy.ts.
					}
				},
			},
		},
	);
}
