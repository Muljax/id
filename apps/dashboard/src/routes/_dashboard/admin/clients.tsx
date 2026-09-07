import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import ClientCard from "@/components/oauth/ClientCard";
import ClientModal from "@/components/oauth/ClientModal";
import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
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

	async function handleDelete(client: OAuthClient) {
		try {
			await deleteOAuthClient(client.id);

			setClients((current) => current.filter((item) => item.id !== client.id));

			toast.success(`Deleted "${client.name}".`);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to delete OAuth client.",
			);
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
		<div className="max-w-2xl">
			<div className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
						OAuth clients
					</h1>
					<p className="mt-2 text-sm leading-6 text-zinc-500">
						Manage applications that can authenticate users with Muljax ID.
					</p>
				</div>

				<div className="flex shrink-0 gap-2">
					<Button
						type="button"
						variant="secondary"
						disabled={refreshing}
						onClick={() => {
							setRefreshing(true);
							void loadClients();
						}}
					>
						{refreshing ? "Refreshing..." : "Refresh"}
					</Button>

					<Button type="button" onClick={openCreate}>
						Create client
					</Button>
				</div>
			</div>

			{clients.length === 0 ? (
				<div className="rounded-2xl border border-white/10 bg-white/2 px-6 py-6">
					<p className="text-sm text-zinc-500">
						You have not created any OAuth clients.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
					<div className="border-b border-white/8 px-6 py-5">
						<h2 className="text-sm font-medium text-white">OAuth clients</h2>
						<p className="mt-1 text-sm text-zinc-500">
							Applications registered with your Muljax ID instance.
						</p>
					</div>

					<div className="divide-y divide-white/8">
						{clients.map((client) => (
							<div key={client.id} className="px-6 py-6">
								<ClientCard
									client={client}
									onEdit={() => openEdit(client)}
									onDelete={() => void handleDelete(client)}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			<ClientModal
				open={modalOpen}
				client={editingClient}
				onClose={closeModal}
				onSaved={handleSaved}
			/>
		</div>
	);
}
