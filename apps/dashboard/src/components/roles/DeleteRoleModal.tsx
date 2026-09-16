import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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
	const [error, setError] = useState<string | null>(null);

	const deleteMutation = useMutation({
		mutationFn: () => deleteRole(role.id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
			onSuccess?.();
			onClose();
		},
		onError: (err: Error) => {
			setError(err.message || "Failed to delete role.");
		},
	});

	return (
		<Modal
			open={true}
			onClose={onClose}
			title={`Delete role: ${role.name}`}
			description="This action cannot be undone."
			size="md"
		>
			<div className="space-y-4">
				{error && (
					<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
						{error}
					</div>
				)}

				<div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-200">
					<AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
					<p>
						Are you sure you want to permanently delete the custom role{" "}
						<strong className="text-white font-semibold">{role.name}</strong>?
						Users assigned to this role will lose any permissions granted solely
						by it.
					</p>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-white/8 pt-4">
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						disabled={deleteMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="danger"
						loading={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate()}
					>
						Delete role
					</Button>
				</div>
			</div>
		</Modal>
	);
}
