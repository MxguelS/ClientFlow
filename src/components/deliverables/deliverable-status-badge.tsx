import { Badge } from "@/components/ui/badge";
import {
	DELIVERABLE_STATUS_LABELS,
	type DeliverableStatus,
} from "@/lib/deliverables/validation";

const variantByStatus = {
	pending: "neutral",
	in_progress: "accent",
	in_review: "warning",
	approved: "success",
} as const;

export function DeliverableStatusBadge({ status }: { status: string }) {
	const variant = variantByStatus[status as DeliverableStatus] ?? "neutral";
	return (
		<Badge variant={variant} dot>
			{DELIVERABLE_STATUS_LABELS[status as DeliverableStatus] ?? status}
		</Badge>
	);
}
