import type { HTMLAttributes } from "react";

const styles = {
	neutral: "border-line bg-surface-sunken text-secondary",
	accent: "border-accent/20 bg-accent-soft text-accent-strong",
	success: "border-success/20 bg-success-soft text-success",
	warning: "border-warning/20 bg-warning-soft text-warning",
	danger: "border-danger/20 bg-danger-soft text-danger",
} as const;

export function Badge({
	variant = "neutral",
	dot = false,
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLSpanElement> & {
	variant?: keyof typeof styles;
	dot?: boolean;
}) {
	return (
		<span
			className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium ${styles[variant]} ${className}`}
			{...props}
		>
			{dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
			{children}
		</span>
	);
}
