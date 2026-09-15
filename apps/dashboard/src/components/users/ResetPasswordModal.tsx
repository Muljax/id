import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { generatePasswordResetLink, type AdminUser } from "@/lib/api/admin";

interface ResetPasswordModalProps {
	user: AdminUser;
	onClose: () => void;
}

export default function ResetPasswordModal({
	user,
	onClose,
}: ResetPasswordModalProps) {
	const toast = useToast();
	const [generating, setGenerating] = useState(false);
	const [resetData, setResetData] = useState<{
		resetUrl: string;
		expiresAt: number;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	async function handleGenerate() {
		setGenerating(true);
		try {
			const res = await generatePasswordResetLink(user.id);
			setResetData({
				resetUrl: res.resetUrl,
				expiresAt: res.expiresAt,
			});
			toast.success("Password reset link generated");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to generate password reset link";
			toast.error(message);
		} finally {
			setGenerating(false);
		}
	}

	async function handleCopy() {
		if (!resetData?.resetUrl) return;
		try {
			await navigator.clipboard.writeText(resetData.resetUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Failed to copy link");
		}
	}

	return (
		<Modal
			open={true}
			title="Generate Password Reset Link"
			description={`Create a single-use reset link for ${user.displayName || user.email}.`}
			onClose={onClose}
		>
			<div className="space-y-5">
				{!resetData ? (
					<>
						<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 leading-relaxed">
							Generating a new link will automatically invalidate any previous
							reset tokens issued for this account. The link expires in 24
							hours.
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="secondary" onClick={onClose}>
								Cancel
							</Button>
							<Button
								type="button"
								loading={generating}
								onClick={() => void handleGenerate()}
								icon={<KeyRound size={14} />}
							>
								Generate Reset Link
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="space-y-2">
							<label
								htmlFor="one-time-reset-url"
								className="text-xs font-medium text-zinc-300"
							>
								One-time reset URL
							</label>
							<div className="flex items-center gap-2">
								<input
									id="one-time-reset-url"
									type="text"
									readOnly
									value={resetData.resetUrl}
									className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none select-all"
									onClick={(e) => (e.target as HTMLInputElement).select()}
								/>
								<Button
									type="button"
									variant={copied ? "primary" : "secondary"}
									size="sm"
									onClick={() => void handleCopy()}
									icon={copied ? <Check size={14} /> : <Copy size={14} />}
								>
									{copied ? "Copied" : "Copy"}
								</Button>
							</div>
						</div>

						<p className="text-[11px] text-zinc-500">
							This link is single-use and will expire on{" "}
							<span className="font-mono text-zinc-300">
								{new Date(resetData.expiresAt).toLocaleString()}
							</span>
							. Send this link directly to the user through a verified channel.
						</p>

						<div className="flex justify-end pt-2">
							<Button type="button" variant="secondary" onClick={onClose}>
								Done
							</Button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}
