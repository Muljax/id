import { Menu, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "./Navbar";
import { MobileTOC, PageTOC } from "./PageTOC";
import { PrevNext } from "./PrevNext";
import { InstanceLogo } from "@/components/ui/InstanceLogo";
import { INSTANCE_NAME } from "@/lib/config";
import type { NavTree } from "@/lib/navigation/types";

const SearchModal = lazy(() =>
	import("@/components/search").then((m) => ({ default: m.SearchModal })),
);

interface DocsLayoutProps {
	tree: NavTree;
}

export function DocsLayout({ tree }: DocsLayoutProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);

	// Global Keyboard Shortcuts (Cmd+K, Ctrl+K, / to open search)
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setSearchOpen((prev) => !prev);
			} else if (
				e.key === "/" &&
				document.activeElement?.tagName !== "INPUT" &&
				document.activeElement?.tagName !== "TEXTAREA"
			) {
				e.preventDefault();
				setSearchOpen(true);
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Body scroll-lock when mobile drawer is open
	useEffect(() => {
		if (!mobileOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [mobileOpen]);

	// Close on Escape
	useEffect(() => {
		if (!mobileOpen) return;
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setMobileOpen(false);
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [mobileOpen]);

	return (
		<div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-500/30 selection:text-violet-200">
			{/* Search Modal */}
			{searchOpen && (
				<Suspense fallback={null}>
					<SearchModal
						isOpen={searchOpen}
						onClose={() => setSearchOpen(false)}
					/>
				</Suspense>
			)}
			{/* Ambient background glow matching dashboard */}
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 overflow-hidden"
			>
				<div className="absolute left-1/3 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.035] blur-[150px]" />
				<div className="absolute bottom-[-10%] right-[-5%] h-[450px] w-[450px] rounded-full bg-indigo-600/[0.025] blur-[150px]" />
			</div>

			<Navbar onOpenSearch={() => setSearchOpen(true)} />

			{/* Mobile Drawer (Only on < lg) */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						type="button"
						aria-label="Close navigation"
						onClick={() => setMobileOpen(false)}
						className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
					/>

					<aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-white/10 bg-zinc-950 shadow-2xl">
						<div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
							<div className="flex items-center gap-2.5">
								<InstanceLogo className="h-6 w-6 rounded-md" />
								<span className="text-sm font-semibold text-violet-400">
									{INSTANCE_NAME}
								</span>
							</div>
							<button
								type="button"
								onClick={() => setMobileOpen(false)}
								className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
								aria-label="Close menu"
							>
								<X size={18} />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto py-3 px-3">
							<Sidebar tree={tree} onLinkClick={() => setMobileOpen(false)} />
						</div>

						<div className="border-t border-white/6 p-4">
							<div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
								<span>v1.0.0</span>
							</div>
						</div>
					</aside>
				</div>
			)}

			<div className="relative z-10 flex pt-16 max-w-7xl mx-auto">
				{/* Desktop Sidebar (lg:flex, hidden on < lg) */}
				<aside className="hidden lg:flex fixed top-16 bottom-0 w-64 shrink-0 flex-col border-r border-white/6 bg-zinc-950/80 backdrop-blur-xl p-3 overflow-y-auto">
					<Sidebar tree={tree} />
				</aside>

				{/* Main Content Column */}
				<main className="flex-1 min-w-0 lg:pl-68 xl:pr-64">
					<article className="mx-auto max-w-3xl px-4 sm:px-8 py-10 prose prose-invert">
						<MobileTOC />
						<Outlet />
					</article>
					<div className="mx-auto max-w-3xl px-4 sm:px-8 pb-16">
						<PrevNext tree={tree} />
					</div>
				</main>

				{/* Desktop Right Table of Contents */}
				<aside className="hidden xl:block fixed top-16 right-[max(0px,calc(50%-40rem))] bottom-0 w-60 overflow-y-auto p-6">
					<PageTOC />
				</aside>
			</div>

			{/* Mobile navigation toggle button */}
			<button
				type="button"
				className="fixed bottom-5 right-5 z-40 lg:hidden flex items-center justify-center size-12 bg-white text-zinc-950 rounded-2xl shadow-xl shadow-black/40 hover:bg-zinc-200 transition-transform active:scale-95 cursor-pointer"
				onClick={() => setMobileOpen(true)}
				aria-label="Open navigation"
			>
				<Menu size={20} />
			</button>
		</div>
	);
}
