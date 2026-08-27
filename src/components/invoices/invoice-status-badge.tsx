import { Badge } from "@/components/ui/badge";
import {
	INVOICE_STATUS_LABELS,
	type InvoiceStatus,
} from "@/lib/invoices/validation";

const variantByStatus = {
	draft: "neutral",
	sent: "accent",
	paid: "success",
	overdue: "warning",
	cancelled: "neutral",
} as const;

export function InvoiceStatusBadge({ status }: { status: string }) {
	const variant = variantByStatus[status as InvoiceStatus] ?? "neutral";
	return (
		<Badge variant={variant} dot>
			{INVOICE_STATUS_LABELS[status as InvoiceStatus] ?? status}
		</Badge>
	);
}