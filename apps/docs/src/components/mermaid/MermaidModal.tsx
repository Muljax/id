import {
	Check,
	Copy,
	Download,
	Maximize2,
	RotateCcw,
	Workflow,
	X,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface MermaidModalProps {
	isOpen: boolean;
	onClose: () => void;
	svgContent: string;
	chartType: string;
	title?: string;
	rawChart: string;
}

export function MermaidModal({
	isOpen,
	onClose,
	svgContent,
	chartType,
	title,
	rawChart,
}: MermaidModalProps) {
	const [scale, setScale] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [copied, setCopied] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({
		x: 0,
		y: 0,
	});

	const handleZoomIn = useCallback(() => {
		setScale((prev) => Math.min(prev * 1.25, 6));
	}, []);

	const handleZoomOut = useCallback(() => {
		setScale((prev) => Math.max(prev / 1.25, 0.2));
	}, []);

	const handleReset = useCallback(() => {
		setScale(1);
		setPan({ x: 0, y: 0 });
	}, []);

	// Reset view state when opened
	useEffect(() => {
		if (isOpen) {
			setScale(1);
			setPan({ x: 0, y: 0 });
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Global mouseup and keyboard listener
	useEffect(() => {
		if (!isOpen) return;

		const handleGlobalMouseUp = () => {
			setIsDragging(false);
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			} else if (e.key === "+" || e.key === "=") {
				handleZoomIn();
			} else if (e.key === "-" || e.key === "_") {
				handleZoomOut();
			} else if (e.key === "0") {
				handleReset();
			}
		};

		window.addEventListener("mouseup", handleGlobalMouseUp);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("mouseup", handleGlobalMouseUp);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

	const handleFit = () => {
		if (!containerRef.current || !contentRef.current) return;
		const container = containerRef.current.getBoundingClientRect();
		const svgEl = contentRef.current.querySelector("svg");
		if (!svgEl) return;

		const svgBox = svgEl.getBoundingClientRect();
		const unscaledWidth = svgBox.width / scale;
		const unscaledHeight = svgBox.height / scale;

		const scaleX = (container.width - 96) / unscaledWidth;
		const scaleY = (container.height - 96) / unscaledHeight;
		const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 3);

		setScale(newScale);
		setPan({ x: 0, y: 0 });
	};

	// Mouse Pan Handlers
	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		setIsDragging(true);
		setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		setPan({
			x: e.clientX - dragStart.x,
			y: e.clientY - dragStart.y,
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Mouse Wheel Zoom
	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
		setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.2), 6));
	};

	// Touch Pan & Pinch Zoom Handlers
	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 1 && e.touches[0]) {
			setIsDragging(true);
			touchStartRef.current = {
				x: e.touches[0].clientX - pan.x,
				y: e.touches[0].clientY - pan.y,
			};
		} else if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			touchStartRef.current.dist = Math.hypot(dx, dy);
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 1 && e.touches[0] && isDragging) {
			setPan({
				x: e.touches[0].clientX - touchStartRef.current.x,
				y: e.touches[0].clientY - touchStartRef.current.y,
			});
		} else if (
			e.touches.length === 2 &&
			e.touches[0] &&
			e.touches[1] &&
			touchStartRef.current.dist
		) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const currentDist = Math.hypot(dx, dy);
			const ratio = currentDist / touchStartRef.current.dist;
			setScale((prev) =>
				Math.min(Math.max(prev * (1 + (ratio - 1) * 0.5), 0.2), 6),
			);
			touchStartRef.current.dist = currentDist;
		}
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
		touchStartRef.current.dist = undefined;
	};

	// Copy raw chart source
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(rawChart);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy chart", err);
		}
	};

	// Download SVG file
	const handleDownloadSvg = () => {
		const blob = new Blob([svgContent], {
			type: "image/svg+xml;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${(title || chartType || "diagram")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
			{/* Header Navigation Bar */}
			<div className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-zinc-950/80 px-6 backdrop-blur-md">
				{/* Title & Type */}
				<div className="flex items-center gap-3">
					<div className="flex size-7 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-400 shadow-sm shadow-violet-500/10">
						<Workflow size={14} />
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-white tracking-tight">
							{title || "Diagram Navigator"}
						</span>
						<span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
							{chartType}
						</span>
					</div>
				</div>

				{/* Toolbar Actions */}
				<div className="flex items-center gap-2">
					{/* Zoom Controls Segment */}
					<div className="flex items-center rounded-xl border border-white/8 bg-zinc-900/60 p-1 shadow-sm">
						<button
							type="button"
							onClick={handleZoomOut}
							title="Zoom Out (-)"
							className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							<ZoomOut size={14} />
						</button>
						<span className="min-w-12 text-center font-mono text-[11px] font-medium text-zinc-300">
							{Math.round(scale * 100)}%
						</span>
						<button
							type="button"
							onClick={handleZoomIn}
							title="Zoom In (+)"
							className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							<ZoomIn size={14} />
						</button>
						<div className="mx-1 h-3.5 w-px bg-white/10" />
						<button
							type="button"
							onClick={handleReset}
							title="Reset View (0)"
							className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							<RotateCcw size={13} />
						</button>
						<button
							type="button"
							onClick={handleFit}
							title="Fit to Screen"
							className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors cursor-pointer"
						>
							<Maximize2 size={13} />
						</button>
					</div>

					<div className="h-4 w-px bg-white/10 mx-1" />

					{/* Copy Source */}
					<button
						type="button"
						onClick={handleCopy}
						title="Copy Mermaid Code"
						className="flex h-8 items-center gap-1.5 rounded-xl border border-white/8 bg-zinc-900/60 px-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
					>
						{copied ? (
							<>
								<Check size={13} className="text-emerald-400" />
								<span className="text-emerald-400 font-medium">Copied</span>
							</>
						) : (
							<>
								<Copy size={13} />
								<span>Copy Source</span>
							</>
						)}
					</button>

					{/* Download SVG */}
					<button
						type="button"
						onClick={handleDownloadSvg}
						title="Download SVG"
						className="flex size-8 items-center justify-center rounded-xl border border-white/8 bg-zinc-900/60 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors cursor-pointer"
					>
						<Download size={14} />
					</button>

					{/* Close Button */}
					<button
						type="button"
						onClick={onClose}
						title="Close (Esc)"
						className="flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-colors cursor-pointer ml-1"
					>
						<X size={15} />
					</button>
				</div>
			</div>

			{/* Canvas Body */}
			<div
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onWheel={handleWheel}
				onDoubleClick={handleReset}
				className={`relative flex-1 overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] ${
					isDragging ? "cursor-grabbing" : "cursor-grab"
				}`}
			>
				{/* Diagram Surface */}
				<div
					ref={contentRef}
					style={{
						transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
						transformOrigin: "center center",
						transition: isDragging ? "none" : "transform 0.1s ease-out",
					}}
					className="absolute inset-0 flex items-center justify-center pointer-events-none p-12 [&>svg]:max-w-none [&>svg]:h-auto [&>svg]:filter [&>svg]:drop-shadow-2xl"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized SVG generated by Mermaid
					dangerouslySetInnerHTML={{ __html: svgContent }}
				/>

				{/* Floating Helper Pill */}
				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/8 bg-zinc-900/80 px-4 py-1.5 text-[11px] font-medium text-zinc-400 backdrop-blur-md shadow-xl pointer-events-none flex items-center gap-2">
					<span className="inline-block size-1.5 rounded-full bg-violet-400 animate-pulse" />
					<span>Drag to pan • Scroll to zoom • Double-click to reset</span>
				</div>
			</div>
		</div>,
		document.body,
	);
}
