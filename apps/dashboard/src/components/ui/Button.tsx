import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "@/components/ui/Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	loading?: boolean;
	icon?: ReactNode;
}

export default function Button({
	variant = "primary",
	size = "md",
	loading = false,
	icon,
	className = "",
	disabled,
	children,
	...props
}: ButtonProps) {
	const variants = {
		primary:
			"bg-white text-zinc-950 hover:bg-zinc-200 active:bg-zinc-300 disabled:bg-zinc-800 disabled:text-zinc-500 shadow-sm",
		secondary:
			"border border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:bg-white/[0.1] disabled:border-white/5 disabled:bg-transparent disabled:text-zinc-600",
		danger:
			"border border-red-500/25 bg-red-500/10 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 active:bg-red-500/25 disabled:opacity-40",
		ghost:
			"text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200 active:bg-white/[0.08] disabled:text-zinc-600 disabled:hover:bg-transparent",
	};

	const sizes = {
		sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
		md: "h-9.5 px-4 text-sm gap-2 rounded-xl",
		lg: "h-11 px-5 text-base gap-2.5 rounded-xl",
	};

	const spinnerSizes = {
		sm: "sm" as const,
		md: "sm" as const,
		lg: "md" as const,
	};

	return (
		<button
			{...props}
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${sizes[size]} ${variants[variant]} ${className}`}
		>
			{loading ? (
				<>
					<Spinner size={spinnerSizes[size]} />
					{children}
				</>
			) : (
				<>
					{icon && <span className="shrink-0">{icon}</span>}
					{children}
				</>
			)}
		</button>
	);
}
