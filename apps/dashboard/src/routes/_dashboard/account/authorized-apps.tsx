import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { getOAuthGrants, revokeOAuthGrant, type OAuthGrant } from "@/lib/api";

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

			toast.success("App access revoked.");
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
		<div className="max-w-2xl">
			<div className="mb-8">
				<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
					Authorized apps
				</h1>

				<p className="mt-2 text-sm leading-6 text-zinc-500">
					Manage applications that have access to your Muljax ID account.
				</p>
			</div>

			{grants.length === 0 ? (
				<div className="rounded-2xl border border-white/10 bg-white/2 px-6 py-6">
					<p className="text-sm text-zinc-500">
						You have not authorized any applications.
					</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
					<div className="border-b border-white/8 px-6 py-5">
						<h2 className="text-sm font-medium text-white">
							Connected applications
						</h2>

						<p className="mt-1 text-sm text-zinc-500">
							These applications can access your account with the permissions
							shown below.
						</p>
					</div>

					<div className="divide-y divide-white/8">
						{grants.map((grant) => (
							<div key={grant.clientId} className="px-6 py-6">
								<div className="flex items-start justify-between gap-5">
									<div className="min-w-0">
										<h2 className="truncate text-base font-medium text-white">
											{grant.clientName}
										</h2>

										<p className="mt-1 break-all font-mono text-xs text-zinc-600">
											{grant.clientId}
										</p>
									</div>

									<Button
										type="button"
										variant="danger"
										disabled={revoking === grant.clientId}
										onClick={() => void handleRevoke(grant.clientId)}
										className="shrink-0"
									>
										{revoking === grant.clientId ? "Revoking..." : "Revoke"}
									</Button>
								</div>

								<div className="mt-5">
									<p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
										Permissions
									</p>

									<div className="mt-2 flex flex-wrap gap-2">
										{grant.scopes.map((scope) => (
											<span
												key={scope}
												className="rounded-lg border border-violet-400/10 bg-violet-400/6 px-2.5 py-1 text-xs font-medium text-violet-300"
											>
												{scope}
											</span>
										))}
									</div>
								</div>

								<p className="mt-5 text-xs text-zinc-600">
									Authorized{" "}
									{new Date(grant.grantedAt).toLocaleDateString(undefined, {
										month: "long",
										day: "numeric",
										year: "numeric",
									})}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
