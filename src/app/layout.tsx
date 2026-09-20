import type { Metadata } from "next";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { THEME_SCRIPT } from "@/lib/theme/script";

import "./globals.css";

export const metadata: Metadata = {
	title: "ClientFlow",
	description:
		"Gestión de clientes, proyectos, entregables y facturación para freelancers y pequeños equipos.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body className="min-h-screen antialiased">
				<Script id="clientflow-theme" strategy="beforeInteractive">
					{THEME_SCRIPT}
				</Script>
				<ThemeProvider>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
