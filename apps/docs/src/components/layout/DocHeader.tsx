import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export interface DocHeaderProps {
	title: string;
	description?: string;
	category?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
	overview: "Overview",
	"getting-started": "Getting Started",
	"user-guides": "User Guides",
	"admin-guides": "Admin Guides",
	protocols: "Protocols",
	reference: "Reference",
};

export function DocHeader({ title, description, category }: DocHeaderProps) {
	const location = useLocation();

	// Derive category from path if not explicitly provided
	const segments = location.pathname.split("/").filter(Boolean);
	const rawCategory = category || (segments.length > 1 ? segments[0] : "");
	const categoryLabel =
		CATEGORY_NAMES[rawCategory] ||
		rawCategory
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

	return (
		<header className="mb-8 pb-6 border-b border-white/6 not-prose">
			{/* Breadcrumb Navigation */}
			{categoryLabel && (
				<nav
					aria-label="Breadcrumbs"
					className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3 select-none"
				>
					<Link
						to="/"
						className="text-zinc-400 hover:text-zinc-200 transition-colors"
					>
						Docs
					</Link>
					<ChevronRight size={12} className="text-zinc-600" />
					<span className="text-zinc-400">{categoryLabel}</span>
					<ChevronRight size={12} className="text-zinc-600" />
					<span className="text-violet-300 font-medium truncate max-w-[200px] sm:max-w-xs">
						{title}
					</span>
				</nav>
			)}

			{/* Page Title */}
			<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white m-0">
				{title}
			</h1>

			{/* Subheading / Description */}
			{description && (
				<p className="mt-3 text-base sm:text-lg text-zinc-400 leading-relaxed font-normal m-0 max-w-3xl">
					{description}
				</p>
			)}
		</header>
	);
}
