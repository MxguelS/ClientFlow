import Link from "next/link";

import { PasswordRecoveryRequestForm } from "@/components/auth/password-recovery-request-form";
import AuthLayout from "@/components/ui/auth-layout";

export const metadata = { title: "Recuperar contraseña · ClientFlow" };

export default function ForgotPasswordPage() {
	return <AuthLayout title="Recupera tu contraseña" subtitle="Te enviaremos un enlace seguro para crear una nueva contraseña."><PasswordRecoveryRequestForm /><p className="mt-5 text-center text-sm text-secondary"><Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-white">Volver a iniciar sesión</Link></p></AuthLayout>;
}
