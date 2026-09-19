import type { ReactNode } from "react";

export interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export default function EmptyState({
	icon,
	title,
	description,
	action,
	className = "",
}: EmptyStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/20 px-6 py-12 text-center backdrop-blur-sm ${className}`}
		>
			{icon && (
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-inner">
					{icon}
				</div>
			)}

			<h3 className="text-base font-medium text-white">{title}</h3>

			{description && (
				<p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>
			)}

			{action && <div className="mt-6">{action}</div>}
		</div>
	);
}
