"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
	return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({
	children,
	content,
}: {
	children: React.ReactElement;
	content: React.ReactNode;
}) {
	return (
		<TooltipPrimitive.Root>
			<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Content
					sideOffset={6}
					className="cf-animate-pop z-[var(--z-tooltip)] rounded-md border border-line-strong bg-surface-raised px-2.5 py-1.5 text-xs text-primary shadow-pop"
				>
					{content}
					<TooltipPrimitive.Arrow className="fill-surface-raised" />
				</TooltipPrimitive.Content>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}
