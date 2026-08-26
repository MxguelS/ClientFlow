export function Skeleton({ className = "" }: { className?: string }) {
	return <div aria-hidden="true" className={`cf-animate-skeleton rounded-md bg-surface-sunken ${className}`} />;
}
