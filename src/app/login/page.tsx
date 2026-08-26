import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import AuthLayout from "@/components/ui/auth-layout";
import { resolveAuthRedirect } from "@/lib/auth/redirect";
import {
	getCurrentUser,
	hasAnyWorkspace,
} from "@/lib/auth/session";

export const metadata = { title: "Iniciar sesión · ClientFlow" };

export default async function LoginPage() {
	const user = await getCurrentUser();

	if (user) {
		const target = resolveAuthRedirect("/login", {
			isAuthenticated: true,
			hasWorkspace: await hasAnyWorkspace(),
		});
		if (target) redirect(target);
	}

	return (
		<AuthLayout
			title="Inicia sesión"
			subtitle="Accede a tu área de ClientFlow."
		>
			<LoginForm />
		</AuthLayout>
	);
}
