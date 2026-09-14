import type { ReactNode } from "react";

export interface PageHeaderProps {
	title: string;
	description?: string;
	badge?: ReactNode;
	actions?: ReactNode;
	className?: string;
}

export default function PageHeader({
	title,
	description,
	badge,
	actions,
	className = "",
}: PageHeaderProps) {
	return (
		<div
			className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
		>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
						{title}
					</h1>
					{badge && <div className="shrink-0">{badge}</div>}
				</div>

				{description && (
					<p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">
						{description}
					</p>
				)}
			</div>

			{actions && (
				<div className="flex shrink-0 flex-wrap items-center gap-2.5">
					{actions}
				</div>
			)}
		</div>
	);
}
