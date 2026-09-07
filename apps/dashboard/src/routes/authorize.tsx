import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import { api, getOAuthClientDetails } from "@/lib/api";

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

interface OAuthClientDetails {
	client_id: string;
	name: string;
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

		void getOAuthClientDetails(search.client_id)
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
	}, [search.client_id]);

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
			checkingGrant ||
			promptNoneHandled.current
		) {
			return;
		}

		if (hasGrant) {
			return;
		}

		promptNoneHandled.current = true;

		const url = new URL(search.redirect_uri!);

		url.searchParams.set("error", "login_required");

		if (search.state) {
			url.searchParams.set("state", search.state);
		}

		window.location.href = url.toString();
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
		if (!search.redirect_uri) {
			window.location.href = "/";
			return;
		}

		const url = new URL(search.redirect_uri);

		url.searchParams.set("error", "access_denied");

		if (search.state) {
			url.searchParams.set("state", search.state);
		}

		window.location.href = url.toString();
	}

	if (missing) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
				<div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/2 p-6">
					<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
						Invalid authorization request
					</h1>

					<p className="mt-2 text-sm leading-6 text-zinc-500">
						The authorization request is missing required parameters.
					</p>
				</div>
			</div>
		);
	}

	if (isSilent) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
				<div className="text-sm text-zinc-500">Checking authentication...</div>
			</div>
		);
	}

	if (loadingClient || (checkingGrant && !requiresInteraction)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
				<div className="text-sm text-zinc-500">
					{loadingClient
						? "Loading application..."
						: "Checking authorization..."}
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
			<div className="w-full max-w-2xl">
				<div className="mb-8 text-center">
					<p className="text-sm font-medium text-zinc-500">Muljax ID</p>

					<h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
						Authorize application
					</h1>

					<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
						Review the permissions requested by this application before
						continuing.
					</p>
				</div>

				<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
					<div className="border-b border-white/8 px-6 py-6">
						<p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
							Application
						</p>

						<h2 className="mt-2 text-lg font-medium text-white">
							{client?.name ?? "Unknown application"}
						</h2>

						<p className="mt-1 text-sm text-zinc-500">
							wants to access your Muljax ID account.
						</p>

						{client?.client_id && (
							<p className="mt-3 break-all font-mono text-xs text-zinc-600">
								{client.client_id}
							</p>
						)}
					</div>

					<div className="px-6 py-6">
						<p className="text-sm font-medium text-white">
							Requested permissions
						</p>

						<p className="mt-1 text-sm text-zinc-500">
							This application is requesting access to the following
							permissions.
						</p>

						<div className="mt-4 space-y-2">
							{scopes.map((scope) => (
								<div
									key={scope}
									className="flex items-center rounded-xl border border-violet-400/10 bg-violet-400/6 px-3.5 py-3 text-sm font-medium text-violet-300"
								>
									{scope}
								</div>
							))}
						</div>

						{error && (
							<div className="mt-5 rounded-xl border border-red-400/15 bg-red-400/6 px-4 py-3 text-sm leading-6 text-red-300">
								{error}
							</div>
						)}
					</div>

					<div className="flex flex-col-reverse gap-3 border-t border-white/8 bg-white/1.5 px-6 py-5 sm:flex-row sm:justify-end">
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
							variant="primary"
							disabled={loading || loadingClient || !client}
							onClick={() => void approve()}
						>
							{loading ? "Authorizing..." : "Authorize"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
