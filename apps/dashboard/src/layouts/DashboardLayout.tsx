import { Outlet } from "@tanstack/react-router";

import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/dashboard/Header";
import MobileSidebar from "@/components/dashboard/MobileSidebar";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-white">
			<div className="relative flex min-h-screen overflow-hidden">
				{/* Ambient background */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
				>
					<div className="absolute left-1/2 top-[-20%] h-[60%] w-[60%] -translate-x-1/2 rounded-full bg-violet-500/2.5 blur-[160px]" />
				</div>

				{/* Desktop sidebar */}
				<aside className="relative z-20 hidden w-60 shrink-0 border-r border-white/6 bg-zinc-950 lg:block">
					<Sidebar isAdmin={user.isAdmin} />
				</aside>

				{/* Main application */}
				<div className="relative z-10 flex min-w-0 flex-1 flex-col">
					{/* Mobile navigation */}
					<MobileSidebar isAdmin={user.isAdmin} />

					<header className="bg-zinc-950/70 backdrop-blur-sm">
						<Header />
					</header>

					<main className="flex-1">
						<div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
							<Outlet />
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
