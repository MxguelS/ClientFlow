import { Badge } from "@/components/ui/badge";
import {
	PROJECT_STATUS_LABELS,
	type ProjectStatus,
} from "@/lib/projects/validation";

const variantByStatus = {
	planning: "accent",
	active: "success",
	on_hold: "warning",
	completed: "neutral",
	cancelled: "neutral",
} as const;

export function ProjectStatusBadge({ status }: { status: string }) {
	const variant = variantByStatus[status as ProjectStatus] ?? "neutral";
	return (
		<Badge variant={variant} dot>
			{PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status}
		</Badge>
	);
}
