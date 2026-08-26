/**
 * Traduce errores de Supabase Auth a mensajes entendibles sin filtrar
 * detalles internos. Cualquier código desconocido cae en un mensaje genérico.
 */
const AUTH_ERROR_MESSAGES = {
	invalid_credentials: "Email o contraseña incorrectos.",
	user_not_found: "Email o contraseña incorrectos.",
	email_not_confirmed:
		"Tu email aún no está confirmado. Revisa tu bandeja de entrada.",
	user_already_exists: "Ya existe una cuenta con ese email.",
	over_request_rate_limit:
		"Demasiados intentos. Espera un momento e inténtalo de nuevo.",
	network_error: "Error de red. Comprueba tu conexión e inténtalo de nuevo.",
} satisfies Record<string, string>;

export function mapAuthError(error: unknown): string {
	if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
		return AUTH_ERROR_MESSAGES.network_error;
	}

	const code =
		typeof error === "object" && error !== null && "code" in error
			? String((error as { code: unknown }).code)
			: undefined;

	const byCode =
		code && code in AUTH_ERROR_MESSAGES
			? AUTH_ERROR_MESSAGES[code as keyof typeof AUTH_ERROR_MESSAGES]
			: undefined;
	if (byCode) return byCode;

	const status =
		typeof error === "object" && error !== null && "status" in error
			? Number((error as { status: unknown }).status)
			: undefined;

	if (status === 400 || status === 422) {
		return "Datos inválidos. Revisa los campos e inténtalo de nuevo.";
	}
	if (status === 429) {
		return AUTH_ERROR_MESSAGES.over_request_rate_limit;
	}

	return "No se pudo completar la operación. Inténtalo de nuevo.";
}
