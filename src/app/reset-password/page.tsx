import Link from "next/link";
import { cookies } from "next/headers";

import { PasswordResetForm } from "@/components/auth/password-reset-form";
import AuthLayout from "@/components/ui/auth-layout";
import { hasValidRecoveryState, RECOVERY_COOKIE } from "@/lib/auth/recovery";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Nueva contraseña · ClientFlow" };

export default async function ResetPasswordPage() {
	const user = await getCurrentUser();
	const recovery = (await cookies()).get(RECOVERY_COOKIE)?.value === "1";
	const validRecovery = hasValidRecoveryState(Boolean(user), recovery ? "1" : undefined);

	return <AuthLayout title={validRecovery ? "Crea una nueva contraseña" : "Enlace no válido"} subtitle={validRecovery ? "Elige una contraseña nueva para proteger tu cuenta." : "Este enlace de recuperación ya no es válido o ha expirado."}>{validRecovery ? <PasswordResetForm /> : <div className="space-y-4"><p className="text-sm leading-6 text-secondary">Solicita un nuevo enlace para volver a intentarlo.</p><Link href="/forgot-password" className="inline-flex text-sm font-medium text-primary underline underline-offset-4 hover:text-white">Solicitar un nuevo enlace</Link></div>}</AuthLayout>;
}
