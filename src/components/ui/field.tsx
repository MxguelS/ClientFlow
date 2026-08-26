import type { ComponentProps } from "react";

export const inputClasses =
	"w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonPrimaryClasses =
	"inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

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
				className="block text-sm font-medium text-neutral-800"
			>
				{label}
			</label>
			<input
				id={id}
				name={id}
				autoComplete={props.type === "password" ? "current-password" : props.autoComplete}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
				className={`${inputClasses} mt-1`}
				{...props}
			/>
			{error ? (
				<p
					id={`${id}-error`}
					role="alert"
					className="mt-1 text-sm text-red-600"
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
			className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
		>
			{children}
		</div>
	);
}
