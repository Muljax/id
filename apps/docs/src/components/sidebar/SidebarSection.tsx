import { ChevronDown } from "lucide-react";
import type { NavItem, NavSection } from "../../lib/navigation/types";
import { SidebarLink } from "./SidebarLink";

interface SidebarSectionProps {
	section: NavSection;
	depth: number;
	isOpen: boolean;
	onToggle: () => void;
	onLinkClick?: () => void;
	openSections: Set<string>;
	onSectionToggle: (label: string) => void;
}

export function SidebarSection({
	section,
	depth,
	isOpen,
	onToggle,
	onLinkClick,
	openSections,
	onSectionToggle,
}: SidebarSectionProps) {
	return (
		<li className="space-y-1 my-0.5">
			{/* Section header button */}
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 cursor-pointer select-none"
				aria-expanded={isOpen}
			>
				<span className="truncate">{section.label}</span>
				<ChevronDown
					size={14}
					className={`text-zinc-500 transition-transform duration-200 ${
						isOpen ? "" : "-rotate-90"
					}`}
				/>
			</button>

			{/* Children */}
			{isOpen && (
				<div className="ml-3 space-y-0.5 border-l border-white/8 pl-3">
					{section.items.map((item: NavItem) =>
						item.kind === "page" ? (
							<SidebarLink
								key={item.path}
								page={item}
								depth={depth + 1}
								onClick={onLinkClick}
							/>
						) : (
							<SidebarSection
								key={item.label}
								section={item}
								depth={depth + 1}
								isOpen={openSections.has(item.label)}
								onToggle={() => onSectionToggle(item.label)}
								onLinkClick={onLinkClick}
								openSections={openSections}
								onSectionToggle={onSectionToggle}
							/>
						),
					)}
				</div>
			)}
		</li>
	);
}
