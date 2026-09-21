import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface EntityRowProps {
	id?: string;
	avatar?: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	description?: ReactNode;
	badges?: ReactNode;
	meta?: ReactNode;
	tags?: string[];
	emptyTagsMessage?: ReactNode;
	maxTags?: number;
	actions?: ReactNode;
	expandable?: boolean;
	expanded?: boolean;
	onClick?: () => void;
	isTarget?: boolean;
	className?: string;
	children?: ReactNode;
}

/**
 * Standard entity row primitive for lists (Users, Roles, Clients, etc.).
 */
export default function EntityRow({
	id,
	avatar,
	title,
	subtitle,
	description,
	badges,
	meta,
	tags,
	emptyTagsMessage,
	maxTags = 8,
	actions,
	expandable = false,
	expanded = false,
	onClick,
	isTarget = false,
	className = "",
	children,
}: EntityRowProps) {
	const visibleTags = tags ? tags.slice(0, maxTags) : [];
	const hiddenTagCount =
		tags && tags.length > maxTags ? tags.length - maxTags : 0;

	const content = (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
				{avatar && <div className="shrink-0">{avatar}</div>}

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						{typeof title === "string" ? (
							<span className="truncate text-sm font-semibold text-white">
								{title}
							</span>
						) : (
							title
						)}

						{badges}

						{meta && <span className="text-xs text-zinc-500">{meta}</span>}
					</div>

					{subtitle && (
						<div className="mt-0.5 truncate text-xs text-zinc-400">
							{subtitle}
						</div>
					)}

					{description && (
						<p className="mt-1 text-xs text-zinc-400 line-clamp-1">
							{description}
						</p>
					)}

					{tags && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{tags.length === 0 &&
								emptyTagsMessage &&
								(typeof emptyTagsMessage === "string" ? (
									<span className="text-xs text-zinc-500 italic">
										{emptyTagsMessage}
									</span>
								) : (
									emptyTagsMessage
								))}
							{visibleTags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center rounded-md border border-white/6 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-zinc-300"
								>
									{tag}
								</span>
							))}
							{hiddenTagCount > 0 && (
								<span className="inline-flex items-center rounded-md border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400">
									+{hiddenTagCount} more
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3 self-end sm:self-center shrink-0">
				{actions}

				{expandable && (
					<ChevronDown
						size={16}
						className={`text-zinc-500 transition-transform duration-200 ${
							expanded ? "rotate-180" : ""
						}`}
					/>
				)}
			</div>
		</div>
	);

	return (
		<div
			id={id}
			className={`transition-colors ${
				isTarget ? "bg-violet-500/[0.05] ring-1 ring-violet-500/30" : ""
			} ${className}`}
		>
			{onClick ? (
				<button
					type="button"
					onClick={onClick}
					className="w-full p-5 sm:p-6 text-left transition-colors hover:bg-white/[0.015] cursor-pointer"
				>
					{content}
				</button>
			) : (
				<div className="p-5 sm:p-6 transition-colors hover:bg-white/[0.015]">
					{content}
				</div>
			)}

			{children}
		</div>
	);
}
