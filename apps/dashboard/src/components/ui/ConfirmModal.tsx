import { type ReactNode, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, {
	ModalErrorAlert,
	ModalWarningAlert,
} from "@/components/ui/Modal";

export interface ConfirmModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => Promise<void> | void;
	title: string;
	description?: string;
	warningMessage?: ReactNode;
	confirmWord?: string;
	confirmWordPrompt?: string;
	variant?: "danger" | "primary";
	cancelLabel?: string;
	confirmButtonLabel?: string;
	confirmButtonIcon?: ReactNode;
	disabled?: boolean;
	size?: "sm" | "md" | "lg" | "xl";
	children?: ReactNode;
}

/**
 * Reusable modal for destructive confirmations or explicit word-matching actions.
 */
export default function ConfirmModal({
	open,
	onClose,
	onConfirm,
	title,
	description,
	warningMessage,
	confirmWord,
	confirmWordPrompt,
	variant = "danger",
	cancelLabel = "Cancel",
	confirmButtonLabel = "Confirm",
	confirmButtonIcon,
	disabled = false,
	size = "md",
	children,
}: ConfirmModalProps) {
	const [inputWord, setInputWord] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isWordConfirmed =
		!confirmWord ||
		inputWord.trim().toLowerCase() === confirmWord.trim().toLowerCase();

	async function handleSubmit() {
		if (!isWordConfirmed || loading) return;
		setError(null);
		setLoading(true);

		try {
			await onConfirm();
			setInputWord("");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={title}
			description={description}
			size={size}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void handleSubmit();
				}}
				className="space-y-5"
			>
				{warningMessage && (
					<ModalWarningAlert
						variant={variant === "danger" ? "danger" : "warning"}
					>
						{warningMessage}
					</ModalWarningAlert>
				)}

				<ModalErrorAlert error={error} />

				{children}

				{confirmWord && (
					<div className="space-y-1.5">
						<label
							htmlFor="confirm-word-input"
							className="block text-xs font-medium text-zinc-300"
						>
							{confirmWordPrompt || (
								<>
									Type{" "}
									<span className="font-mono text-zinc-100">{confirmWord}</span>{" "}
									to confirm:
								</>
							)}
						</label>
						<Input
							id="confirm-word-input"
							value={inputWord}
							onChange={(e) => setInputWord(e.target.value)}
							placeholder={confirmWord}
							required
						/>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						disabled={loading}
						onClick={onClose}
					>
						{cancelLabel}
					</Button>
					<Button
						type="submit"
						variant={variant}
						loading={loading}
						disabled={disabled || !isWordConfirmed}
						icon={confirmButtonIcon}
					>
						{confirmButtonLabel}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
