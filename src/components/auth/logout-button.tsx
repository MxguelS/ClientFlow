"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	async function handleLogout() {
		setPending(true);
		const supabase = createClient();

		// signOut invalida el token en el servidor de Auth y limpia las
		// cookies de sesión vía el cliente SSR.
		const { error } = await supabase.auth.signOut();

		setPending(false);
		router.replace(error ? "/dashboard?logout_error=1" : "/login");
		router.refresh();
	}

	return (
		<button
			type="button"
			onClick={handleLogout}
			disabled={pending}
			className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{pending ? (
				<Loader2 aria-hidden className="size-4 animate-spin" />
			) : (
				<LogOut aria-hidden className="size-4" />
			)}
			Cerrar sesión
		</button>
	);
}
