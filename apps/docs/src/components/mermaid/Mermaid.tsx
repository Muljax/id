import {
	AlertCircle,
	Check,
	Copy,
	Loader2,
	Maximize2,
	Workflow,
} from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { MermaidModal } from "./MermaidModal";

let mermaidPromise: Promise<typeof import("mermaid")> | null = null;

async function getMermaid() {
	if (!mermaidPromise) {
		mermaidPromise = import("mermaid").then((m) => {
			m.default.initialize({
				startOnLoad: false,
				theme: "base",
				securityLevel: "loose",
				fontFamily: "Inter, system-ui, -apple-system, sans-serif",
				themeVariables: {
					darkMode: true,
					background: "transparent",
					mainBkg: "#141417",
					nodeBorder: "#3f3f46",
					defaultLinkColor: "#a1a1aa",
					titleColor: "#f4f4f5",
					edgeLabelBackground: "#18181b",

					// Primary nodes (violet theme)
					primaryColor: "#2e1065",
					primaryTextColor: "#f4f4f5",
					primaryBorderColor: "#7c3aed",

					// Secondary nodes
					secondaryColor: "#18181b",
					secondaryTextColor: "#e4e4e7",
					secondaryBorderColor: "#3f3f46",

					// Tertiary / Subgraphs
					tertiaryColor: "#0f0f12",
					tertiaryTextColor: "#d4d4d8",
					tertiaryBorderColor: "#27272a",

					// Clusters
					clusterBkg: "rgba(24, 24, 27, 0.6)",
					clusterBorder: "rgba(255, 255, 255, 0.1)",

					// Sequence diagram
					actorBkg: "#18181b",
					actorBorder: "#6d28d9",
					actorTextColor: "#f4f4f5",
					actorLineColor: "#52525b",
					signalColor: "#a1a1aa",
					signalTextColor: "#f4f4f5",
					labelBoxBkgColor: "#18181b",
					labelBoxBorderColor: "#3f3f46",
					labelTextColor: "#f4f4f5",
					loopTextColor: "#f4f4f5",
					noteBorderColor: "#7c3aed",
					noteBkgColor: "#1e1338",
					noteTextColor: "#e9d5ff",

					// State diagram
					labelColor: "#f4f4f5",
					altBackground: "#18181b",

					// Flowchart
					lineColor: "#a1a1aa",

					fontSize: "13px",
				},
			});
			return m;
		});
	}
	const m = await mermaidPromise;
	return m.default;
}

function detectChartType(chart: string): string {
	const trimmed = chart.trim().toLowerCase();
	if (trimmed.startsWith("flowchart") || trimmed.startsWith("graph"))
		return "Flowchart";
	if (trimmed.startsWith("sequencediagram")) return "Sequence Diagram";
	if (trimmed.startsWith("classdiagram")) return "Class Diagram";
	if (trimmed.startsWith("statediagram")) return "State Diagram";
	if (trimmed.startsWith("erdiagram")) return "ER Diagram";
	if (trimmed.startsWith("gitgraph")) return "Git Graph";
	if (trimmed.startsWith("journey")) return "User Journey";
	if (trimmed.startsWith("gantt")) return "Gantt Chart";
	if (trimmed.startsWith("pie")) return "Pie Chart";
	if (trimmed.startsWith("mindmap")) return "Mindmap";
	if (trimmed.startsWith("quadrantchart")) return "Quadrant Chart";
	return "Architecture Diagram";
}

export interface MermaidProps {
	chart: string;
	title?: string;
}

