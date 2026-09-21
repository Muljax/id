import { Edit2, Trash2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EntityRow from "@/components/ui/EntityRow";
import type { Role } from "@/lib/api/rbac";

interface RoleRowProps {
	role: Role;
	canEdit?: boolean;
	canDelete?: boolean;
	onEdit: (role: Role) => void;
	onDelete: (role: Role) => void;
}

export default function RoleRow({
	role,
	canEdit = true,
	canDelete = true,
	onEdit,
	onDelete,
}: RoleRowProps) {
	return (
		<EntityRow
			title={role.name}
			description={role.description}
			badges={
				<Badge variant={role.isSystem ? "violet" : "default"} size="sm">
					{role.isSystem ? "System" : "Custom"}
				</Badge>
			}
			meta={
				<span>
					{role.permissions.length} permission
					{role.permissions.length === 1 ? "" : "s"}
				</span>
			}
			tags={role.permissions}
			emptyTagsMessage="No permissions assigned"
			actions={
				(canEdit || (canDelete && !role.isSystem)) && (
					<div className="flex items-center gap-2">
						{canEdit && (
							<Button
								type="button"
								variant="secondary"
								size="sm"
								icon={<Edit2 size={13} />}
								onClick={() => onEdit(role)}
							>
								Edit
							</Button>
						)}

						{canDelete && !role.isSystem && (
							<Button
								type="button"
								variant="danger"
								size="sm"
								icon={<Trash2 size={13} />}
								onClick={() => onDelete(role)}
							>
								Delete
							</Button>
						)}
					</div>
				)
			}
		/>
	);
}
