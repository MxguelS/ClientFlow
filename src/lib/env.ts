import { z } from "zod";

export const publicEnvSchema = z.object({
	NEXT_PUBLIC_SUPABASE_URL: z.url(),
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
	source: Record<string, string | undefined> = process.env,
): PublicEnv {
	const result = publicEnvSchema.safeParse({
		NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
			source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	});

	if (!result.success) {
		const missing = result.error.issues
			.map((issue) => issue.path.join("."))
			.join(", ");
		throw new Error(
			`Variables de entorno públicas inválidas o ausentes: ${missing}. ` +
				"Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en tu .env.local.",
		);
	}

	return result.data;
}
