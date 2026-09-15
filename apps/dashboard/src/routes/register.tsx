import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { register } from "@/lib/api";
import {
	type FieldValidators,
	validateForm,
	validators,
} from "@/lib/validation";

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

interface RegisterForm {
	email: string;
	password: string;
	confirmPassword: string;
}

const REGISTER_VALIDATORS: FieldValidators<RegisterForm> = {
	email: [
		validators.required("Email address is required."),
		validators.email(),
	],
	password: [
		validators.required("Password is required."),
		validators.password({
			min: 12,
			max: 128,
			message: "Must be between 12 and 128 characters long.",
		}),
	],
	confirmPassword: [
		validators.required("Confirm password is required."),
		validators.matches("password", "Passwords do not match."),
	],
};

function RegisterPage() {
	const navigate = useNavigate();
	const { refresh } = useAuth();
	const toast = useToast();
	const { return_to } = Route.useSearch();

	const [form, setForm] = useState<RegisterForm>({
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);

	const { errors, isValid } = useMemo(
		() => validateForm(form, REGISTER_VALIDATORS),
		[form],
	);

	const passwordValid = Boolean(form.password && !errors.password);
	const passwordsMatch = Boolean(
		form.confirmPassword && !errors.confirmPassword,
	);
	const canSubmit = isValid && !loading;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		setLoading(true);

		try {
			await register(form.email.trim(), form.password);
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
							value={form.email}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									email: event.target.value,
								}))
							}
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
							value={form.password}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									password: event.target.value,
								}))
							}
							placeholder="Create a strong password"
							autoComplete="new-password"
							disabled={loading}
							required
						/>

						<p
							className={`mt-1.5 text-xs ${
								form.password.length === 0
									? "text-zinc-500"
									: passwordValid
										? "text-emerald-400"
										: "text-amber-400"
							}`}
						>
							{passwordValid
								? "Password meets security requirements."
								: "Must be between 12 and 128 characters long."}
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
							value={form.confirmPassword}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									confirmPassword: event.target.value,
								}))
							}
							placeholder="Re-enter your password"
							autoComplete="new-password"
							disabled={loading}
							hasError={Boolean(form.confirmPassword && !passwordsMatch)}
							required
						/>

						{form.confirmPassword.length > 0 && (
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
