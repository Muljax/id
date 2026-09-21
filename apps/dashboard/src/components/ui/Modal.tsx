import { AlertTriangle, X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export interface ModalProps {
	open: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	onSubmit?: () => void;
	autoFocus?: boolean;
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
	onSubmit,
	autoFocus = true,
	size = "md",
	children,
}: ModalProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Auto-focus the first non-disabled, editable field when the modal opens
	useEffect(() => {
		if (!open || !autoFocus) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			if (!dialogRef.current) {
				return;
			}

			// Prioritize explicit autofocus attribute or find first non-disabled editable input/textarea/select
			const target = dialogRef.current.querySelector<HTMLElement>(
				'[autoFocus], [data-autofocus], input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])',
			);

			if (target && typeof target.focus === "function") {
				target.focus();
			}
		});

		return () => {
			cancelAnimationFrame(frame);
		};
	}, [open, autoFocus]);

	// Handle Escape to close and Enter to submit
	useEffect(() => {
		if (!open) {
			return;
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				onClose();
				return;
			}

			if (event.key === "Enter" && !event.isComposing) {
				const activeElement = document.activeElement as HTMLElement | null;

				// Allow normal Enter behavior inside multi-line textareas and editable fields
				if (
					activeElement &&
					(activeElement.tagName === "TEXTAREA" ||
						activeElement.isContentEditable)
				) {
					return;
				}

				// If an explicit secondary/ghost button or close button is focused, allow standard activation
				if (
					activeElement &&
					activeElement.tagName === "BUTTON" &&
					activeElement.getAttribute("type") !== "submit" &&
					!activeElement.matches('[data-modal-submit="true"]')
				) {
					return;
				}

				if (onSubmit) {
					event.preventDefault();
					onSubmit();
					return;
				}

				if (dialogRef.current) {
					const form = dialogRef.current.querySelector("form");
					if (form) {
						event.preventDefault();
						if (typeof form.requestSubmit === "function") {
							form.requestSubmit();
						} else {
							form.dispatchEvent(
								new Event("submit", { cancelable: true, bubbles: true }),
							);
						}
						return;
					}

					const submitButton =
						dialogRef.current.querySelector<HTMLButtonElement>(
							'button[type="submit"], button[data-modal-submit="true"], button[data-variant="primary"], button[data-variant="danger"]',
						);

					if (submitButton && !submitButton.disabled) {
						event.preventDefault();
						submitButton.click();
					}
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose, onSubmit]);

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
				ref={dialogRef}
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

export function ModalFooter({
	onCancel,
	cancelLabel = "Cancel",
	submitLabel = "Save",
	submitVariant = "primary",
	submitIcon,
	loading = false,
	disabled = false,
	className = "",
}: {
	onCancel?: () => void;
	cancelLabel?: string;
	submitLabel?: string;
	submitVariant?: "primary" | "secondary" | "danger";
	submitIcon?: ReactNode;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
}) {
	return (
		<div
			className={`flex items-center justify-end gap-3 border-t border-white/8 pt-4 ${className}`}
		>
			{onCancel && (
				<Button
					type="button"
					variant="ghost"
					onClick={onCancel}
					disabled={loading}
				>
					{cancelLabel}
				</Button>
			)}
			{submitLabel ? (
				<Button
					type="submit"
					variant={submitVariant}
					loading={loading}
					disabled={disabled}
					icon={submitIcon}
				>
					{submitLabel}
				</Button>
			) : null}
		</div>
	);
}

export function ModalErrorAlert({ error }: { error?: string | null }) {
	if (!error) return null;
	return (
		<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
			{error}
		</div>
	);
}

export function ModalWarningAlert({
	title,
	children,
	variant = "danger",
}: {
	title?: string;
	children: ReactNode;
	variant?: "danger" | "warning";
}) {
	const isDanger = variant === "danger";
	return (
		<div
			className={`rounded-xl border p-4 text-xs leading-relaxed flex items-start gap-2.5 ${
				isDanger
					? "border-red-500/20 bg-red-500/10 text-red-200/90"
					: "border-amber-500/20 bg-amber-500/10 text-amber-200/90"
			}`}
		>
			<AlertTriangle
				size={16}
				className={`shrink-0 mt-0.5 ${
					isDanger ? "text-red-400" : "text-amber-400"
				}`}
			/>
			<div>
				{title && <strong>{title}</strong>}
				{typeof children === "string" ? (
					<p className="mt-1">{children}</p>
				) : (
					children
				)}
			</div>
		</div>
	);
}
