import { Link, Outlet } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import NotificationBell from "@/components/NotificationBell";
import Button from "@/components/ui/Button";
import InstanceLogo from "@/components/ui/InstanceLogo";
import { useAuth } from "@/context/AuthContext";
import { INSTANCE_NAME } from "@/lib/config";
import { getNavigationItems } from "@/lib/navigation";
import { routeTree } from "@/routeTree.gen";

export default function DashboardLayout() {
	const { user, logout } = useAuth();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const permissions = useMemo(
		() => user?.permissions ?? [],
		[user?.permissions],
	);

	const items = useMemo(() => {
		return getNavigationItems(routeTree, permissions).filter(
			(item) => !item.hidden,
		);
	}, [permissions]);

	function toggleGroup(to: string) {
		setCollapsed((current) => ({
			...current,
			[to]: !current[to],
		}));
	}

	function closeMobile() {
		setMobileOpen(false);
	}

	// Body scroll-lock when mobile drawer is open
	useEffect(() => {
		if (!mobileOpen) {
			return;
		}

		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = prev;
		};
	}, [mobileOpen]);

	// Close mobile drawer on Escape
	useEffect(() => {
		if (!mobileOpen) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setMobileOpen(false);
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [mobileOpen]);

	async function handleLogout() {
		setLoggingOut(true);
		try {
			await logout();
		} finally {
			setLoggingOut(false);
		}
	}

	const userInitials = useMemo(() => {
		if (!user) {
			return "U";
		}
		if (user.displayName) {
			const parts = user.displayName.trim().split(/\s+/);
			if (parts.length >= 2) {
				return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
			}
			return user.displayName.slice(0, 2).toUpperCase();
		}
		return user.email.slice(0, 2).toUpperCase();
	}, [user]);

	if (!user) {
		return null;
	}

	const renderNavLinks = (onLinkClick?: () => void) => (
		<nav className="flex-1 space-y-1 px-3 py-2">
			{items.map((item) => {
				const children = item.children.filter((child) => !child.hidden);
				const hasChildren = children.length > 0;
				const isCollapsed = collapsed[item.to] ?? false;

				if (!hasChildren) {
					return (
						<Link
							key={item.to}
							to={item.to}
							activeOptions={{ exact: true }}
							activeProps={{
								className:
									"bg-violet-500/10 text-violet-200 border-violet-500/20 font-medium",
							}}
							inactiveProps={{
								className:
									"text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border-transparent",
							}}
							onClick={onLinkClick}
							className="group flex items-center rounded-xl border px-3 py-2 text-sm transition-all duration-150"
						>
							{({ isActive }) => (
								<>
									<span
										className={`mr-2.5 h-1.5 w-1.5 rounded-full transition-all duration-150 ${
											isActive
												? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] scale-100"
												: "bg-transparent scale-0"
										}`}
									/>
									<span className="truncate">{item.label}</span>
								</>
							)}
						</Link>
					);
				}

				return (
					<div key={item.to} className="space-y-1">
						<button
							type="button"
							onClick={() => toggleGroup(item.to)}
							className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-200 cursor-pointer"
						>
							<span className="truncate">{item.label}</span>
							<ChevronDown
								size={14}
								className={`text-zinc-500 transition-transform duration-200 ${
									isCollapsed ? "-rotate-90" : ""
								}`}
							/>
						</button>

						{!isCollapsed && (
							<div className="ml-3 space-y-0.5 border-l border-white/8 pl-3">
								{children.map((child) => (
									<Link
										key={child.to}
										to={child.to}
										activeOptions={{ exact: true }}
										activeProps={{
											className:
												"bg-violet-500/10 text-violet-200 border-violet-500/20 font-medium",
										}}
										inactiveProps={{
											className:
												"text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border-transparent",
										}}
										onClick={onLinkClick}
										className="group flex items-center rounded-lg border px-3 py-1.5 text-sm transition-all duration-150"
									>
										{({ isActive }) => (
											<>
												<span
													className={`mr-2.5 h-1.5 w-1.5 rounded-full transition-all duration-150 ${
														isActive
															? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)] scale-100"
															: "bg-transparent scale-0"
													}`}
												/>
												<span className="truncate">{child.label}</span>
											</>
										)}
									</Link>
								))}
							</div>
						)}
					</div>
				);
			})}
		</nav>
	);

	return (
		<div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-500/30">
			<div className="relative flex min-h-screen">
				{/* Ambient background glow */}
				<div
					aria-hidden="true"
					className="pointer-events-none fixed inset-0 overflow-hidden"
				>
					<div className="absolute left-1/3 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.035] blur-[150px]" />
					<div className="absolute bottom-[-10%] right-[-5%] h-[450px] w-[450px] rounded-full bg-indigo-600/[0.025] blur-[150px]" />
				</div>

				{/* Desktop Sidebar (lg:flex, hidden on < lg) */}
				<aside className="relative z-20 hidden w-64 shrink-0 flex-col border-r border-white/6 bg-zinc-950/80 backdrop-blur-xl lg:flex">
					{/* Brand */}
					<div className="flex items-center gap-3 px-6 py-5 border-b border-white/6">
						<InstanceLogo className="h-8 w-8 rounded-lg shrink-0" />
						<div className="min-w-0">
							<div className="text-sm font-semibold tracking-tight text-violet-400 truncate">
								{INSTANCE_NAME}
							</div>
							<div className="text-[11px] text-zinc-500 font-mono mt-0.5">
								Identity Provider
							</div>
						</div>
					</div>

					{/* Navigation links */}
					<div className="flex-1 overflow-y-auto py-3">{renderNavLinks()}</div>

					{/* Version footer */}
					<div className="border-t border-white/6 p-4">
						<div className="flex items-center justify-between px-2 text-[11px] text-zinc-500 font-mono">
							<span>v{__APP_VERSION__}</span>
						</div>
					</div>
				</aside>

				{/* Mobile Drawer (Only on < lg) */}
				{mobileOpen && (
					<div className="fixed inset-0 z-50 lg:hidden">
						<button
							type="button"
							aria-label="Close navigation"
							onClick={closeMobile}
							className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
						/>

						<aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-zinc-950 shadow-2xl">
							<div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
								<div className="flex items-center gap-3 min-w-0">
									<InstanceLogo className="h-7 w-7 rounded-lg shrink-0" />
									<span className="text-sm font-semibold text-violet-400 truncate">
										{INSTANCE_NAME}
									</span>
								</div>

								<button
									type="button"
									onClick={closeMobile}
									className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
									aria-label="Close menu"
								>
									<X size={18} />
								</button>
							</div>

							<div className="flex-1 overflow-y-auto py-3">
								{renderNavLinks(closeMobile)}
							</div>

							<div className="border-t border-white/6 p-4">
								<div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
									<span>v{__APP_VERSION__}</span>
								</div>
							</div>
						</aside>
					</div>
				)}

				{/* Main Content Column */}
				<div className="relative z-10 flex min-w-0 flex-1 flex-col">
					{/* Topbar Header */}
					<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/6 bg-zinc-950/70 px-4 sm:px-6 backdrop-blur-xl">
						<div className="flex items-center gap-3">
							{/* Mobile Hamburger (lg:hidden) */}
							<button
								type="button"
								onClick={() => setMobileOpen(true)}
								className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-colors lg:hidden cursor-pointer"
								aria-label="Open navigation menu"
								aria-expanded={mobileOpen}
							>
								<Menu size={18} />
							</button>

							<div className="flex items-center gap-2.5 lg:hidden">
								<InstanceLogo className="h-6 w-6 rounded-md shrink-0" />
								<span className="text-sm font-semibold text-violet-400">
									{INSTANCE_NAME}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<NotificationBell />

							{/* User details chip */}
							<div className="flex items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] py-1 pl-1.5 pr-3">
								<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-semibold text-violet-300 border border-violet-500/30">
									{userInitials}
								</div>
								<span className="hidden sm:inline text-xs font-medium text-zinc-300 max-w-[180px] truncate">
									{user.displayName || user.email}
								</span>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								loading={loggingOut}
								onClick={() => void handleLogout()}
								icon={<LogOut size={14} />}
								title="Sign out"
							>
								<span className="hidden sm:inline">Sign out</span>
							</Button>
						</div>
					</header>

					{/* Page Content */}
					<main className="flex-1">
						<div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
							<Outlet />
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
