import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import AuthLayout from "@/components/ui/auth-layout";
import { resolveAuthRedirect } from "@/lib/auth/redirect";
import {
	getCurrentUser,
	hasAnyWorkspace,
} from "@/lib/auth/session";

export const metadata = { title: "Crear cuenta · ClientFlow" };

export default async function RegisterPage() {
	const user = await getCurrentUser();

	if (user) {
		const target = resolveAuthRedirect("/register", {
			isAuthenticated: true,
			hasWorkspace: await hasAnyWorkspace(),
		});
		if (target) redirect(target);
	}

	return (
		<AuthLayout
			title="Crea tu cuenta"
			subtitle="Empieza a gestionar tus clientes en minutos."
		>
			<RegisterForm />
		</AuthLayout>
	);
}
