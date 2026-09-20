"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
	className = "",
	...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
	return (
		<DropdownPrimitive.Portal>
			<DropdownPrimitive.Content
				sideOffset={6}
				className={`cf-animate-pop z-[var(--z-overlay)] min-w-48 rounded-lg border border-line-strong bg-surface-raised p-1.5 shadow-pop ${className}`}
				{...props}
			/>
		</DropdownPrimitive.Portal>
	);
}

export function DropdownMenuItem({
	className = "",
	...props
}: React.ComponentProps<typeof DropdownPrimitive.Item>) {
	return (
		<DropdownPrimitive.Item
			className={`flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm text-primary outline-none data-[highlighted]:bg-surface-hover ${className}`}
			{...props}
		/>
	);
}

export const DropdownMenuSeparator = DropdownPrimitive.Separator;
