import type { InputHTMLAttributes } from "react";

export const inputClasses =
	"h-9 w-full rounded-md border border-line-strong bg-surface-sunken px-3 text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	invalid?: boolean;
}

export function Input({ invalid, className = "", ...props }: InputProps) {
	return (
		<input
			className={`${inputClasses} ${invalid ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20" : ""} ${className}`}
			aria-invalid={invalid || undefined}
			{...props}
		/>
	);
}
