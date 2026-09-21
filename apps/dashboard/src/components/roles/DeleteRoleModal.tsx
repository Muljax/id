import { useQueryClient } from "@tanstack/react-query";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { useStepUp } from "@/context/StepUpContext";
import { deleteRole, type Role } from "@/lib/api/rbac";
import { queryKeys } from "@/lib/queryKeys";

interface DeleteRoleModalProps {
	role: Role;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function DeleteRoleModal({
	role,
	onClose,
	onSuccess,
}: DeleteRoleModalProps) {
	const queryClient = useQueryClient();
	const { requireElevation } = useStepUp();

	async function handleDelete() {
		await requireElevation(() => deleteRole(role.id));
		void queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
		void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
		onSuccess?.();
	}

	return (
		<ConfirmModal
			open={true}
			onClose={onClose}
			onConfirm={handleDelete}
			title={`Delete role: ${role.name}`}
			description="This action cannot be undone."
			confirmButtonLabel="Delete role"
			cancelLabel="Cancel"
			warningMessage={
				<p>
					Are you sure you want to permanently delete the custom role{" "}
					<strong className="text-white font-semibold">{role.name}</strong>?
					Users assigned to this role will lose any permissions granted solely
					by it.
				</p>
			}
		/>
	);
}
