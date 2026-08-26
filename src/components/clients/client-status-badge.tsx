import { Badge } from "@/components/ui/badge";
import {
	CLIENT_STATUS_LABELS,
	type ClientStatus,
} from "@/lib/clients/validation";

const variantByStatus = {
	active: "success",
	lead: "accent",
	inactive: "neutral",
} as const;

export function ClientStatusBadge({ status }: { status: string }) {
	const variant = variantByStatus[status as ClientStatus] ?? "neutral";
	return (
		<Badge variant={variant} dot>
			{CLIENT_STATUS_LABELS[status as ClientStatus] ?? status}
		</Badge>
	);
}
