import { ArrowUp, Compass } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export interface TocEntry {
	id: string;
	text: string;
	level: 2 | 3 | 4;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function PageTOC() {
	const { pathname } = useLocation();
	const [entries, setEntries] = useState<TocEntry[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Collect headings from the main article
	const scanHeadings = useCallback(() => {
		const article = document.querySelector("article");
		if (!article) {
			setEntries([]);
			return;
		}

		const headingElements = Array.from(
			article.querySelectorAll<HTMLHeadingElement>("h2, h3, h4"),
		);

		const seenIds = new Set<string>();
		const built: TocEntry[] = [];

		for (const el of headingElements) {
			const rawText = el.textContent?.trim().replace(/^#\s*/, "") ?? "";
			if (!rawText) continue;

			// Ensure element has an ID
			let id = el.id;
			if (!id) {
				id = slugify(rawText);
				let uniqueId = id;
				let count = 1;
				while (seenIds.has(uniqueId) || document.getElementById(uniqueId)) {
					uniqueId = `${id}-${count++}`;
				}
				id = uniqueId;
				el.id = id;
			}
			seenIds.add(id);

			let level: 2 | 3 | 4 = 2;
			if (el.tagName === "H3") level = 3;
			else if (el.tagName === "H4") level = 4;

			built.push({
				id,
				text: rawText,
				level,
			});
		}

		setEntries(built);
		if (built.length > 0 && !activeId) {
			setActiveId(built[0].id);
		}
	}, [activeId]);

	// Scan on pathname change and watch for DOM mutations (e.g. async MDX or component load)
	useEffect(() => {
		scanHeadings();

		// Check multiple frames in case of async rendering transitions
		const t1 = setTimeout(scanHeadings, 50);
		const t2 = setTimeout(scanHeadings, 200);
		const t3 = setTimeout(scanHeadings, 600);

		const article = document.querySelector("article");
		let mutationObserver: MutationObserver | null = null;
		if (article) {
			mutationObserver = new MutationObserver(() => {
				scanHeadings();
			});
			mutationObserver.observe(article, {
				childList: true,
				subtree: true,
			});
		}

		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
			clearTimeout(t3);
			mutationObserver?.disconnect();
		};
	}, [scanHeadings]);

	// Scroll spy with IntersectionObserver + scroll position fallback
	useEffect(() => {
		if (entries.length === 0) return;

		observerRef.current?.disconnect();

		const headingMap = new Map<Element, string>();
		const observer = new IntersectionObserver(
			(intersectingEntries) => {
				const visible = intersectingEntries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible.length > 0) {
					const targetId = headingMap.get(visible[0].target);
					if (targetId) {
						setActiveId(targetId);
					}
				}
			},
			{
				rootMargin: "-80px 0px -70% 0px",
				threshold: [0, 1],
			},
		);

		for (const entry of entries) {
			const el = document.getElementById(entry.id);
			if (el) {
				headingMap.set(el, entry.id);
				observer.observe(el);
			}
		}

		observerRef.current = observer;

		return () => {
			observer.disconnect();
		};
	}, [entries]);

	const handleScrollTo = (
		e: React.MouseEvent<HTMLAnchorElement>,
		id: string,
	) => {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;

		const navbarHeight = 72;
		const elementPosition = el.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

		window.scrollTo({
			top: offsetPosition,
			behavior: "smooth",
		});

		window.history.pushState(null, "", `#${id}`);
		setActiveId(id);
	};

	const handleScrollTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
		window.history.pushState(null, "", window.location.pathname);
		if (entries[0]) setActiveId(entries[0].id);
	};

	if (entries.length === 0) return null;

	return (
		<nav
			aria-label="Table of contents"
			className="text-xs select-none space-y-4"
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-2 text-zinc-400 pb-2.5 border-b border-white/6">
				<div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider font-semibold text-zinc-300">
					<Compass size={13} className="text-violet-400" />
					<span>On this page</span>
				</div>
				<span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.2 font-mono text-[10px] text-zinc-500">
					{entries.length}
				</span>
			</div>

			{/* Links Tree */}
			<div className="relative max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
				<ul className="space-y-1 relative border-l border-white/8 pl-3 list-none m-0 p-0">
					{entries.map(({ id, text, level }) => {
						const isActive = activeId === id;
						return (
							<li key={id} className="relative">
								{/* Active indicator line on the left border */}
								{isActive && (
									<span
										aria-hidden="true"
										className="absolute -left-[13px] top-1 bottom-1 w-[2px] rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
									/>
								)}
								<a
									href={`#${id}`}
									onClick={(e) => handleScrollTo(e, id)}
									className={[
										"group flex items-start py-1 transition-all duration-150 rounded leading-relaxed cursor-pointer",
										level === 3
											? "pl-3 text-[11px] text-zinc-400 hover:text-zinc-200"
											: level === 4
												? "pl-5 text-[10px] text-zinc-500 hover:text-zinc-300"
												: "text-xs",
										isActive
											? "text-violet-300 font-semibold translate-x-0.5"
											: "text-zinc-400 hover:text-zinc-200 hover:translate-x-0.5",
									].join(" ")}
								>
									<span className="line-clamp-2">{text}</span>
								</a>
							</li>
						);
					})}
				</ul>
			</div>

			{/* Scroll To Top Action */}
			<div className="pt-2 border-t border-white/6">
				<button
					type="button"
					onClick={handleScrollTop}
					className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 hover:text-violet-300 transition-colors cursor-pointer group"
				>
					<ArrowUp
						size={12}
						className="transition-transform group-hover:-translate-y-0.5 text-zinc-400 group-hover:text-violet-400"
					/>
					<span>Back to top</span>
				</button>
			</div>
		</nav>
	);
}

