import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, AppWindow, CheckCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import Card, {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import InstanceLogo from "@/components/ui/InstanceLogo";
import Spinner from "@/components/ui/Spinner";
import { api, getOAuthClientDetails, type OAuthClientDetails } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";

export interface AuthorizeSearch {
	client_id?: string;
	redirect_uri?: string;
	response_type?: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	nonce?: string;
	prompt?: string;
	max_age?: string;
	acr_values?: string;
	claims?: string;
}

interface GrantResponse {
	granted: boolean;
}

export const Route = createFileRoute("/authorize")({
	validateSearch: (search: Record<string, unknown>): AuthorizeSearch => ({
		client_id:
			typeof search.client_id === "string" ? search.client_id : undefined,
		redirect_uri:
			typeof search.redirect_uri === "string" ? search.redirect_uri : undefined,
		response_type:
			typeof search.response_type === "string"
				? search.response_type
				: undefined,
		scope: typeof search.scope === "string" ? search.scope : undefined,
		state: typeof search.state === "string" ? search.state : undefined,
		code_challenge:
			typeof search.code_challenge === "string"
				? search.code_challenge
				: undefined,
		code_challenge_method:
			typeof search.code_challenge_method === "string"
				? search.code_challenge_method
				: undefined,
		nonce: typeof search.nonce === "string" ? search.nonce : undefined,
		prompt: typeof search.prompt === "string" ? search.prompt : undefined,
		max_age: typeof search.max_age === "string" ? search.max_age : undefined,
		acr_values:
			typeof search.acr_values === "string" ? search.acr_values : undefined,
		claims: typeof search.claims === "string" ? search.claims : undefined,
	}),
	component: AuthorizePage,
});

function AuthorizePage() {
	const search = Route.useSearch();

	const [loading, setLoading] = useState(false);
	const [loadingClient, setLoadingClient] = useState(true);
	const [checkingGrant, setCheckingGrant] = useState(true);
	const [hasGrant, setHasGrant] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [client, setClient] = useState<OAuthClientDetails | null>(null);

	const autoApproved = useRef(false);
	const promptNoneHandled = useRef(false);

	const scopes = search.scope?.split(" ").filter(Boolean) ?? [];

	const missing =
		!search.client_id ||
		!search.redirect_uri ||
		!search.response_type ||
		!search.scope;

	const requiresInteraction =
		search.prompt === "login" || search.prompt === "consent";

	const isSilent = search.prompt === "none";

	useEffect(() => {
		if (!search.client_id) {
			setLoadingClient(false);
			return;
		}

		void getOAuthClientDetails(search.client_id, search.redirect_uri)
			.then(setClient)
			.catch((error) => {
				setError(
					error instanceof Error
						? error.message
						: "Unable to load application information.",
				);
			})
			.finally(() => {
				setLoadingClient(false);
			});
	}, [search.client_id, search.redirect_uri]);

	useEffect(() => {
		if (missing || loadingClient || !client || search.prompt !== "login") {
			return;
		}

		const returnTo = `${window.location.pathname}${window.location.search}`;

		window.location.href = `/login?return_to=${encodeURIComponent(
			returnTo,
		)}&prompt=login`;
	}, [missing, loadingClient, client, search.prompt]);

	useEffect(() => {
		if (!search.client_id || !search.scope) {
			setCheckingGrant(false);
			return;
		}

		if (requiresInteraction) {
			setHasGrant(false);
			setCheckingGrant(false);
			return;
		}

		let cancelled = false;
		setCheckingGrant(true);

		void api<GrantResponse>(
			`/oauth/grant?client_id=${encodeURIComponent(
				search.client_id,
			)}&scope=${encodeURIComponent(search.scope)}`,
		)
			.then((result) => {
				if (cancelled) {
					return;
				}

				setHasGrant(result.granted);
			})
			.catch((error) => {
				if (cancelled) {
					return;
				}

				setError(
					error instanceof Error
						? error.message
						: "Unable to check authorization.",
				);

				setHasGrant(false);
			})
			.finally(() => {
				if (!cancelled) {
					setCheckingGrant(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [search.client_id, search.scope, requiresInteraction]);

	/*
	 * prompt=none MUST NOT display authentication or consent UI.
	 *
	 * If the request cannot be satisfied silently, return
	 * login_required to the client.
	 */
	useEffect(() => {
		if (
			!isSilent ||
			missing ||
			loadingClient ||
			!client ||
			!client.redirect_uri_valid ||
			!search.redirect_uri ||
			checkingGrant ||
			promptNoneHandled.current
		) {
			return;
		}

		if (hasGrant) {
			return;
		}

		promptNoneHandled.current = true;

		try {
			const url = new URL(search.redirect_uri);
			if (url.protocol !== "https:" && url.protocol !== "http:") {
				return;
			}

			url.searchParams.set("error", "login_required");

			if (search.state) {
				url.searchParams.set("state", search.state);
			}

			window.location.href = url.toString();
		} catch {
			// Invalid redirect_uri, do not redirect
		}
	}, [
		isSilent,
		missing,
		loadingClient,
		client,
		checkingGrant,
		hasGrant,
		search.redirect_uri,
		search.state,
	]);

	const approve = useCallback(async () => {
		if (missing) {
			setError("Invalid authorization request.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await api<{ redirect_uri: string }>("/oauth/approve", {
				method: "POST",
				body: JSON.stringify({
					client_id: search.client_id,
					redirect_uri: search.redirect_uri,
					response_type: search.response_type,
					scope: search.scope,
					state: search.state,
					code_challenge: search.code_challenge,
					code_challenge_method: search.code_challenge_method,
					nonce: search.nonce,
					acr_values: search.acr_values,
					claims: search.claims,
				}),
			});

			window.location.href = response.redirect_uri;
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Unable to authorize application.",
			);

			setLoading(false);
		}
	}, [
		missing,
		search.client_id,
		search.redirect_uri,
		search.response_type,
		search.scope,
		search.state,
		search.code_challenge,
		search.code_challenge_method,
		search.nonce,
		search.acr_values,
		search.claims,
	]);

	useEffect(() => {
		if (
			missing ||
			loadingClient ||
			!client ||
			checkingGrant ||
			!hasGrant ||
			autoApproved.current ||
			requiresInteraction
		) {
			return;
		}

		autoApproved.current = true;
		void approve();
	}, [
		missing,
		loadingClient,
		client,
		checkingGrant,
		hasGrant,
		requiresInteraction,
		approve,
	]);

	function handleDeny() {
		if (!search.redirect_uri || !client?.redirect_uri_valid) {
			window.location.href = "/";
			return;
		}

		try {
			const url = new URL(search.redirect_uri);
			if (url.protocol !== "https:" && url.protocol !== "http:") {
				window.location.href = "/";
				return;
			}

			url.searchParams.set("error", "access_denied");

			if (search.state) {
				url.searchParams.set("state", search.state);
			}

			window.location.href = url.toString();
		} catch {
			window.location.href = "/";
		}
	}

	if (missing) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
				<div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/50 p-8 text-center backdrop-blur-xl">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
						<AlertTriangle size={24} />
					</div>
					<h1 className="text-xl font-semibold text-white">
						Invalid authorization request
					</h1>
					<p className="mt-2 text-sm text-zinc-400">
						The OAuth authorization request is missing required parameters.
					</p>
				</div>
			</div>
		);
	}

	if (isSilent || loadingClient || (checkingGrant && !requiresInteraction)) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
				<Spinner size="lg" />
				<p className="mt-4 text-xs font-medium text-zinc-400">
					{loadingClient
						? "Loading application details..."
						: "Verifying authorization..."}
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-12">
			{/* Ambient background illumination */}
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 overflow-hidden"
			>
				<div className="absolute left-1/2 top-[-10%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/[0.06] blur-[150px]" />
			</div>

			<div className="relative z-10 w-full max-w-lg space-y-6">
				{/* Top Branding */}
				<div className="text-center">
					<InstanceLogo className="mx-auto h-12 w-12 rounded-2xl mb-3 shadow-lg" />

					<h1 className="text-2xl font-bold tracking-tight text-white">
						Authorize application
					</h1>

					<p className="mt-1 text-sm text-zinc-400">
						Review permissions requested by this service to connect to your{" "}
						<span className="text-violet-400 font-medium">{INSTANCE_NAME}</span>{" "}
						account.
					</p>
				</div>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-3.5">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
								<AppWindow size={20} />
							</div>
							<div className="min-w-0">
								<CardTitle className="text-base truncate">
									{client?.name ?? "Unknown application"}
								</CardTitle>
								{client?.client_id && (
									<p className="font-mono text-xs text-zinc-500 truncate">
										{client.client_id}
									</p>
								)}
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						<div>
							<span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
								Requested Permissions
							</span>
							<div className="mt-2 space-y-2">
								{scopes.map((scope) => (
									<div
										key={scope}
										className="flex items-center gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] p-3 text-xs text-zinc-200"
									>
										<CheckCircle
											size={14}
											className="text-violet-400 shrink-0"
										/>
										<span className="font-mono font-medium">{scope}</span>
									</div>
								))}
							</div>
						</div>

						{error && (
							<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
								{error}
							</div>
						)}
					</CardContent>

					<CardFooter className="flex items-center justify-end gap-3">
						<Button
							type="button"
							variant="secondary"
							disabled={loading}
							onClick={handleDeny}
						>
							Deny
						</Button>

						<Button
							type="button"
							loading={loading}
							disabled={loadingClient || !client}
							onClick={() => void approve()}
						>
							Authorize
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
