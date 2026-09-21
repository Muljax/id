import { Trash2 } from "lucide-react";

import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useStepUp } from "@/context/StepUpContext";
import { deleteOAuthClient, type OAuthClient } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteOAuthClientModalProps {
	client: OAuthClient;
	onClose: () => void;
}

export default function DeleteOAuthClientModal({
	client,
	onClose,
}: DeleteOAuthClientModalProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { requireElevation } = useStepUp();

	async function handleDelete() {
		await requireElevation(() => deleteOAuthClient(client.id));
		toast.success("OAuth client deleted successfully.");
		void queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
	}

	return (
		<ConfirmModal
			open={true}
			onClose={onClose}
			onConfirm={handleDelete}
			title="Delete OAuth client?"
			description={`Are you sure you want to delete "${client.name}"? All existing tokens and authorizations will be immediately invalidated.`}
			confirmButtonLabel="Delete client"
			confirmButtonIcon={<Trash2 size={14} />}
			warningMessage={
				<p>
					Deleting this client will immediately invalidate all issued access
					tokens, refresh tokens, and active authorizations associated with it.
				</p>
			}
		/>
	);
}
