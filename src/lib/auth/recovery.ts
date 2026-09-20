export const RECOVERY_COOKIE = "clientflow-recovery";
export const RECOVERY_PATH = "/reset-password";
export const RECOVERY_CONFIRMATION_MESSAGE = "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.";
export const RECOVERY_FLOW = "recovery";

const LOCAL_ORIGINS = new Set([
	"http://localhost:3000",
	"http://127.0.0.1:3000",
]);

function appOrigin(): string {
	const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
	return configured ? configured.replace(/\/+$/, "") : "http://localhost:3000";
}

export function recoveryRedirectUrl(origin: string): string {
	const configuredOrigin = appOrigin();
	const safeOrigin =
		origin === configuredOrigin || LOCAL_ORIGINS.has(origin)
			? origin
			: configuredOrigin;

	return `${safeOrigin}/auth/callback?flow=${RECOVERY_FLOW}&next=${encodeURIComponent(RECOVERY_PATH)}`;
}

export function safeRecoveryPath(value: string | null): string {
	return value === RECOVERY_PATH ? RECOVERY_PATH : "/login";
}

export function hasValidRecoveryState(userPresent: boolean, cookieValue: string | undefined): boolean {
	return userPresent && cookieValue === "1";
}

export function isValidRecoveryCallback(input: { code: string | null; error: string | null; flow: string | null; next: string }): boolean {
	return Boolean(input.code) && !input.error && input.flow === RECOVERY_FLOW && input.next === RECOVERY_PATH;
}
