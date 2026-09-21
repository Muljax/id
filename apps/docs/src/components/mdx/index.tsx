import {
	AlertCircle,
	AlertTriangle,
	Award,
	CheckCircle2,
	Cloud,
	Cpu,
	Database,
	FileCode,
	FileJson,
	Fingerprint,
	Info,
	Key,
	Lock,
	Rocket,
	Server,
	Settings,
	Shield,
	ShieldCheck,
	Terminal,
	Users,
	Zap,
} from "lucide-react";
import React, { useState } from "react";

import { lazy, Suspense } from "react";

const LazyEndpointCard = lazy(() =>
	import("../openapi/EndpointCard").then((m) => ({ default: m.EndpointCard })),
);
export function EndpointCard(
	props: React.ComponentProps<typeof LazyEndpointCard>,
) {
	return (
		<Suspense
			fallback={
				<div className="my-8 h-48 rounded-2xl border border-white/8 bg-zinc-900/40 animate-pulse" />
			}
		>
			<LazyEndpointCard {...props} />
		</Suspense>
	);
}

const LazyOpenApiEndpoint = lazy(() =>
	import("../openapi/OpenApiEndpoint").then((m) => ({
		default: m.OpenApiEndpoint,
	})),
);
export function OpenApiEndpoint(
	props: React.ComponentProps<typeof LazyOpenApiEndpoint>,
) {
	return (
		<Suspense
			fallback={
				<div className="my-8 h-48 rounded-2xl border border-white/8 bg-zinc-900/40 animate-pulse" />
			}
		>
			<LazyOpenApiEndpoint {...props} />
		</Suspense>
	);
}

const LazyMermaid = lazy(() =>
	import("../mermaid/Mermaid").then((m) => ({ default: m.Mermaid })),
);
export function Mermaid(props: React.ComponentProps<typeof LazyMermaid>) {
	return (
		<Suspense
			fallback={
				<div className="my-6 h-36 rounded-2xl border border-white/8 bg-zinc-900/40 animate-pulse" />
			}
		>
			<LazyMermaid {...props} />
		</Suspense>
	);
}

const LazyDatabaseTable = lazy(() =>
	import("../schema/DatabaseTable").then((m) => ({ default: m.DatabaseTable })),
);
export function DatabaseTable(
	props: React.ComponentProps<typeof LazyDatabaseTable>,
) {
	return (
		<Suspense
			fallback={
				<div className="my-6 h-48 rounded-2xl border border-white/8 bg-zinc-900/40 animate-pulse" />
			}
		>
			<LazyDatabaseTable {...props} />
		</Suspense>
	);
}
export const SchemaTable = DatabaseTable;

const LazyDatabaseDiagram = lazy(() =>
	import("../schema/DatabaseDiagram").then((m) => ({
		default: m.DatabaseDiagram,
	})),
);
export function DatabaseDiagram(
	props: React.ComponentProps<typeof LazyDatabaseDiagram>,
) {
	return (
		<Suspense
			fallback={
				<div className="my-6 h-64 rounded-2xl border border-white/8 bg-zinc-900/40 animate-pulse" />
			}
		>
			<LazyDatabaseDiagram {...props} />
		</Suspense>
	);
}

const CARD_ICON_MAP: Record<
	string,
	React.ComponentType<{ size?: number; className?: string }>
> = {
	rocket: Rocket,
	setting: Settings,
	settings: Settings,
	cloudflare: Cloud,
	cloud: Cloud,
	shell: Terminal,
	terminal: Terminal,
	lock: Lock,
	padlock: Lock,
	license: Award,
	certificate: Award,
	json: FileJson,
	code: FileJson,
	"list-format": Users,
	list: Users,
	rbac: Users,
	key: Key,
	shield: Shield,
	"shield-check": ShieldCheck,
	database: Database,
	server: Server,
	cpu: Cpu,
	fingerprint: Fingerprint,
	passkey: Fingerprint,
};

function renderCardIcon(icon: string) {
	const key = (icon.includes(":") ? icon.split(":")[1] : icon)
		.toLowerCase()
		.trim();
	const IconComponent = CARD_ICON_MAP[key] ?? Zap;
	return <IconComponent size={16} className="text-violet-300" />;
}

export function Card({
	title,
	icon,
	children,
}: {
	title: string;
	icon?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="group relative my-5 rounded-2xl border border-white/8 bg-zinc-900/40 p-6 backdrop-blur-sm shadow-xl shadow-black/20 transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40">
			<div className="flex items-center gap-3">
				{icon && (
					<div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 shadow-sm">
						{renderCardIcon(icon)}
					</div>
				)}
				<h3 className="text-base font-medium tracking-tight text-white m-0">
					{title}
				</h3>
			</div>
			{children && (
				<div className="mt-3 text-sm text-zinc-400 leading-relaxed [&>p]:my-1">
					{children}
				</div>
			)}
		</div>
	);
}

export function CardGrid({
	children,
	stagger,
}: {
	children?: React.ReactNode;
	stagger?: boolean;
}) {
	return (
		<div
			className={`my-6 grid grid-cols-1 gap-4 sm:grid-cols-2 ${
				stagger ? "lg:grid-cols-2" : ""
			}`}
		>
			{children}
		</div>
	);
}

