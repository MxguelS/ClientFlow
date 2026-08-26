import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function EmptyState({
	icon: Icon,
	title,
	description,
	label = "Próximamente",
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	label?: string;
}) {
	return (
		<div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
			<div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-accent/15 bg-accent-soft text-accent">
				<Icon aria-hidden="true" className="size-5" strokeWidth={1.7} />
			</div>
			<h3 className="text-sm font-medium text-primary">{title}</h3>
			<p className="mt-1 max-w-xs text-xs leading-5 text-secondary">{description}</p>
			<Badge className="mt-3" variant="neutral">{label}</Badge>
		</div>
	);
}
