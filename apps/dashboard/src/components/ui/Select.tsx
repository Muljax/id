import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState, useId } from "react";

export interface SelectOption<T extends string | number = string | number> {
	value: T;
	label: string;
	description?: string;
	icon?: ReactNode;
	badge?: string;
}

export interface SelectProps<T extends string | number = string | number> {
	value: T | undefined;
	onChange: (value: T) => void;
	options: SelectOption<T>[];
	placeholder?: string;
	disabled?: boolean;
	hasError?: boolean;
	className?: string;
	id?: string;
	size?: "sm" | "md";
}

export default function Select<T extends string | number = string | number>({
	value,
	onChange,
	options,
	placeholder = "Select an option...",
	disabled = false,
	hasError = false,
	className = "",
	id,
	size = "md",
}: SelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const generatedId = useId();
	const selectId = id || generatedId;

	const selectedOption = options.find((opt) => opt.value === value);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (!isOpen) return;
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	function handleSelect(optionValue: T) {
		onChange(optionValue);
		setIsOpen(false);
	}

	return (
		<div ref={containerRef} className={`relative w-full ${className}`}>
			<button
				type="button"
				id={selectId}
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onClick={() => !disabled && setIsOpen((prev) => !prev)}
				className={`w-full rounded-xl border bg-zinc-900/60 text-left transition-all duration-150 outline-none flex items-center justify-between gap-2 cursor-pointer select-none ${
					size === "sm"
						? "px-3 py-2 text-xs"
						: "px-3.5 py-2.5 text-xs sm:text-sm"
				} ${
					hasError
						? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
						: isOpen
							? "border-violet-400/60 ring-2 ring-violet-500/15"
							: "border-white/10 hover:border-white/20 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/15"
				} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					{selectedOption?.icon && (
						<div className="shrink-0 text-violet-400">
							{selectedOption.icon}
						</div>
					)}
					{selectedOption ? (
						<span className="truncate font-medium text-zinc-100">
							{selectedOption.label}
						</span>
					) : (
						<span className="truncate text-zinc-500">{placeholder}</span>
					)}
					{selectedOption?.badge && (
						<span className="rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
							{selectedOption.badge}
						</span>
					)}
				</div>

				<ChevronDown
					size={15}
					className={`text-zinc-400 shrink-0 transition-transform duration-200 ${
						isOpen ? "rotate-180 text-violet-400" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<div
					role="listbox"
					aria-labelledby={selectId}
					className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-xl ring-1 ring-black/40 focus:outline-none"
				>
					{options.map((option) => {
						const isSelected = option.value === value;

						return (
							<button
								type="button"
								key={String(option.value)}
								role="option"
								aria-selected={isSelected}
								onClick={() => handleSelect(option.value)}
								className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
									size === "sm" ? "text-xs" : "text-xs sm:text-sm"
								} ${
									isSelected
										? "bg-violet-500/15 text-white font-medium"
										: "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
								}`}
							>
								<div className="flex items-center gap-2.5 min-w-0 flex-1">
									{option.icon && (
										<div
											className={`shrink-0 transition-colors ${
												isSelected
													? "text-violet-400"
													: "text-zinc-400 group-hover:text-violet-300"
											}`}
										>
											{option.icon}
										</div>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate">{option.label}</span>
											{option.badge && (
												<span className="rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
													{option.badge}
												</span>
											)}
										</div>
										{option.description && (
											<p className="text-[11px] text-zinc-400 font-normal truncate mt-0.5">
												{option.description}
											</p>
										)}
									</div>
								</div>

								{isSelected && (
									<Check size={14} className="text-violet-400 shrink-0" />
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
