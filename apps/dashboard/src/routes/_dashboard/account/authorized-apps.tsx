import { createFileRoute } from "@tanstack/react-router";
import { AppWindow, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { getOAuthGrants, revokeOAuthGrant, type OAuthGrant } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";

export const Route = createFileRoute("/_dashboard/account/authorized-apps")({
	staticData: {
		navigation: {
			label: "Authorized Apps",
			order: 30,
		},
	},
	component: AuthorizedAppsPage,
});

function AuthorizedAppsPage() {
	const toast = useToast();

	const [grants, setGrants] = useState<OAuthGrant[]>([]);
	const [loading, setLoading] = useState(true);
	const [revoking, setRevoking] = useState<string | null>(null);

	const loadGrants = useCallback(async () => {
		try {
			const response = await getOAuthGrants();
			setGrants(response.grants);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to load authorized apps.",
			);
		} finally {
			setLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		void loadGrants();
	}, [loadGrants]);

	async function handleRevoke(clientId: string) {
		setRevoking(clientId);

		try {
			await revokeOAuthGrant(clientId);
			setGrants((current) =>
				current.filter((grant) => grant.clientId !== clientId),
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to revoke app access.",
			);
		} finally {
			setRevoking(null);
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
				title="Authorized apps"
				description="Manage applications and services that currently have delegated permissions to your account."
			/>

			{grants.length === 0 ? (
				<EmptyState
					icon={<AppWindow size={24} />}
					title="No authorized applications"
					description={
						<>
							You have not authorized any third-party applications or services
							to connect to your{" "}
							<span className="text-violet-400 font-medium">
								{INSTANCE_NAME}
							</span>{" "}
							account.
						</>
					}
				/>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold">
								Connected applications
							</CardTitle>
							<Badge variant="default">{grants.length} Active</Badge>
						</div>
					</CardHeader>

					<div className="divide-y divide-white/6">
						{grants.map((grant) => (
							<div
								key={grant.clientId}
								className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between"
							>
								<div className="space-y-3 min-w-0 flex-1">
									<div className="flex items-center gap-3">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
											<AppWindow size={18} />
										</div>
										<div className="min-w-0">
											<h4 className="truncate text-base font-medium text-white">
												{grant.clientName}
											</h4>
											<p className="truncate font-mono text-xs text-zinc-500">
												{grant.clientId}
											</p>
										</div>
									</div>

									<div>
										<p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
											Granted Scopes
										</p>
										<div className="flex flex-wrap gap-1.5">
											{grant.scopes.map((scope) => (
												<Badge key={scope} variant="violet" size="sm">
													{scope}
												</Badge>
											))}
										</div>
									</div>

									<p className="text-xs text-zinc-500">
										Authorized on{" "}
										{new Date(grant.grantedAt).toLocaleDateString(undefined, {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}
									</p>
								</div>

								<Button
									type="button"
									variant="danger"
									size="sm"
									disabled={revoking === grant.clientId}
									loading={revoking === grant.clientId}
									onClick={() => void handleRevoke(grant.clientId)}
									icon={<Trash2 size={14} />}
									className="self-end sm:self-start shrink-0"
								>
									Revoke access
								</Button>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
