"use client";

import { LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown";

export function UserArea({ name, email }: { name: string; email: string }) {
	const router = useRouter();
	const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

	async function logout() {
		await createClient().auth.signOut();
		router.replace("/login");
		router.refresh();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button type="button" aria-label="Abrir menú de usuario" className="flex w-full items-center gap-2.5 rounded-md p-2 text-left hover:bg-surface-hover">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-strong">{initials}</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate text-xs font-medium text-primary">{name}</span>
						<span className="block truncate text-[10px] text-tertiary">{email}</span>
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" side="top" className="mb-1">
				<DropdownMenuItem onSelect={() => router.push("/settings")}><SlidersHorizontal aria-hidden="true" className="size-4" />Ajustes</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => router.push("/dashboard")}><UserRound aria-hidden="true" className="size-4" />Ver perfil</DropdownMenuItem>
				<DropdownMenuSeparator className="my-1 h-px bg-line" />
				<DropdownMenuItem onSelect={logout} className="text-danger data-[highlighted]:text-danger"><LogOut aria-hidden="true" className="size-4" />Cerrar sesión</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
