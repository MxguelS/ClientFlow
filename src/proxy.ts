import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

export async function proxy(request: NextRequest) {
	const { response, isAuthenticated } = await updateSession(request);

	/*
	 * Protección GRUESA de rutas: sin sesión no se entra a /dashboard ni
	 * /onboarding. La protección FINA (membresía, estado del onboarding)
	 * vive en los Server Components de cada ruta y, sobre todo, en RLS,
	 * que sigue siendo la barrera final de los datos.
	 */
	if (
		!isAuthenticated &&
		PROTECTED_PREFIXES.some((p) =>
			request.nextUrl.pathname.startsWith(p),
		)
	) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Ejecuta en todas las rutas excepto:
		 * - _next/static, _next/image (assets internos)
		 * - favicon.ico y archivos estáticos
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
