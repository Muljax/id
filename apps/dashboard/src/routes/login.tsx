import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import PreAuthLayout from "@/layouts/PreAuthLayout";
import { getPasskeyLoginOptions, login, verifyPasskeyLogin } from "@/lib/api";

export interface LoginSearch {
	return_to?: string;
	prompt?: string;
}

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		return_to:
			typeof search.return_to === "string" ? search.return_to : undefined,
		prompt: typeof search.prompt === "string" ? search.prompt : undefined,
	}),
	component: LoginPage,
});

function getSafeReturnTo(value: string | undefined) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return null;
	}

	return value;
}

async function loginWithPasskey() {
	const { challengeId, ...options } = await getPasskeyLoginOptions();

	const response = await startAuthentication({
		optionsJSON: options,
	});

	await verifyPasskeyLogin(response, challengeId);
}

function LoginPage() {
	const { refresh } = useAuth();
	const toast = useToast();
	const navigate = useNavigate();
	const { return_to, prompt } = Route.useSearch();
	const forceLogin = prompt === "login";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [passkeySubmitting, setPasskeySubmitting] = useState(false);

	async function finishLogin() {
		await refresh();

		const destination = getSafeReturnTo(return_to);

		if (destination) {
			const url = new URL(destination, window.location.origin);

			if (forceLogin) {
				url.searchParams.delete("prompt");
			}

			window.location.href = url.toString();
			return;
		}

		await navigate({ to: "/" });
	}

	async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);

		try {
			await login(email, password, rememberMe, prompt);
			await finishLogin();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to sign in.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	async function handlePasskeyLogin() {
		if (passkeySubmitting) {
			return;
		}

		setPasskeySubmitting(true);

		try {
			await loginWithPasskey();
			await finishLogin();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to sign in with your passkey.",
			);
		} finally {
			setPasskeySubmitting(false);
		}
	}

	return (
		<PreAuthLayout>
			<div>
				<div className="mb-8">
					<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
						{forceLogin ? "Confirm your identity" : "Welcome back"}
					</h1>

					<p className="mt-2 text-sm leading-6 text-zinc-500">
						{forceLogin
							? "Sign in again to continue to this application."
							: "Sign in to continue to your Muljax account."}
					</p>
				</div>

				<form onSubmit={handleLogin} className="space-y-5">
					<div>
						<label
							htmlFor="email"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Email
						</label>

						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="you@example.com"
							required
							disabled={submitting || passkeySubmitting}
						/>
					</div>

					<div>
						<div className="mb-2 flex items-center justify-between">
							<label
								htmlFor="password"
								className="text-sm font-medium text-zinc-300"
							>
								Password
							</label>

							<a
								href="/forgot-password"
								className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
							>
								Forgot password?
							</a>
						</div>

						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Enter your password"
							required
							disabled={submitting || passkeySubmitting}
						/>
					</div>

					<label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-500">
						<input
							type="checkbox"
							checked={rememberMe}
							onChange={(event) => setRememberMe(event.target.checked)}
							disabled={submitting || passkeySubmitting}
							className="h-4 w-4 rounded border-white/10 bg-zinc-900 accent-violet-500"
						/>
						Remember me
					</label>

					<Button
						type="submit"
						disabled={submitting || passkeySubmitting}
						className="w-full"
					>
						{submitting ? <Spinner /> : "Sign in"}
					</Button>
				</form>

				<div className="my-7 flex items-center gap-4">
					<div className="h-px flex-1 bg-white/8" />

					<span className="text-xs text-zinc-600">OR</span>

					<div className="h-px flex-1 bg-white/8" />
				</div>

				<button
					type="button"
					onClick={handlePasskeyLogin}
					disabled={submitting || passkeySubmitting}
					className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/3 text-sm font-medium text-zinc-300 transition-all hover:border-violet-400/30 hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
				>
					{passkeySubmitting ? (
						<Spinner />
					) : (
						<>
							<Fingerprint
								className="h-4 w-4 text-violet-400"
								strokeWidth={1.8}
							/>
							<span>Sign in with passkey</span>
						</>
					)}
				</button>

				<p className="mt-8 text-center text-sm text-zinc-500">
					Don't have an account?{" "}
					<a
						href="/register"
						className="font-medium text-violet-400 transition-colors hover:text-violet-300"
					>
						Create one
					</a>
				</p>
			</div>
		</PreAuthLayout>
	);
}
