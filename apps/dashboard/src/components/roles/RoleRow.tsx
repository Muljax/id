import { Edit2, Trash2 } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Role } from "@/lib/api/rbac";

interface RoleRowProps {
	role: Role;
	onEdit: (role: Role) => void;
	onDelete: (role: Role) => void;
}

export default function RoleRow({ role, onEdit, onDelete }: RoleRowProps) {
	return (
		<div className="p-5 sm:p-6 transition-colors hover:bg-white/[0.015]">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate text-sm font-semibold text-white">
							{role.name}
						</span>

						<Badge variant={role.isSystem ? "violet" : "default"} size="sm">
							{role.isSystem ? "System" : "Custom"}
						</Badge>

						<span className="text-xs text-zinc-500">
							{role.permissions.length} permission
							{role.permissions.length === 1 ? "" : "s"}
						</span>
					</div>

					{role.description && (
						<p className="mt-1 text-xs text-zinc-400 line-clamp-1">
							{role.description}
						</p>
					)}

					{/* Permissions pills */}
					<div className="mt-3 flex flex-wrap gap-1.5">
						{role.permissions.length === 0 ? (
							<span className="text-xs text-zinc-500 italic">
								No permissions assigned
							</span>
						) : (
							role.permissions.slice(0, 8).map((perm) => (
								<span
									key={perm}
									className="inline-flex items-center rounded-md border border-white/6 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-zinc-300"
								>
									{perm}
								</span>
							))
						)}
						{role.permissions.length > 8 && (
							<span className="inline-flex items-center rounded-md border border-white/6 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-400">
								+{role.permissions.length - 8} more
							</span>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-center shrink-0">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						icon={<Edit2 size={13} />}
						onClick={() => onEdit(role)}
					>
						Edit
					</Button>

					{!role.isSystem && (
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
			</div>
		</div>
	);
}
