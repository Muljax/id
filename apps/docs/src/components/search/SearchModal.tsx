import {
	ArrowRight,
	Code2,
	CornerDownLeft,
	Database,
	FileText,
	Hash,
	Search,
	ShieldCheck,
	Sparkles,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchIndex } from "virtual:docs-search";
import type { SearchRecord } from "@/lib/search/types";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const QUICK_SUGGESTIONS = [
	{ label: "Database Schema", query: "database schema" },
	{ label: "Passkeys / WebAuthn", query: "passkeys" },
	{ label: "OpenSSH Certificate Authority", query: "ssh ca" },
	{ label: "OAuth 2.0 & OIDC", query: "oauth" },
	{ label: "Instance Settings", query: "instance settings" },
	{ label: "REST API", query: "api" },
];

function highlightMatch(text: string, query: string) {
	if (!query.trim() || !text) return text;
	const parts = text.split(
		new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
	);
	return parts.map((part, i) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<mark
				key={`${part}-${i}`}
				className="bg-violet-500/30 text-violet-200 font-semibold rounded px-0.5"
			>
				{part}
			</mark>
		) : (
			part
		),
	);
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setSelectedIndex(0);
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	// Filter & Score Results
	const filteredResults = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];

		const terms = q.split(/\s+/).filter(Boolean);

		const scored: Array<{ record: SearchRecord; score: number }> = [];

		for (const record of searchIndex) {
			let score = 0;
			const titleLower = record.title.toLowerCase();
			const descLower = (record.description || "").toLowerCase();
			const urlLower = record.url.toLowerCase();
			const keywordsLower = (record.keywords || [])
				.map((k) => k.toLowerCase())
				.join(" ");

			// Exact matches
			if (titleLower === q) score += 100;
			else if (titleLower.startsWith(q)) score += 60;
			else if (titleLower.includes(q)) score += 40;

			// Category boosts
			if (
				record.category === "Database" &&
				(q.includes("table") || q.includes("schema") || q.includes("db"))
			) {
				score += 20;
			}
			if (
				record.category === "API" &&
				(q.includes("api") || q.includes("endpoint") || q.includes("rest"))
			) {
				score += 20;
			}

			// Sub-terms matching
			let allTermsMatch = true;
			for (const term of terms) {
				const inTitle = titleLower.includes(term);
				const inDesc = descLower.includes(term);
				const inUrl = urlLower.includes(term);
				const inKw = keywordsLower.includes(term);

				if (inTitle) score += 25;
				else if (inDesc) score += 10;
				else if (inKw) score += 15;
				else if (inUrl) score += 5;
				else {
					allTermsMatch = false;
				}
			}

			if (allTermsMatch || score > 30) {
				scored.push({ record, score });
			}
		}

		return scored
			.sort((a, b) => b.score - a.score)
			.slice(0, 12)
			.map((s) => s.record);
	}, [query]);

	// Reset selection when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, []);

	// Scroll selected item into view
	useEffect(() => {
		if (!listRef.current) return;
		const selectedEl = listRef.current.querySelector(
			`[data-index="${selectedIndex}"]`,
		);
		if (selectedEl) {
			selectedEl.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	const handleNavigate = useCallback(
		(url: string) => {
			onClose();
			if (url.includes("#")) {
				const [path, hash] = url.split("#");
				navigate(path || "/");
				setTimeout(() => {
					const el = document.getElementById(hash);
					if (el) {
						el.scrollIntoView({ behavior: "smooth" });
						window.history.pushState(null, "", `#${hash}`);
					}
				}, 100);
			} else {
				navigate(url);
			}
		},
		[navigate, onClose],
	);

	// Keydown navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				filteredResults.length ? (prev + 1) % filteredResults.length : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				filteredResults.length
					? (prev - 1 + filteredResults.length) % filteredResults.length
					: 0,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (filteredResults[selectedIndex]) {
				handleNavigate(filteredResults[selectedIndex].url);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	if (!isOpen) return null;

	const getCategoryIcon = (cat: string) => {
		if (cat === "Database")
			return <Database size={14} className="text-amber-400" />;
		if (cat === "API") return <Code2 size={14} className="text-emerald-400" />;
		if (cat === "Protocol")
			return <ShieldCheck size={14} className="text-sky-400" />;
		if (cat === "Section")
			return <Hash size={14} className="text-violet-400" />;
		return <FileText size={14} className="text-zinc-400" />;
	};

	const getCategoryBadgeClass = (cat: string) => {
		if (cat === "Database")
			return "border-amber-500/25 bg-amber-500/10 text-amber-300";
		if (cat === "API")
			return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
		if (cat === "Protocol")
			return "border-sky-500/25 bg-sky-500/10 text-sky-300";
		if (cat === "Section")
			return "border-violet-500/25 bg-violet-500/10 text-violet-300";
		return "border-zinc-700 bg-zinc-800/80 text-zinc-300";
	};

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Close search"
				onClick={onClose}
				className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
			/>

			{/* Modal Container */}
			<div
				onKeyDown={handleKeyDown}
				className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden not-prose z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
			>
				{/* Search Input Bar */}
				<div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 bg-white/[0.02]">
					<Search size={18} className="text-violet-400 shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search documentation, guides, database tables, APIs..."
						className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
						>
							<X size={14} />
						</button>
					)}
					<kbd className="hidden sm:inline-flex items-center rounded-md bg-white/[0.06] border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
						ESC
					</kbd>
				</div>

				{/* Results / Empty View */}
				<div
					ref={listRef}
					className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-transparent"
				>
					{query.trim() === "" ? (
						<div className="p-4 space-y-3">
							<div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
								<Sparkles size={12} className="text-violet-400" />
								<span>Suggested Quick Jumps</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{QUICK_SUGGESTIONS.map((sug) => (
									<button
										key={sug.label}
										type="button"
										onClick={() => setQuery(sug.query)}
										className="flex items-center justify-between p-2.5 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/25 text-left text-xs text-zinc-300 hover:text-violet-200 transition-all cursor-pointer group"
									>
										<span>{sug.label}</span>
										<ArrowRight
											size={12}
											className="text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-transform"
										/>
									</button>
								))}
							</div>
						</div>
					) : filteredResults.length === 0 ? (
						<div className="py-12 text-center text-zinc-500 text-xs">
							<p>
								No results found for &ldquo;
								<span className="text-zinc-300">{query}</span>&rdquo;
							</p>
							<p className="text-[11px] text-zinc-600 mt-1">
								Try searching for a general keyword, schema table, or endpoint
								name.
							</p>
						</div>
					) : (
						filteredResults.map((record, idx) => {
							const isSelected = idx === selectedIndex;
							return (
								<button
									key={record.id}
									data-index={idx}
									type="button"
									onClick={() => handleNavigate(record.url)}
									onMouseEnter={() => setSelectedIndex(idx)}
									className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
										isSelected
											? "bg-violet-500/15 border border-violet-500/30 text-white shadow-sm"
											: "border border-transparent text-zinc-300 hover:bg-white/[0.03]"
									}`}
								>
									<div className="mt-0.5 flex size-6 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] shrink-0">
										{getCategoryIcon(record.category)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-xs font-semibold text-white tracking-tight truncate">
												{highlightMatch(record.title, query)}
											</span>
											<span
												className={`rounded-full border px-1.5 py-0.2 text-[9px] font-mono font-medium shrink-0 uppercase ${getCategoryBadgeClass(
													record.category,
												)}`}
											>
												{record.category}
											</span>
										</div>

										{record.breadcrumbs.length > 0 && (
											<div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
												{record.breadcrumbs.join(" / ")}
											</div>
										)}

										{record.description && (
											<p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
												{highlightMatch(record.description, query)}
											</p>
										)}
									</div>
									{isSelected && (
										<div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-violet-400">
											<CornerDownLeft size={12} />
										</div>
									)}
								</button>
							);
						})
					)}
				</div>

				{/* Footer Bar */}
				<div className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 bg-white/[0.015] text-[11px] font-mono text-zinc-500">
					<div className="flex items-center gap-3">
						<span className="flex items-center gap-1">
							<kbd className="rounded bg-white/6 px-1.5 py-0.2 text-[10px] text-zinc-400">
								↑
							</kbd>
							<kbd className="rounded bg-white/6 px-1.5 py-0.2 text-[10px] text-zinc-400">
								↓
							</kbd>
							<span>to navigate</span>
						</span>
						<span className="flex items-center gap-1">
							<kbd className="rounded bg-white/6 px-1.5 py-0.2 text-[10px] text-zinc-400">
								↵
							</kbd>
							<span>to select</span>
						</span>
					</div>
					<span>
						{filteredResults.length > 0
							? `${filteredResults.length} matches`
							: `${searchIndex.length} indexed items`}
					</span>
				</div>
			</div>
		</div>
	);
}
