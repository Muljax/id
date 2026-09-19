import { startAuthentication } from "@simplewebauthn/browser";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fingerprint, Key, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import { useAuth } from "@/context/AuthContext";
import {
	type AuthUser,
	getPasskeyLoginOptions,
	getPublicAuthSettings,
	login,
	verifyPasskeyLogin,
} from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";
import { validateField, validators } from "@/lib/validation";

export interface LoginSearch {
	return_to?: string;
	prompt?: string;
	admin_key?: string;
}

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		return_to:
			typeof search.return_to === "string" ? search.return_to : undefined,
		prompt: typeof search.prompt === "string" ? search.prompt : undefined,
		admin_key:
			typeof search.admin_key === "string" ? search.admin_key : undefined,
	}),
	staticData: {
		title: "Sign In",
	},
	component: LoginPage,
});

function getSafeReturnTo(value: string | undefined) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return null;
	}

	return value;
}

async function loginWithPasskey(adminKey?: string) {
	const { challengeId, ...options } = await getPasskeyLoginOptions();

	const response = await startAuthentication({
		optionsJSON: options,
	});

	return verifyPasskeyLogin(response, challengeId, adminKey);
}

function LoginPage() {
	const { user, setUser, refresh } = useAuth();
	const toast = useToast();
	const navigate = useNavigate();
	const { return_to, prompt, admin_key } = Route.useSearch();
	const forceLogin = prompt === "login";

	const { data: authSettings } = useQuery({
		queryKey: ["auth", "publicSettings"],
		queryFn: getPublicAuthSettings,
		staleTime: 1000 * 60 * 5,
	});

	const signinMode =
		authSettings?.signinMode ?? (admin_key ? "admin_key" : "enabled");
	const requiresAdminKey = signinMode === "admin_key";
	const isClosed = signinMode === "disabled";

	const [passkeySubmitting, setPasskeySubmitting] = useState(false);

	useEffect(() => {
		if (user && !forceLogin) {
			const destination = getSafeReturnTo(return_to);
			if (destination) {
				window.location.href = destination;
			} else {
				void navigate({ to: "/" });
			}
		}
	}, [user, forceLogin, return_to, navigate]);

	async function finishLogin(loggedInUser?: AuthUser) {
		if (loggedInUser?.permissions) {
			setUser(loggedInUser);
		} else {
			await refresh();
		}

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

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
			adminKey: admin_key ?? "",
		},
		onSubmit: async ({ value }) => {
			try {
				const response = await login(
					value.email.trim(),
					value.password,
					value.rememberMe,
					prompt,
					value.adminKey?.trim() || undefined,
				);
				await finishLogin(response.user);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Unable to sign in.",
				);
			}
		},
	});

	async function handlePasskeyLogin() {
		if (passkeySubmitting) {
			return;
		}

		setPasskeySubmitting(true);

		try {
			const response = await loginWithPasskey(
				form.state.values.adminKey?.trim() || undefined,
			);
			await finishLogin(response.user);
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

				{isClosed ? (
					<div className="space-y-4 rounded-xl border border-red-500/20 bg-red-950/20 p-5 text-center">
						<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
							<Lock size={18} />
						</div>
						<div>
							<h3 className="text-sm font-semibold text-white">
								Sign-in is disabled
							</h3>
							<p className="mt-1 text-xs text-zinc-400">
								Sign-in is currently disabled on this instance. Please contact
								an administrator.
							</p>
						</div>
					</div>
				) : (
					<>
						{/* Primary Form */}
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								void form.handleSubmit();
							}}
							className="space-y-4"
						>
							{(requiresAdminKey || Boolean(admin_key)) && (
								<form.Field
									name="adminKey"
									validators={{
										onChange: ({ value }) => {
											if (
												requiresAdminKey &&
												(!value || typeof value !== "string" || !value.trim())
											) {
												return "An admin access key is required to sign in.";
											}
											return undefined;
										},
									}}
								>
									{(field) => (
										<div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3.5 space-y-2">
											<div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
												<Key size={14} />
												<span>Admin Access Key</span>
											</div>

											<Input
												id={field.name}
												name={field.name}
												type="text"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="Paste your admin access key"
												disabled={form.state.isSubmitting || passkeySubmitting}
												hasError={
													field.state.meta.isTouched &&
													field.state.meta.errors.length > 0
												}
												required={requiresAdminKey}
											/>

											{field.state.meta.isTouched &&
											field.state.meta.errors[0] ? (
												<p className="text-xs text-red-400">
													{String(field.state.meta.errors[0])}
												</p>
											) : null}
										</div>
									)}
								</form.Field>
							)}

							<form.Field
								name="email"
								validators={{
									onChange: validateField([
										validators.required("Email address is required."),
										validators.email(),
									]),
								}}
							>
								{(field) => (
									<div>
										<label
											htmlFor={field.name}
											className="mb-1.5 block text-xs font-medium text-zinc-300"
										>
											Email address
										</label>

										<Input
											id={field.name}
											name={field.name}
											type="email"
											autoComplete="email"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											hasError={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											placeholder="you@example.com"
											required
											disabled={form.state.isSubmitting || passkeySubmitting}
										/>

										{field.state.meta.isTouched &&
										field.state.meta.errors[0] ? (
											<p className="mt-1 text-xs text-red-400">
												{String(field.state.meta.errors[0])}
											</p>
										) : null}
									</div>
								)}
							</form.Field>

							<form.Field
								name="password"
								validators={{
									onChange: validateField([
										validators.required("Password is required."),
									]),
								}}
							>
								{(field) => (
									<div>
										<div className="mb-1.5 flex items-center justify-between">
											<label
												htmlFor={field.name}
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
											id={field.name}
											name={field.name}
											type="password"
											autoComplete="current-password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											hasError={
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											}
											placeholder="Enter password"
											required
											disabled={form.state.isSubmitting || passkeySubmitting}
										/>

										{field.state.meta.isTouched &&
										field.state.meta.errors[0] ? (
											<p className="mt-1 text-xs text-red-400">
												{String(field.state.meta.errors[0])}
											</p>
										) : null}
									</div>
								)}
							</form.Field>

							<form.Field name="rememberMe">
								{(field) => (
									<div className="pt-1">
										<label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-400 select-none">
											<input
												type="checkbox"
												name={field.name}
												checked={field.state.value}
												onChange={(event) =>
													field.handleChange(event.target.checked)
												}
												disabled={form.state.isSubmitting || passkeySubmitting}
												className="h-4 w-4 rounded border-white/10 bg-zinc-900 accent-violet-500"
											/>
											Remember this device
										</label>
									</div>
								)}
							</form.Field>

							<form.Subscribe selector={(state) => [state.isSubmitting]}>
								{([isSubmitting]) => (
									<Button
										type="submit"
										loading={Boolean(isSubmitting)}
										disabled={Boolean(isSubmitting) || passkeySubmitting}
										className="w-full mt-2"
										size="lg"
									>
										Sign in
									</Button>
								)}
							</form.Subscribe>
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
							disabled={form.state.isSubmitting}
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
					</>
				)}
			</div>
		</PreAuthLayout>
	);
}
