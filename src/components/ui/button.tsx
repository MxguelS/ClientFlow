import type { ButtonHTMLAttributes } from "react";

export const buttonBase =
	"inline-flex items-center justify-center gap-2 rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-flow focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const variants = {
	primary:
		"bg-accent text-accent-contrast shadow-subtle hover:bg-accent-hover active:scale-[0.99]",
	secondary:
		"border border-line-strong bg-surface-raised text-primary shadow-subtle hover:bg-surface-hover",
	ghost: "text-secondary hover:bg-surface-hover hover:text-primary",
	danger: "bg-danger text-white shadow-subtle hover:brightness-95",
	} as const;

const sizes = {
	sm: "h-8 px-3 text-xs",
	md: "h-9 px-3.5 text-sm",
	lg: "h-10 px-4 text-sm",
	icon: "size-9",
	} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses({
	variant = "primary",
	size = "md",
	className = "",
}: {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
} = {}) {
	return `${buttonBase} ${variants[variant]} ${sizes[size]} ${className}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function Button({
	variant = "primary",
	size = "md",
	className = "",
	...props
}: ButtonProps) {
	return (
		<button
			className={buttonClasses({ variant, size, className })}
			{...props}
		/>
	);
}
