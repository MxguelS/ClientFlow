import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/auth/onboarding-form";
import AuthLayout from "@/components/ui/auth-layout";
import {
	getCurrentUser,
	hasAnyWorkspace,
} from "@/lib/auth/session";
import { resolveAuthRedirect } from "@/lib/auth/redirect";

export const metadata = { title: "Configura tu workspace · ClientFlow" };

export default async function OnboardingPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/login");

	const hasWorkspace = await hasAnyWorkspace();
	const target = resolveAuthRedirect("/onboarding", {
		isAuthenticated: true,
		hasWorkspace,
	});
	if (target) redirect(target);

	return (
		<AuthLayout
			title="Crea tu workspace (o espacio de trabajo)"
			subtitle="Este será el espacio donde organizarás tus clientes, proyectos, entregables y facturas."
		>
			<OnboardingForm />
		</AuthLayout>
	);
}
