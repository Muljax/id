import { createFileRoute } from "@tanstack/react-router";
import { AppWindow, Edit3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ClientModal from "@/components/ClientModal";
import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import {
	deleteOAuthClient,
	getOAuthClients,
	type OAuthClient,
} from "@/lib/api";

export const Route = createFileRoute("/_dashboard/admin/clients")({
	staticData: {
		navigation: {
			label: "Clients",
			order: 5,
			adminOnly: false,
		},
	},
	component: ClientsPage,
});

function ClientsPage() {
	const toast = useToast();

	const [clients, setClients] = useState<OAuthClient[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
	const [deletingClient, setDeletingClient] = useState<OAuthClient | null>(
		null,
	);
	const [deleting, setDeleting] = useState(false);

	const loadClients = useCallback(async () => {
		try {
			const response = await getOAuthClients();
			setClients(response.clients);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to load OAuth clients.",
			);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [toast]);

	useEffect(() => {
		void loadClients();
	}, [loadClients]);

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
		await loadClients();
	}

	async function handleDelete() {
		if (!deletingClient) {
			return;
		}

		setDeleting(true);

		try {
			await deleteOAuthClient(deletingClient.id);
			setClients((current) =>
				current.filter((item) => item.id !== deletingClient.id),
			);
			toast.success(`Deleted "${deletingClient.name}".`);
			setDeletingClient(null);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to delete OAuth client.",
			);
		} finally {
			setDeleting(false);
		}
	}

	if (loading) {
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
							loading={refreshing}
							onClick={() => {
								setRefreshing(true);
								void loadClients();
							}}
							icon={<RefreshCw size={14} />}
						>
							Refresh
						</Button>

						<Button
							type="button"
							size="sm"
							onClick={openCreate}
							icon={<Plus size={14} />}
						>
							Create client
						</Button>
					</>
				}
			/>

			{clients.length === 0 ? (
				<EmptyState
					icon={<AppWindow size={24} />}
					title="No OAuth clients"
					description="Register your first application to allow users to sign in via Muljax ID."
					action={
						<Button
							type="button"
							onClick={openCreate}
							icon={<Plus size={14} />}
						>
							Create client
						</Button>
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
													client.clientType === "confidential"
														? "violet"
														: "default"
												}
												size="sm"
											>
												{client.clientType}
											</Badge>
										</div>

										<p className="font-mono text-xs text-zinc-500 break-all">
											{client.id}
										</p>
									</div>

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
								</div>

								<div className="grid gap-4 sm:grid-cols-2 pt-2">
									<div>
										<p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
											Redirect URIs
										</p>
										<div className="space-y-1">
											{client.redirectUris.map((uri) => (
												<p
													key={uri}
													className="break-all font-mono text-xs text-zinc-400 bg-white/[0.02] border border-white/6 px-2.5 py-1 rounded-lg"
												>
													{uri}
												</p>
											))}
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

			{/* Delete Confirmation Modal */}
			<Modal
				open={deletingClient !== null}
				title="Delete OAuth client?"
				description={`Are you sure you want to delete "${deletingClient?.name}"? All existing tokens and authorizations will be immediately invalidated.`}
				onClose={() => {
					if (!deleting) {
						setDeletingClient(null);
					}
				}}
			>
				<div className="flex justify-end gap-3 pt-4">
					<Button
						type="button"
						variant="ghost"
						disabled={deleting}
						onClick={() => setDeletingClient(null)}
					>
						Cancel
					</Button>

					<Button
						type="button"
						variant="danger"
						loading={deleting}
						onClick={() => void handleDelete()}
					>
						Delete client
					</Button>
				</div>
			</Modal>
		</div>
	);
}
