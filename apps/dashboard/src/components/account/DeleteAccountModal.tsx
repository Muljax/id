import { Trash2 } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useStepUp } from "@/context/StepUpContext";
import { deleteAccount } from "@/lib/api/account";

interface DeleteAccountModalProps {
	open: boolean;
	onClose: () => void;
}

export default function DeleteAccountModal({
	open,
	onClose,
}: DeleteAccountModalProps) {
	const { user, logout } = useAuth();
	const toast = useToast();
	const { requireElevation } = useStepUp();
	const [password, setPassword] = useState("");

	async function handleDelete() {
		await requireElevation(() => deleteAccount(password || undefined));
		toast.success("Your account has been permanently deleted.");
		await logout();
	}

	return (
		<ConfirmModal
			open={open}
			onClose={onClose}
			onConfirm={handleDelete}
			title="Delete Account"
			description="Permanently delete your account and all associated data."
			confirmWord={user?.email}
			confirmButtonLabel="Permanently Delete Account"
			confirmButtonIcon={<Trash2 size={14} />}
			disabled={!password.trim()}
			warningMessage={
				<div>
					<strong>
						Warning: This action is permanent and cannot be undone.
					</strong>
					<p className="mt-1 text-red-300/80">
						Deleting your account will immediately revoke all active sessions,
						remove all registered passkeys and SSH keys, revoke OAuth
						authorizations, and delete your profile.
					</p>
				</div>
			}
		>
			<div className="space-y-1.5">
				<label
					htmlFor="confirm-password"
					className="block text-xs font-medium text-zinc-300"
				>
					Current password:
				</label>
				<Input
					id="confirm-password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Enter your current password"
					required
				/>
			</div>
		</ConfirmModal>
	);
}
