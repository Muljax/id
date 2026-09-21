import { NavLink } from "react-router-dom";
import type { NavPage } from "../../lib/navigation/types";
import { SidebarBadge } from "./SidebarBadge";

interface SidebarLinkProps {
	page: NavPage;
	/** 0 = top-level, 1 = inside a section, etc. Controls left indent. */
	depth: number;
	onClick?: () => void;
}

export function SidebarLink({
	page,
	depth: _depth,
	onClick,
}: SidebarLinkProps) {
	return (
		<NavLink
			to={page.path}
			onClick={onClick}
			className={({ isActive }) =>
				[
					"group flex items-center rounded-xl border px-3 py-1.5 text-xs transition-all duration-150",
					isActive
						? "bg-violet-500/10 text-violet-200 border-violet-500/20 font-medium"
						: "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border-transparent",
				].join(" ")
			}
		>
			{({ isActive }) => (
				<>
					<span
						className={`mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-150 ${
							isActive
								? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] scale-100"
								: "bg-transparent scale-0"
						}`}
					/>
					<span className="flex-1 truncate">{page.title}</span>
					{page.badge && <SidebarBadge text={page.badge} />}
				</>
			)}
		</NavLink>
	);
}
