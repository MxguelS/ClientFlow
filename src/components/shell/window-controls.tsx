"use client";

export function WindowControls({
}: {
	maximized: boolean;
	onToggleSidebar: () => void;
	onToggleMaximized: () => void;
}) {
	return (
		<div aria-hidden="true" className="flex items-center gap-2">
			<span className="size-3 rounded-full bg-[#ff6259] shadow-[inset_0_1px_1px_rgb(255_255_255/35%)]" />
			<span className="size-3 rounded-full bg-[#ffbd2e] shadow-[inset_0_1px_1px_rgb(255_255_255/35%)]" />
			<span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_1px_1px_rgb(255_255_255/35%)]" />
		</div>
	);
}
