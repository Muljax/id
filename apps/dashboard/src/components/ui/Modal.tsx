import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	size?: "sm" | "md" | "lg" | "xl";
	children: ReactNode;
}

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
};

export default function Modal({
	open,
	title,
	description,
	onClose,
	size = "md",
	children,
}: ModalProps) {
	// Close on Escape key
	useEffect(() => {
		if (!open) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	// Lock body scroll
	useEffect(() => {
		if (!open) {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [open]);

	if (!open || typeof document === "undefined") {
		return null;
	}

	return createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Close modal"
				onClick={onClose}
				className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
			/>

			{/* Modal Dialog */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				className={`relative z-10 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-6 sm:p-7 text-white shadow-2xl shadow-black/80 backdrop-blur-xl ring-1 ring-white/5 transition-all`}
			>
				<div className="flex items-start justify-between gap-4 mb-6">
					<div className="min-w-0 flex-1">
						<h2
							id="modal-title"
							className="text-lg font-semibold tracking-tight text-white"
						>
							{title}
						</h2>

						{description && (
							<p className="mt-1 text-sm leading-relaxed text-zinc-400">
								{description}
							</p>
						)}
					</div>

					<button
						type="button"
						onClick={onClose}
						className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-colors"
						aria-label="Close modal"
					>
						<X size={16} />
					</button>
				</div>

				<div>{children}</div>
			</div>
		</div>,
		document.body,
	);
}
