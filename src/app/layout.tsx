import type { Metadata } from "next";

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
		<html lang="es">
			<body className="min-h-screen antialiased">{children}</body>
		</html>
	);
}
