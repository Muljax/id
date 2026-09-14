import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { register } from "@/lib/api";

export interface RegisterSearch {
	return_to?: string;
}

export const Route = createFileRoute("/register")({
	validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
		return_to:
			typeof search.return_to === "string" ? search.return_to : undefined,
	}),
	component: RegisterPage,
});

function getSafeReturnTo(value: string | undefined) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return null;
	}

	return value;
}

function RegisterPage() {
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const toast = useToast();
	const { return_to } = Route.useSearch();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const normalizedEmail = email.trim();

	const emailValid =
		normalizedEmail.length > 0 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

	const passwordValid = password.length >= 12;

	const passwordsMatch =
		confirmPassword.length > 0 && password === confirmPassword;

	const canSubmit = emailValid && passwordValid && passwordsMatch && !loading;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		setLoading(true);

		try {
			await register(normalizedEmail, password);
			await refresh();

			toast.success("Account created successfully.");

			const destination = getSafeReturnTo(return_to);

			if (destination) {
				const url = new URL(destination, window.location.origin);
				window.location.href = url.toString();
				return;
			}

			await navigate({ to: "/" });
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to create your account.",
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<PreAuthLayout>
			<div className="space-y-6">
				{/* Heading */}
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Create your account
					</h1>

					<p className="mt-1.5 text-sm text-zinc-400">
						Set up your Muljax ID account to authenticate securely.
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-4">
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
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="you@example.com"
							autoComplete="email"
							autoFocus
							disabled={loading}
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-1.5 block text-xs font-medium text-zinc-300"
						>
							Password
						</label>

						<Input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Create a strong password"
							autoComplete="new-password"
							disabled={loading}
							required
						/>

						<p
							className={`mt-1.5 text-xs ${
								password.length === 0
									? "text-zinc-500"
									: passwordValid
										? "text-emerald-400"
										: "text-amber-400"
							}`}
						>
							{passwordValid
								? "Password meets security requirements."
								: "Must be at least 12 characters long."}
						</p>
					</div>

					<div>
						<label
							htmlFor="confirm-password"
							className="mb-1.5 block text-xs font-medium text-zinc-300"
						>
							Confirm password
						</label>

						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							placeholder="Re-enter your password"
							autoComplete="new-password"
							disabled={loading}
							hasError={Boolean(confirmPassword && !passwordsMatch)}
							required
						/>

						{confirmPassword.length > 0 && (
							<p
								className={`mt-1.5 text-xs ${
									passwordsMatch ? "text-emerald-400" : "text-red-400"
								}`}
							>
								{passwordsMatch
									? "Passwords match."
									: "Passwords do not match."}
							</p>
						)}
					</div>

					<Button
						type="submit"
						className="w-full mt-2"
						size="lg"
						loading={loading}
						disabled={!canSubmit}
					>
						Create account
					</Button>
				</form>

				{/* Sign in link */}
				<p className="pt-2 text-center text-xs text-zinc-400">
					Already have an account?{" "}
					<Link
						to="/login"
						search={return_to ? { return_to } : undefined}
						className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
					>
						Sign in
					</Link>
				</p>
			</div>
		</PreAuthLayout>
	);
}
