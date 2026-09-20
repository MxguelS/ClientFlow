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
		<div className="cf-page-enter flex min-h-40 flex-col items-center justify-center border-y border-line px-5 py-8 text-center">
			<Icon aria-hidden="true" className="mb-3 size-4 text-secondary" strokeWidth={1.7} />
			<h3 className="text-sm font-medium text-primary">{title}</h3>
			<p className="mt-1 max-w-xs text-xs leading-5 text-secondary">{description}</p>
			{label ? <Badge className="mt-3" variant="neutral">{label}</Badge> : null}
		</div>
	);
}
