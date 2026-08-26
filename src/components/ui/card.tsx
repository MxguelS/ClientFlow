import type { HTMLAttributes } from "react";

const surfaces = {
	raised: "border border-line bg-surface-raised shadow-subtle",
	sunken: "border border-line bg-surface-sunken",
	plain: "border border-line bg-surface",
} as const;

export function Card({
	variant = "raised",
	className = "",
	...props
}: HTMLAttributes<HTMLDivElement> & {
	variant?: keyof typeof surfaces;
}) {
	return (
		<div
			className={`rounded-xl ${surfaces[variant]} ${className}`}
			{...props}
		/>
	);
}
