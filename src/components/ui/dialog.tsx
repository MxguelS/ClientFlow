"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
	children,
	className = "",
	showClose = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showClose?: boolean;
}) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="cf-animate-overlay fixed inset-0 z-[var(--z-overlay)] bg-black/35 backdrop-blur-sm" />
			<DialogPrimitive.Content
				className={`cf-animate-pop fixed left-1/2 top-1/2 z-[var(--z-palette)] max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line-strong bg-glass shadow-pop outline-none ${className}`}
				{...props}
			>
				{children}
				{showClose ? (
					<DialogPrimitive.Close
						aria-label="Cerrar"
						className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-tertiary hover:bg-surface-hover hover:text-primary"
					>
						<X aria-hidden="true" className="size-4" />
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}