export function MobileTOC() {
	const { pathname } = useLocation();
	const [entries, setEntries] = useState<TocEntry[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const update = () => {
			const article = document.querySelector("article");
			if (!article) {
				setEntries([]);
				return;
			}
			const headingElements = Array.from(
				article.querySelectorAll<HTMLHeadingElement>("h2, h3, h4"),
			);
			const built: TocEntry[] = headingElements
				.map((el) => ({
					id: el.id,
					text: el.textContent?.trim().replace(/^#\s*/, "") ?? "",
					level: (el.tagName === "H3" ? 3 : el.tagName === "H4" ? 4 : 2) as
						| 2
						| 3
						| 4,
				}))
				.filter((e) => Boolean(e.text && e.id));
			setEntries(built);
		};

		update();
		const t = setTimeout(update, 200);
		return () => clearTimeout(t);
	}, []);

	if (entries.length === 0) return null;

	const handleScrollTo = (
		e: React.MouseEvent<HTMLAnchorElement>,
		id: string,
	) => {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;

		const navbarHeight = 72;
		const elementPosition = el.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

		window.scrollTo({
			top: offsetPosition,
			behavior: "smooth",
		});

		window.history.pushState(null, "", `#${id}`);
		setIsOpen(false);
	};

	return (
		<div className="xl:hidden my-4 rounded-xl border border-white/8 bg-zinc-900/50 backdrop-blur-sm overflow-hidden not-prose">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.02] transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-2 font-mono text-[11px] font-medium text-zinc-300">
					<Compass size={13} className="text-violet-400" />
					<span>On this page</span>
					<span className="rounded-full bg-white/6 px-1.5 py-0.2 text-[10px] text-zinc-400">
						{entries.length}
					</span>
				</div>
				<span className="text-[11px] text-violet-400">
					{isOpen ? "Hide" : "Jump to..."}
				</span>
			</button>

			{isOpen && (
				<div className="border-t border-white/6 p-3 max-h-60 overflow-y-auto bg-zinc-950/40">
					<ul className="space-y-1 relative pl-2 list-none m-0 p-0">
						{entries.map(({ id, text, level }) => (
							<li key={id}>
								<a
									href={`#${id}`}
									onClick={(e) => handleScrollTo(e, id)}
									className={[
										"block py-1 text-xs text-zinc-400 hover:text-violet-300 transition-colors",
										level === 3
											? "pl-3 text-[11px]"
											: level === 4
												? "pl-5 text-[10px]"
												: "",
									].join(" ")}
								>
									{text}
								</a>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