export function Mermaid({ chart, title }: MermaidProps) {
	const rawId = useId();
	const containerId = useMemo(
		() => `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
		[rawId],
	);

	const [svg, setSvg] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const chartType = useMemo(() => detectChartType(chart), [chart]);

	useEffect(() => {
		let isMounted = true;

		const renderChart = async () => {
			setLoading(true);
			setError(null);

			try {
				const mermaidInstance = await getMermaid();
				const { svg: renderedSvg } = await mermaidInstance.render(
					`${containerId}-render`,
					chart.trim(),
				);
				if (isMounted) {
					setSvg(renderedSvg);
					setLoading(false);
				}
			} catch (err: unknown) {
				console.error("Mermaid render failure:", err);
				if (isMounted) {
					setError(
						err instanceof Error ? err.message : "Failed to render diagram",
					);
					setLoading(false);
				}
			}
		};

		renderChart();

		return () => {
			isMounted = false;
			const orphan = document.getElementById(`${containerId}-render`);
			if (orphan) orphan.remove();
		};
	}, [chart, containerId]);

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(chart.trim());
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy chart source", err);
		}
	};

	const handleOpenModal = () => {
		if (svg && !error) {
			setIsModalOpen(true);
		}
	};

	return (
		<>
			<div className="group relative my-6 rounded-2xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden not-prose transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40">
				{/* Top Card Header */}
				<div className="flex items-center justify-between border-b border-white/6 bg-white/[0.015] px-4 py-2.5">
					{/* Type / Title Badge */}
					<div className="flex items-center gap-2.5">
						<div className="flex size-6 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-400">
							<Workflow size={13} />
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-white tracking-tight">
								{title || chartType}
							</span>
							{title && (
								<span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
									{chartType}
								</span>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-1.5">
						{/* Copy Source */}
						<button
							type="button"
							onClick={handleCopy}
							title="Copy Mermaid Code"
							className="flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/[0.02] text-zinc-400 hover:bg-white/10 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							{copied ? (
								<Check size={13} className="text-emerald-400" />
							) : (
								<Copy size={13} />
							)}
						</button>

						{/* Expand to Popup / Zoom View */}
						<button
							type="button"
							onClick={handleOpenModal}
							disabled={!svg || !!error}
							title="Expand & Navigate Diagram"
							className="flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Maximize2 size={12} />
							<span className="text-[11px]">Inspect</span>
						</button>
					</div>
				</div>

				{/* Diagram Display Container */}
				<button
					type="button"
					onClick={handleOpenModal}
					disabled={!svg || !!error}
					className={`relative flex min-h-[140px] w-full items-center justify-center overflow-x-auto p-6 transition-colors bg-transparent border-0 text-inherit ${
						svg && !error
							? "cursor-pointer group-hover:bg-white/[0.01]"
							: "cursor-default"
					}`}
				>
					{loading && (
						<div className="flex items-center gap-2.5 py-8 text-xs text-zinc-400">
							<Loader2 size={16} className="animate-spin text-violet-400" />
							<span>Rendering diagram...</span>
						</div>
					)}

					{error && (
						<div className="flex w-full flex-col gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs text-red-300 text-left">
							<div className="flex items-center gap-2 font-medium text-red-400">
								<AlertCircle size={15} />
								<span>Mermaid syntax error</span>
							</div>
							<pre className="max-h-32 overflow-auto rounded-lg bg-black/40 p-2.5 font-mono text-[11px] text-zinc-400">
								{error}
							</pre>
						</div>
					)}

					{!loading && !error && svg && (
						<>
							<div
								className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:filter [&>svg]:drop-shadow-lg"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized SVG generated by Mermaid
								dangerouslySetInnerHTML={{ __html: svg }}
							/>

							{/* Hover inspection pill overlay */}
							<div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-950/80 px-2 py-1 text-[10px] font-medium text-zinc-400 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 shadow-lg">
								<Maximize2 size={10} className="text-violet-400" />
								<span>Click to zoom & pan</span>
							</div>
						</>
					)}
				</button>
			</div>

			{/* Fullscreen Pan/Zoom Modal */}
			<MermaidModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				svgContent={svg}
				chartType={chartType}
				title={title}
				rawChart={chart.trim()}
			/>
		</>
	);
}
