import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps
	extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	hasError?: boolean;
}

export default function Textarea({
	className = "",
	hasError = false,
	rows = 3,
	...props
}: TextareaProps) {
	return (
		<textarea
			rows={rows}
			{...props}
			className={`w-full rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-y ${
				hasError
					? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
					: "border-white/10 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
			} ${className}`}
		/>
	);
}
