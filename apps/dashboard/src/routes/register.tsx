import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import PreAuthLayout from "@/layouts/PreAuthLayout";
import { register } from "@/lib/api";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const toast = useToast();

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

	async function handleSubmit(
		event: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0],
	) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		setLoading(true);

		try {
			await register(normalizedEmail, password);
			await refresh();

			toast.success("Account created.");

			await navigate({
				to: "/",
			});
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

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-950">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<PreAuthLayout>
			<div>
				{/* Heading */}
				<div className="mb-8">
					<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
						Create your account
					</h1>

					<p className="mt-2 text-sm leading-6 text-zinc-500">
						Create your Muljax ID account to get started.
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<label
							htmlFor="email"
							className="mb-2 block text-sm font-medium text-zinc-300"
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
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Password
						</label>

						<Input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Create a password"
							autoComplete="new-password"
							disabled={loading}
							required
						/>

						<p
							className={`mt-2 text-xs ${
								password.length === 0
									? "text-zinc-600"
									: passwordValid
										? "text-emerald-400"
										: "text-zinc-500"
							}`}
						>
							{passwordValid
								? "Password meets the minimum requirements."
								: "Use at least 12 characters."}
						</p>
					</div>

					<div>
						<label
							htmlFor="confirm-password"
							className="mb-2 block text-sm font-medium text-zinc-300"
						>
							Confirm password
						</label>

						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							placeholder="Enter your password again"
							autoComplete="new-password"
							disabled={loading}
							required
						/>

						{confirmPassword.length > 0 && (
							<p
								className={`mt-2 text-xs ${
									passwordsMatch ? "text-emerald-400" : "text-red-400"
								}`}
							>
								{passwordsMatch
									? "Passwords match."
									: "Passwords do not match."}
							</p>
						)}
					</div>

					<Button type="submit" className="w-full" disabled={!canSubmit}>
						Create account
					</Button>
				</form>

				{/* Login */}
				<p className="mt-8 text-center text-sm text-zinc-500">
					Already have an account?{" "}
					<Link
						to="/login"
						className="font-medium text-violet-400 transition-colors hover:text-violet-300"
					>
						Sign in
					</Link>
				</p>
			</div>
		</PreAuthLayout>
	);
}
