import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Lenguaje compartido de campos ClientFlow:
 * quietos por defecto (hairline), hover discreto, focus con el accent
 * activo del theme de forma sutil. El outline global no aplica a campos
 * (ver globals.css) para evitar el doble anillo.
 */
const fieldBase =
	"w-full rounded-md border border-line bg-surface-sunken text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-55";

const fieldInvalid =
	"border-danger/70 hover:border-danger focus-visible:border-danger focus-visible:ring-danger/15";

export const inputClasses = `h-9 px-3 ${fieldBase}`;

export const selectClasses = `h-9 cursor-pointer px-3 pr-8 ${fieldBase}`;

export const textareaClasses = `px-3 py-2 ${fieldBase}`;

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	invalid?: boolean;
}

export function Input({ invalid, className = "", ...props }: InputProps) {
	return (
		<input
			className={`${inputClasses} ${invalid ? fieldInvalid : ""} ${className}`}
			aria-invalid={invalid || undefined}
			{...props}
		/>
	);
}

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	invalid?: boolean;
}

export function Textarea({ invalid, className = "", ...props }: TextareaProps) {
	return (
		<textarea
			className={`${textareaClasses} ${invalid ? fieldInvalid : ""} ${className}`}
			aria-invalid={invalid || undefined}
			{...props}
		/>
	);
}
