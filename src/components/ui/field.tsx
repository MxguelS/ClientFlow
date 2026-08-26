import type { ComponentProps } from "react";

import { buttonClasses } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";

export { inputClasses };

export const buttonPrimaryClasses = buttonClasses({ size: "lg" });

export const fieldLabelClasses =
	"block text-[13px] font-medium text-primary";

type FieldProps = ComponentProps<"input"> & {
	label: string;
	error?: string;
	id: string;
};

export function Field({ label, error, id, ...props }: FieldProps) {
	return (
		<div>
			<label
				htmlFor={id}
				className={fieldLabelClasses}
			>
				{label}
			</label>
			<input
				id={id}
				name={id}
				autoComplete={props.type === "password" ? "current-password" : props.autoComplete}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				className={`${inputClasses} mt-1.5`}
				{...props}
			/>
			{error ? (
				<p
					id={`${id}-error`}
					role="alert"
					className="mt-1.5 text-[13px] text-danger"
				>
					{error}
				</p>
			) : null}
		</div>
	);
}

export function FormAlert({ children }: { children: React.ReactNode }) {
	return (
		<div
			role="alert"
			className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] leading-5 text-danger"
		>
			{children}
		</div>
	);
}
