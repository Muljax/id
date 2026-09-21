import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppWindow, Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import ClientModal from "@/components/clients/ClientModal";
import DeleteOAuthClientModal from "@/components/clients/DeleteOAuthClientModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getOAuthClients, type OAuthClient } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";
import { PermissionGuard, useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/admin/clients")({
	staticData: {
		navigation: {
			label: "Clients",
			order: 5,
			requiredPermission: "oauth_clients:read",
		},
	},
	component: ClientsPageWrapper,
});

function ClientsPageWrapper() {
	return (
		<PermissionGuard permission="oauth_clients:read">
			<ClientsPage />
		</PermissionGuard>
	);
}

function ClientsPage() {
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();
	const canWrite = hasPermission("oauth_clients:write");

	const [modalOpen, setModalOpen] = useState(false);
	const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
	const [deletingClient, setDeletingClient] = useState<OAuthClient | null>(
		null,
	);

	const {
		data: clients = [],
		isLoading,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: queryKeys.admin.clients,
		queryFn: async () => {
			const res = await getOAuthClients();
			return res.clients;
		},
	});

	function openCreate() {
		setEditingClient(null);
		setModalOpen(true);
	}

	function openEdit(client: OAuthClient) {
		setEditingClient(client);
		setModalOpen(true);
	}

	function closeModal() {
		setModalOpen(false);
		setEditingClient(null);
	}

	async function handleSaved() {
		closeModal();
		await queryClient.invalidateQueries({ queryKey: queryKeys.admin.clients });
	}

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="OAuth clients"
				description="Manage applications registered to authenticate users and request identity scopes."
				actions={
					<>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							loading={isFetching && !isLoading}
							onClick={() => {
								void refetch();
							}}
							icon={<RefreshCw size={14} />}
						>
							Refresh
						</Button>

						{canWrite && (
							<Button
								type="button"
								size="sm"
								onClick={openCreate}
								icon={<Plus size={14} />}
							>
								Create client
							</Button>
						)}
					</>
				}
			/>

			{clients.length === 0 ? (
				<EmptyState
					icon={<AppWindow size={24} />}
					title="No OAuth clients"
					description={
						<>
							Register your first application to allow users to sign in via{" "}
							<span className="text-violet-400 font-medium">
								{INSTANCE_NAME}
							</span>
							.
						</>
					}
					action={
						canWrite ? (
							<Button
								type="button"
								onClick={openCreate}
								icon={<Plus size={14} />}
							>
								Create client
							</Button>
						) : undefined
					}
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Registered clients
							</CardTitle>
							<Badge variant="default">{clients.length} Total</Badge>
						</div>
					</CardHeader>

					<div className="divide-y divide-white/6">
						{clients.map((client) => (
							<div key={client.id} className="p-6 space-y-4">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2.5">
											<h3 className="text-base font-medium text-white">
												{client.name}
											</h3>
											<Badge
												variant={
													client.clientType === "public"
														? "warning"
														: client.redirectUris.length === 0
															? "violet"
															: "success"
												}
												size="sm"
											>
												{client.clientType === "public"
													? "Public (PKCE)"
													: client.redirectUris.length === 0
														? "M2M / Service"
														: "Web App (Confidential)"}
											</Badge>
										</div>

										<p className="font-mono text-xs text-zinc-500 break-all">
											{client.id}
										</p>
									</div>

									{canWrite && (
										<div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
											<Button
												type="button"
												variant="secondary"
												size="sm"
												onClick={() => openEdit(client)}
												icon={<Edit3 size={13} />}
											>
												Edit
											</Button>

											<Button
												type="button"
												variant="danger"
												size="sm"
												onClick={() => setDeletingClient(client)}
												icon={<Trash2 size={13} />}
											>
												Delete
											</Button>
										</div>
									)}
								</div>

								<div className="grid gap-4 sm:grid-cols-2 pt-2">
									<div>
										<p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
											Redirect URIs
										</p>
										<div className="space-y-1">
											{client.redirectUris.length === 0 ? (
												<p className="text-xs text-zinc-500 italic">
													None (M2M Client Credentials)
												</p>
											) : (
												client.redirectUris.map((uri) => (
													<p
														key={uri}
														className="break-all font-mono text-xs text-zinc-400 bg-white/[0.02] border border-white/6 px-2.5 py-1 rounded-lg"
													>
														{uri}
													</p>
												))
											)}
										</div>
									</div>

									<div>
										<p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
											Allowed Scopes
										</p>
										<div className="flex flex-wrap gap-1.5">
											{client.scopes.map((scope) => (
												<Badge key={scope} variant="violet" size="sm">
													{scope}
												</Badge>
											))}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			<ClientModal
				open={modalOpen}
				client={editingClient}
				onClose={closeModal}
				onSaved={handleSaved}
			/>

			{deletingClient && (
				<DeleteOAuthClientModal
					client={deletingClient}
					onClose={() => setDeletingClient(null)}
				/>
			)}
		</div>
	);
}
