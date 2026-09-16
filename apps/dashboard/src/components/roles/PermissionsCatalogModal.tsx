import { useQuery } from "@tanstack/react-query";

import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { getPermissions } from "@/lib/api/rbac";
import { queryKeys } from "@/lib/queryKeys";

interface PermissionsCatalogModalProps {
	open: boolean;
	onClose: () => void;
}

export default function PermissionsCatalogModal({
	open,
	onClose,
}: PermissionsCatalogModalProps) {
	const { data, isLoading } = useQuery({
		queryKey: queryKeys.admin.permissions,
		queryFn: getPermissions,
		enabled: open,
	});

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Permissions catalog"
			description="Overview of all registered system permissions and their capabilities."
			size="lg"
		>
			<div className="max-h-[65vh] overflow-y-auto pr-1 space-y-6">
				{isLoading ? (
					<div className="flex justify-center py-12">
						<Spinner size="md" />
					</div>
				) : (
					Object.entries(data?.categories ?? {}).map(
						([category, permissions]) => (
							<div key={category} className="space-y-2">
								<h3 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
									{category.replace("_", " ")}
								</h3>
								<div className="divide-y divide-white/6 rounded-xl border border-white/8 bg-zinc-900/40">
									{permissions.map((perm) => (
										<div
											key={perm.id}
											className="p-3 text-left"
										>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="font-mono text-xs font-semibold text-white">
														{perm.id}
													</span>
													{perm.isSystem && (
														<Badge variant="default" size="sm">
															System
														</Badge>
													)}
												</div>
												<p className="mt-1 text-xs text-zinc-400">
													{perm.description || perm.name}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						),
					)
				)}
			</div>
		</Modal>
	);
}
