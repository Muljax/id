import { startAuthentication } from "@simplewebauthn/browser";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fingerprint } from "lucide-react";
import { useMemo, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import { useAuth } from "@/context/AuthContext";
import { getPasskeyLoginOptions, login, verifyPasskeyLogin } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";
import {
	type FieldValidators,
	validateForm,
	validators,
} from "@/lib/validation";

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

interface LoginForm {
	email: string;
	password: string;
}

const LOGIN_VALIDATORS: FieldValidators<LoginForm> = {
	email: [
		validators.required("Email address is required."),
		validators.email(),
	],
	password: [validators.required("Password is required.")],
};

function LoginPage() {
	const { refresh } = useAuth();
	const toast = useToast();
	const navigate = useNavigate();
	const { return_to, prompt } = Route.useSearch();
	const forceLogin = prompt === "login";

	const [form, setForm] = useState<LoginForm>({
		email: "",
		password: "",
	});
	const [rememberMe, setRememberMe] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [passkeySubmitting, setPasskeySubmitting] = useState(false);

	const { isValid } = useMemo(
		() => validateForm(form, LOGIN_VALIDATORS),
		[form],
	);

	const canSubmit = isValid && !submitting && !passkeySubmitting;

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

		if (!canSubmit) {
			return;
		}

		setSubmitting(true);

		try {
			await login(form.email.trim(), form.password, rememberMe, prompt);
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
			if (
				error instanceof Error &&
				(error.name === "NotAllowedError" ||
					error.message.toLowerCase().includes("not allowed"))
			) {
				return;
			}

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
			<div className="space-y-6">
				{/* Heading */}
				<div className="space-y-3">
					<InstanceLogo className="h-10 w-10 rounded-xl" />

					<div>
						<h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
							{forceLogin ? (
								"Confirm your identity"
							) : (
								<>
									Sign in to{" "}
									<span className="text-violet-400">{INSTANCE_NAME}</span>
								</>
							)}
						</h1>

						<p className="mt-1.5 text-sm text-zinc-400">
							{forceLogin
								? "Re-authenticate to continue to the requested application."
								: "Enter your credentials or use your passkey."}
						</p>
					</div>
				</div>

				{/* Primary Form */}
				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="mb-1.5 block text-xs font-medium text-zinc-300"
						>
							Email address
						</label>

						<Input
							id="email"
							type="email"
							autoComplete="email"
							value={form.email}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									email: event.target.value,
								}))
							}
							placeholder="you@example.com"
							required
							disabled={submitting || passkeySubmitting}
						/>
					</div>

					<div>
						<div className="mb-1.5 flex items-center justify-between">
							<label
								htmlFor="password"
								className="text-xs font-medium text-zinc-300"
							>
								Password
							</label>

							<Link
								to="/forgot-password"
								className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
							>
								Forgot password?
							</Link>
						</div>

						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							value={form.password}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									password: event.target.value,
								}))
							}
							placeholder="Enter password"
							required
							disabled={submitting || passkeySubmitting}
						/>
					</div>

					<div className="pt-1">
						<label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-400 select-none">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={(event) => setRememberMe(event.target.checked)}
								disabled={submitting || passkeySubmitting}
								className="h-4 w-4 rounded border-white/10 bg-zinc-900 accent-violet-500"
							/>
							Remember this device
						</label>
					</div>

					<Button
						type="submit"
						loading={submitting}
						disabled={!canSubmit}
						className="w-full mt-2"
						size="lg"
					>
						Sign in
					</Button>
				</form>

				{/* Centered OR Divider */}
				<div className="flex items-center gap-3 py-1">
					<div className="h-px flex-1 bg-white/10" />
					<span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 select-none">
						or
					</span>
					<div className="h-px flex-1 bg-white/10" />
				</div>

				{/* Passkey Button */}
				<Button
					type="button"
					variant="secondary"
					size="lg"
					loading={passkeySubmitting}
					disabled={submitting}
					onClick={() => void handlePasskeyLogin()}
					icon={<Fingerprint size={18} className="text-violet-400" />}
					className="w-full"
				>
					Sign in with Passkey
				</Button>

				{/* Register Link */}
				<p className="pt-2 text-center text-xs text-zinc-400">
					Don't have an account?{" "}
					<Link
						to="/register"
						search={return_to ? { return_to } : undefined}
						className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
					>
						Create account
					</Link>
				</p>
			</div>
		</PreAuthLayout>
	);
}
