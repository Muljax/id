import type { ReactNode } from "react";

interface PreAuthLayoutProps {
	children: ReactNode;
}

export default function PreAuthLayout({ children }: PreAuthLayoutProps) {
	return (
		<div className="min-h-screen bg-zinc-950 text-white">
			<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
				{/* Ambient background glow */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 overflow-hidden"
				>
					<div className="absolute left-1/2 top-[-15%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[140px]" />
					<div className="absolute bottom-[-15%] right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-600/[0.04] blur-[140px]" />
				</div>

				{/* Center card wrapper */}
				<main className="relative z-10 w-full max-w-md">
					<div className="rounded-3xl border border-white/8 bg-zinc-900/40 p-7 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
