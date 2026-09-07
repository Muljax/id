import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";

import { getNavigationItems } from "@/lib/navigation";
import { routeTree } from "@/routeTree.gen";

interface MobileSidebarProps {
	isAdmin: boolean;
}

export default function MobileSidebar({ isAdmin }: MobileSidebarProps) {
	const [open, setOpen] = useState(false);
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const items = getNavigationItems(routeTree, isAdmin);

	function toggleGroup(to: string) {
		setCollapsed((current) => ({
			...current,
			[to]: !current[to],
		}));
	}

	function close() {
		setOpen(false);
	}

	useEffect(() => {
		if (!open) {
			document.body.style.overflow = "";
			return;
		}

		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Open navigation"
				aria-expanded={open}
				className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-white/6 bg-zinc-950 text-zinc-400 shadow-lg transition-colors hover:bg-white/[0.04] hover:text-zinc-200 md:hidden"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					className="h-5 w-5"
					aria-hidden="true"
				>
					<path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
				</svg>
			</button>

			{open && (
				<div className="fixed inset-0 z-50 md:hidden">
					<button
						type="button"
						aria-label="Close navigation"
						onClick={close}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-zinc-950 shadow-2xl">
						<div className="flex items-center justify-between px-5 pb-6 pt-7">
							<div className="text-sm font-semibold tracking-[-0.01em] text-zinc-200">
								Muljax ID
							</div>

							<button
								type="button"
								onClick={close}
								aria-label="Close navigation"
								className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-200"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
									className="h-5 w-5"
									aria-hidden="true"
								>
									<path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
								</svg>
							</button>
						</div>

						<nav className="flex-1 space-y-1 overflow-y-auto px-3">
							{items.map((item) => {
								const hasChildren = item.children.length > 0;
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
											className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
											onClick={close}
										>
											{({ isActive }) => (
												<>
													<span
														className={`mr-2 h-1.5 w-1.5 rounded-full transition-opacity ${
															isActive
																? "bg-violet-400 opacity-100"
																: "opacity-0"
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
											className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-zinc-200"
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
												{item.children.map((child) => (
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
														className="block rounded-md px-3 py-2 text-sm transition-colors"
														onClick={close}
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
							<div className="inline-flex items-center gap-1.5 rounded-md border border-white/6 bg-white/[0.02] px-2 py-1 text-[11px]">
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
				</div>
			)}
		</>
	);
}
