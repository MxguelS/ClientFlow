export function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<kbd className="inline-flex min-w-5 items-center justify-center rounded border border-line-strong bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] leading-none text-secondary shadow-[0_1px_0_var(--border-strong)]">
			{children}
		</kbd>
	);
}
