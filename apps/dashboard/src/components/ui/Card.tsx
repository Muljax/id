import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "interactive";
}

export function Card({
	variant = "default",
	className = "",
	children,
	...props
}: CardProps) {
	return (
		<div
			{...props}
			className={`rounded-2xl border border-white/8 bg-zinc-900/40 backdrop-blur-sm shadow-xl shadow-black/20 ${
				variant === "interactive"
					? "transition-all duration-200 hover:border-white/15 hover:bg-zinc-900/60 hover:shadow-black/40"
					: ""
			} ${className}`}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			className={`border-b border-white/6 px-6 py-5 ${className}`}
		>
			{children}
		</div>
	);
}

export function CardTitle({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h2
			{...props}
			className={`text-base font-medium text-white tracking-tight ${className}`}
		>
			{children}
		</h2>
	);
}

export function CardDescription({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p {...props} className={`mt-1 text-sm text-zinc-400 ${className}`}>
			{children}
		</p>
	);
}

export function CardContent({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={`px-6 py-6 ${className}`}>
			{children}
		</div>
	);
}

export function CardFooter({
	className = "",
	children,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			className={`flex items-center justify-end gap-3 border-t border-white/6 bg-white/[0.015] px-6 py-4 ${className}`}
		>
			{children}
		</div>
	);
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
