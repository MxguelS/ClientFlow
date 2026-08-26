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
			<DialogPrimitive.Overlay className="cf-animate-overlay fixed inset-0 z-[var(--z-overlay)] bg-overlay" />
			<DialogPrimitive.Content
				className={`cf-animate-pop fixed left-1/2 top-1/2 z-[var(--z-palette)] flex max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-line-strong bg-surface-raised shadow-pop outline-none ${className}`}
				{...props}
			>
				{children}
				{showClose ? (
					<DialogPrimitive.Close
						aria-label="Cerrar"
						className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-md text-tertiary transition-colors duration-150 hover:bg-surface-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
					>
						<X aria-hidden="true" className="size-4" />
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

/**
 * Patrón visual compartido de dialogs ClientFlow:
 * header separado por hairline, body scrollable, footer ordenado.
 */
export function DialogHeader({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`shrink-0 border-b border-line px-5 py-4 pr-12 ${className}`}>
			{children}
		</div>
	);
}

export function DialogBody({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`min-h-0 flex-1 overflow-y-auto px-5 py-4 ${className}`}>
			{children}
		</div>
	);
}

export function DialogFooter({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3.5 ${className}`}
		>
			{children}
		</div>
	);
}

export const dialogTitleClasses =
	"text-sm font-medium tracking-[-0.01em] text-primary";

export const dialogDescriptionClasses =
	"mt-1 text-[13px] leading-5 text-secondary";
