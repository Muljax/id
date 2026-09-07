import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { getNavigationItems } from "@/lib/navigation";
import { routeTree } from "@/routeTree.gen";

interface SidebarProps {
	isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
	const items = getNavigationItems(routeTree, isAdmin).filter(
		(item) => !item.hidden,
	);

	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	function toggleGroup(to: string) {
		setCollapsed((current) => ({
			...current,
			[to]: !current[to],
		}));
	}

	return (
		<aside className="flex min-h-screen w-60 shrink-0 flex-col bg-zinc-950">
			<div className="px-5 pb-6 pt-7">
				<div className="text-sm font-semibold tracking-[-0.01em] text-zinc-200">
					Muljax ID
				</div>
			</div>

			<nav className="flex-1 space-y-1 px-3">
				{items.map((item) => {
					const children = item.children.filter((child) => !child.hidden);
					const hasChildren = children.length > 0;
					const isCollapsed = collapsed[item.to] ?? false;

					if (!hasChildren) {
						return (
							<Link
								key={item.to}
								to={item.to}
								activeOptions={{
									exact: true,
								}}
								activeProps={{
									className: "bg-violet-500/[0.08] text-zinc-100",
								}}
								inactiveProps={{
									className:
										"text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200",
								}}
								className="flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
							>
								{({ isActive }) => (
									<>
										<span
											className={`mr-2 h-1.5 w-1.5 rounded-full transition-opacity ${
												isActive ? "bg-violet-400 opacity-100" : "opacity-0"
											}`}
										/>
										{item.label}
									</>
								)}
							</Link>
						);
					}

					return (
						<div key={item.to}>
							<button
								type="button"
								onClick={() => toggleGroup(item.to)}
								className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/3 hover:text-zinc-200"
							>
								<span>{item.label}</span>

								<svg
									viewBox="0 0 20 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									className={`h-4 w-4 transition-transform ${
										isCollapsed ? "-rotate-90" : ""
									}`}
									aria-hidden="true"
								>
									<path
										d="m6 8 4 4 4-4"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>

							{!isCollapsed && (
								<div className="ml-3 mt-1 space-y-0.5 border-l border-white/6 pl-3">
									{children.map((child) => (
										<Link
											key={child.to}
											to={child.to}
											activeOptions={{
												exact: true,
											}}
											activeProps={{
												className: "bg-violet-500/[0.08] text-zinc-200",
											}}
											inactiveProps={{
												className:
													"text-zinc-600 hover:bg-white/[0.03] hover:text-zinc-300",
											}}
											className="block rounded-md px-3 py-1.5 text-sm transition-colors"
										>
											{({ isActive }) => (
												<div className="flex items-center">
													<span
														className={`mr-2 h-1.5 w-1.5 rounded-full transition-opacity ${
															isActive
																? "bg-violet-400 opacity-100"
																: "opacity-0"
														}`}
													/>
													{child.label}
												</div>
											)}
										</Link>
									))}
								</div>
							)}
						</div>
					);
				})}
			</nav>

			<div className="px-5 pb-5 pt-6">
				<div className="inline-flex items-center gap-1.5 rounded-md border border-white/6 bg-white/2 px-2 py-1 text-[11px]">
					<span className="text-zinc-600">Build</span>
					<span
						className="font-mono font-medium text-zinc-400"
						title={`Build ${__APP_VERSION__}`}
					>
						{__APP_VERSION__}
					</span>
				</div>
			</div>
		</aside>
	);
}
