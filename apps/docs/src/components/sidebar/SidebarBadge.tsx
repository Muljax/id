interface SidebarBadgeProps {
	text: string;
}

export function SidebarBadge({ text }: SidebarBadgeProps) {
	return (
		<span className="ml-auto shrink-0 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-violet-300 backdrop-blur-sm select-none">
			{text}
		</span>
	);
}
