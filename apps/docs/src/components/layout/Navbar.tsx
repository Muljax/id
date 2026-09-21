import { ExternalLink, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { INSTANCE_NAME } from "@/lib/config";
import { InstanceLogo } from "../ui/InstanceLogo";

interface NavbarProps {
	onOpenSearch?: () => void;
}

export function Navbar({ onOpenSearch }: NavbarProps) {
	return (
		<header className="fixed top-0 inset-x-0 h-16 bg-zinc-950/70 backdrop-blur-xl border-b border-white/6 flex items-center px-4 sm:px-6 gap-4 z-50 transition-all">
			{/* Left: Brand Logo + Wordmark */}
			<Link
				to="/"
				className="flex items-center gap-3 shrink-0 group hover:opacity-95 transition-opacity"
			>
				<InstanceLogo className="h-8 w-8 rounded-lg" />
				<div className="min-w-0">
					<div className="text-sm font-semibold tracking-tight text-violet-400 truncate">
						{INSTANCE_NAME}
					</div>
					<div className="text-[11px] text-zinc-500 font-mono leading-none mt-0.5">
						Documentation
					</div>
				</div>
				<span className="hidden md:inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-zinc-400 font-medium ml-1">
					v1.0.0
				</span>
			</Link>

			{/* Center: Search pill button */}
			<div className="flex-1 max-w-md mx-auto hidden md:block">
				<button
					type="button"
					onClick={onOpenSearch}
					className="w-full flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 text-zinc-400 text-xs transition-all cursor-pointer shadow-inner"
				>
					<div className="flex items-center gap-2">
						<Search size={14} className="text-zinc-500" />
						<span>Search documentation...</span>
					</div>
					<kbd className="inline-flex items-center gap-0.5 rounded-md bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 font-semibold">
						<span className="text-xs">⌘</span>K
					</kbd>
				</button>
			</div>

			{/* Mobile search trigger */}
			<div className="flex-1 md:hidden flex justify-end">
				<button
					type="button"
					onClick={onOpenSearch}
					className="flex items-center justify-center size-9 rounded-xl border border-white/8 bg-white/[0.03] text-zinc-400 hover:text-white transition-colors cursor-pointer"
					aria-label="Search"
				>
					<Search size={16} />
				</button>
			</div>

			{/* Right: Dashboard link + GitHub */}
			<div className="flex items-center gap-2 shrink-0">
				<a
					href="https://github.com/muljax/id"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub repository"
					className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all cursor-pointer"
				>
					<svg
						width={14}
						height={14}
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
					</svg>
					<span className="hidden sm:inline">GitHub</span>
					<ExternalLink size={12} className="text-zinc-500" />
				</a>
			</div>
		</header>
	);
}
