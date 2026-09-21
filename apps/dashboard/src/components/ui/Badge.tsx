import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
	| "default"
	| "success"
	| "danger"
	| "warning"
	| "info"
	| "violet";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
	size?: "sm" | "md";
	children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
	default: "border-white/10 bg-white/[0.04] text-zinc-400",
	success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
	danger: "border-red-500/25 bg-red-500/10 text-red-400",
	warning: "border-amber-500/25 bg-amber-500/10 text-amber-400",
	info: "border-sky-500/25 bg-sky-500/10 text-sky-400",
	violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
};

const sizeStyles = {
	sm: "px-2 py-0.5 text-[11px] font-medium tracking-tight",
	md: "px-2.5 py-1 text-xs font-medium tracking-tight",
};

export default function Badge({
	variant = "default",
	size = "md",
	className = "",
	children,
	...props
}: BadgeProps) {
	return (
		<span
			{...props}
			className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
		>
			{children}
		</span>
	);
}
