import { Trash2 } from "lucide-react";

import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useStepUp } from "@/context/StepUpContext";
import { deleteUser, type AdminUser } from "@/lib/api/admin";

interface DeleteUserModalProps {
	user: AdminUser;
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function DeleteUserModal({
	user,
	open,
	onClose,
	onSuccess,
}: DeleteUserModalProps) {
	const toast = useToast();
	const { requireElevation } = useStepUp();

	async function handleDelete() {
		await requireElevation(() => deleteUser(user.id));
		toast.success(`User ${user.email} was permanently deleted.`);
		onSuccess();
	}

	return (
		<ConfirmModal
			open={open}
			onClose={onClose}
			onConfirm={handleDelete}
			title="Delete User Account"
			description={`Permanently delete user account for ${user.displayName || user.email}.`}
			confirmWord={user.email}
			confirmButtonLabel="Permanently Delete User"
			confirmButtonIcon={<Trash2 size={14} />}
			warningMessage={
				<div>
					<strong>Warning: This action is permanent and irreversible.</strong>
					<p className="mt-1 text-red-300/80">
						Deleting this user will immediately purge their credentials, revoke
						active sessions, revoke SSH certificates, remove OAuth
						authorizations, and delete all associated records.
					</p>
				</div>
			}
		/>
	);
}
