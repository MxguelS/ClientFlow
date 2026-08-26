import { createBrowserClient } from "@supabase/ssr";

import { parsePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createClient() {
	// Acceso ESTÁTICO a process.env: es lo que permite a Next.js inliner
	// los valores NEXT_PUBLIC_* en el bundle de navegador.
	const env = parsePublicEnv({
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	});

	return createBrowserClient<Database>(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);
}