export function Steps({ children }: { children?: React.ReactNode }) {
	return (
		<div className="my-8 relative pl-6 border-l border-white/8 space-y-6 [&>ol]:list-none [&>ol]:pl-0 [&>ol]:space-y-6 [&>ol>li]:relative [&>ol>li]:pl-2">
			{children}
		</div>
	);
}

export function Badge({
	text,
	variant = "default",
	size = "sm",
}: {
	text?: string;
	variant?:
		| "note"
		| "tip"
		| "caution"
		| "danger"
		| "success"
		| "violet"
		| "default";
	size?: "sm" | "md";
}) {
	const variantStyles: Record<string, string> = {
		default: "border-white/10 bg-white/[0.04] text-zinc-400",
		success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		tip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
		danger: "border-red-500/25 bg-red-500/10 text-red-400",
		caution: "border-amber-500/25 bg-amber-500/10 text-amber-400",
		warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
		note: "border-violet-500/25 bg-violet-500/10 text-violet-300",
		info: "border-sky-500/25 bg-sky-500/10 text-sky-400",
		violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
	};

	const sizeStyles = {
		sm: "px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
		md: "px-3 py-1 text-xs font-medium tracking-tight",
	};

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm select-none ${
				sizeStyles[size] || sizeStyles.sm
			} ${variantStyles[variant] || variantStyles.default}`}
		>
			{text}
		</span>
	);
}

export function FileTree({ children }: { children?: React.ReactNode }) {
	return (
		<div className="my-6 rounded-2xl border border-white/8 bg-zinc-900/40 p-5 font-mono text-xs text-zinc-300 backdrop-blur-sm shadow-xl shadow-black/20 overflow-x-auto">
			<div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/6 text-zinc-500 text-[11px] uppercase tracking-wider font-mono font-medium">
				<FileCode size={14} className="text-violet-400" />
				<span>Files & Directories</span>
			</div>
			<div className="leading-relaxed">{children}</div>
		</div>
	);
}

interface TabItemProps {
	label: string;
	icon?: string;
	children?: React.ReactNode;
}

export function TabItem({ children }: TabItemProps) {
	return <div>{children}</div>;
}

export function Tabs({ children }: { children?: React.ReactNode }) {
	const validChildren = React.Children.toArray(children).filter(
		React.isValidElement,
	) as React.ReactElement<TabItemProps>[];

	const [activeIndex, setActiveIndex] = useState(0);

	if (validChildren.length === 0) return null;

	return (
		<div className="my-6 rounded-2xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden">
			<div className="flex border-b border-white/6 bg-white/[0.015] px-3 pt-3 gap-1 overflow-x-auto">
				{validChildren.map((child, idx) => {
					const isActive = idx === activeIndex;
					return (
						<button
							key={child.props.label || idx}
							type="button"
							onClick={() => setActiveIndex(idx)}
							className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-xl transition-all duration-150 border-t border-x cursor-pointer whitespace-nowrap ${
								isActive
									? "bg-zinc-950 text-violet-300 border-white/10 -mb-px font-semibold shadow-sm"
									: "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/[0.03]"
							}`}
						>
							{child.props.label}
						</button>
					);
				})}
			</div>
			<div className="p-6">{validChildren[activeIndex]?.props.children}</div>
		</div>
	);
}

export function Callout({
	type = "note",
	title,
	children,
}: {
	type?: "note" | "tip" | "caution" | "danger" | "warning" | "info";
	title?: string;
	children?: React.ReactNode;
}) {
	const borderStyles: Record<string, string> = {
		note: "border-violet-500/30 bg-violet-500/[0.06] text-violet-200",
		info: "border-sky-500/30 bg-sky-500/[0.06] text-sky-200",
		tip: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200",
		caution: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200",
		warning: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200",
		danger: "border-red-500/30 bg-red-500/[0.06] text-red-200",
	};

	const titleColors: Record<string, string> = {
		note: "text-violet-400",
		info: "text-sky-400",
		tip: "text-emerald-400",
		caution: "text-amber-400",
		warning: "text-amber-400",
		danger: "text-red-400",
	};

	const iconMap = {
		note: <Info size={16} className="text-violet-400 shrink-0" />,
		info: <Info size={16} className="text-sky-400 shrink-0" />,
		tip: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
		caution: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
		warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
		danger: <AlertCircle size={16} className="text-red-400 shrink-0" />,
	};

	return (
		<aside
			className={`my-6 rounded-2xl border p-5 shadow-xl shadow-black/20 backdrop-blur-sm not-prose ${
				borderStyles[type] || borderStyles.note
			}`}
		>
			<div
				className={`flex items-center gap-2 font-medium text-sm mb-2 ${
					titleColors[type] || titleColors.note
				}`}
			>
				{iconMap[type] || iconMap.note}
				<span>{title || type.toUpperCase()}</span>
			</div>
			<div className="text-sm text-zinc-300 leading-relaxed [&>p]:my-1.5 [&>pre]:my-2">
				{children}
			</div>
		</aside>
	);
}
