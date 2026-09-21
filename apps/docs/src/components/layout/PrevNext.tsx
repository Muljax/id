import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavTree } from "@/lib/navigation/types";

interface PrevNextProps {
	tree: NavTree;
}

export function PrevNext({ tree }: PrevNextProps) {
	const { pathname } = useLocation();

	const index = tree.pages.findIndex((page) => page.path === pathname);

	const prev = index > 0 ? (tree.pages[index - 1] ?? null) : null;
	const next =
		index !== -1 && index < tree.pages.length - 1
			? (tree.pages[index + 1] ?? null)
			: null;

	if (!prev && !next) return null;

	return (
		<nav
			aria-label="Page navigation"
			className="mt-16 pt-8 border-t border-white/6"
		>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{/* Previous */}
				<div>
					{prev ? (
						<Link
							to={prev.path}
							className="group flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-zinc-900/40 hover:bg-zinc-900/60 p-5 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:shadow-black/40 text-left h-full"
						>
							<span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">
								<ChevronLeft
									size={14}
									className="group-hover:-translate-x-0.5 transition-transform"
								/>
								Previous
							</span>
							<span className="text-sm font-medium text-zinc-200 group-hover:text-violet-300 transition-colors">
								{prev.title}
							</span>
						</Link>
					) : (
						<div />
					)}
				</div>

				{/* Next */}
				<div>
					{next ? (
						<Link
							to={next.path}
							className="group flex flex-col gap-1.5 rounded-2xl border border-white/8 bg-zinc-900/40 hover:bg-zinc-900/60 p-5 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:shadow-black/40 text-right h-full"
						>
							<span className="flex items-center justify-end gap-1 text-[11px] font-mono uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400">
								Next
								<ChevronRight
									size={14}
									className="group-hover:translate-x-0.5 transition-transform"
								/>
							</span>
							<span className="text-sm font-medium text-zinc-200 group-hover:text-violet-300 transition-colors">
								{next.title}
							</span>
						</Link>
					) : (
						<div />
					)}
				</div>
			</div>
		</nav>
	);
}
