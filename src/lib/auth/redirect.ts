const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"] as const;
const AUTH_PAGE_PATHS = ["/login", "/register"] as const;

export interface AuthState {
	isAuthenticated: boolean;
	hasWorkspace: boolean;
}

/**
 * Lógica pura de redirección. La usan los Server Components de cada ruta,
 * nunca sustituye a RLS: solo decide navegación, no autorización de datos.
 *
 * Devuelve la ruta destino o null si el usuario puede permanecer donde está.
 */
export function resolveAuthRedirect(
	pathname: string,
	state: AuthState,
): string | null {
	const { isAuthenticated, hasWorkspace } = state;

	const isProtected = PROTECTED_PREFIXES.some((p) =>
		pathname.startsWith(p),
	);
	const isAuthPage = AUTH_PAGE_PATHS.some((p) => pathname.startsWith(p));

	if (!isAuthenticated) {
		return isProtected ? "/login" : null;
	}

	if (isProtected) {
		if (pathname.startsWith("/dashboard") && !hasWorkspace) {
			return "/onboarding";
		}
		if (pathname.startsWith("/onboarding") && hasWorkspace) {
			return "/dashboard";
		}
		return null;
	}

	if (isAuthPage) {
		return hasWorkspace ? "/dashboard" : "/onboarding";
	}

	return null;
}
