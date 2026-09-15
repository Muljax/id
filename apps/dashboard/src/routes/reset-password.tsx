import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import Spinner from "@/components/ui/Spinner";
import { confirmPasswordReset, verifyPasswordResetToken } from "@/lib/api";
import {
	type FieldValidators,
	validateForm,
	validators,
} from "@/lib/validation";

export interface ResetPasswordSearch {
	token?: string;
}

export const Route = createFileRoute("/reset-password")({
	validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
		token: typeof search.token === "string" ? search.token : undefined,
	}),
	staticData: {
		title: "Set New Password",
	},
	component: ResetPasswordPage,
});

interface ResetPasswordForm {
	newPassword: string;
	confirmPassword: string;
}

const RESET_PASSWORD_VALIDATORS: FieldValidators<ResetPasswordForm> = {
	newPassword: [
		validators.required("New password is required."),
		validators.password({
			min: 8,
			max: 128,
			message: "Password must be between 8 and 128 characters long.",
		}),
	],
	confirmPassword: [
		validators.required("Confirm password is required."),
		validators.matches("newPassword", "Passwords do not match."),
	],
};

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const toast = useToast();
	const navigate = useNavigate();

	const [checking, setChecking] = useState(true);
	const [valid, setValid] = useState(false);
	const [email, setEmail] = useState<string | null>(null);

	const [form, setForm] = useState<ResetPasswordForm>({
		newPassword: "",
		confirmPassword: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			setChecking(false);
			setValid(false);
			return;
		}

		let active = true;

		verifyPasswordResetToken(token)
			.then((res) => {
				if (active) {
					if (res.valid) {
						setValid(true);
						setEmail(res.email ?? null);
					} else {
						setValid(false);
					}
				}
			})
			.catch(() => {
				if (active) {
					setValid(false);
				}
			})
			.finally(() => {
				if (active) {
					setChecking(false);
				}
			});

		return () => {
			active = false;
		};
	}, [token]);

	const { errors, isValid } = useMemo(
		() => validateForm(form, RESET_PASSWORD_VALIDATORS),
		[form],
	);

	const passwordsMatch = Boolean(
		form.confirmPassword && !errors.confirmPassword,
	);
	const canSubmit = isValid && !submitting;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!token || !canSubmit) {
			return;
		}

		setSubmitting(true);

		try {
			await confirmPasswordReset(token, form.newPassword);
			setSuccess(true);
			toast.success("Password reset successfully. You may now log in.");
			setTimeout(() => {
				void navigate({ to: "/login" });
			}, 2000);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to reset password. The link may have expired.";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	}

	if (checking) {
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center justify-center py-12 space-y-4">
					<Spinner size="lg" />
					<p className="text-xs text-zinc-400">
						Verifying password reset link...
					</p>
				</div>
			</PreAuthLayout>
		);
	}

	if (!token || !valid) {
		return (
			<PreAuthLayout>
				<div className="text-center space-y-6">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-inner">
						<AlertCircle size={22} />
					</div>

					<div className="space-y-2">
						<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
							Invalid or Expired Link
						</h1>
						<p className="text-xs text-zinc-400 leading-relaxed sm:text-sm">
							This password reset link is invalid, has expired, or has already
							been used. Please request a new link or contact your
							administrator.
						</p>
					</div>

					<div className="flex flex-col gap-2 pt-2">
						<Link
							to="/forgot-password"
							className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-violet-500"
						>
							Request New Reset
						</Link>

						<Link
							to="/login"
							className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
						>
							Return to Sign In
						</Link>
					</div>
				</div>
			</PreAuthLayout>
		);
	}

	if (success) {
		return (
			<PreAuthLayout>
				<div className="text-center space-y-6">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner">
						<CheckCircle2 size={22} />
					</div>

					<div className="space-y-2">
						<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
							Password Updated
						</h1>
						<p className="text-xs text-zinc-400 sm:text-sm">
							Your password has been reset successfully. Redirecting you to sign
							in...
						</p>
					</div>

					<Link
						to="/login"
						className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-violet-500"
					>
						Go to Sign In Now
					</Link>
				</div>
			</PreAuthLayout>
		);
	}

	return (
		<PreAuthLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<InstanceLogo className="mx-auto h-12 w-12 rounded-2xl mb-3 shadow-lg" />

					<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
						Choose new password
					</h1>

					<p className="text-xs text-zinc-400 sm:text-sm">
						{email ? (
							<>
								Setting a new password for{" "}
								<span className="font-mono text-zinc-200">{email}</span>
							</>
						) : (
							"Choose a strong password with at least 8 characters."
						)}
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="new-password"
							className="mb-1.5 block text-xs font-medium text-zinc-300"
						>
							New password
						</label>

						<Input
							id="new-password"
							type="password"
							autoComplete="new-password"
							value={form.newPassword}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									newPassword: event.target.value,
								}))
							}
							placeholder="At least 8 characters"
							required
							disabled={submitting}
						/>
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
							autoComplete="new-password"
							value={form.confirmPassword}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									confirmPassword: event.target.value,
								}))
							}
							placeholder="Re-enter new password"
							hasError={Boolean(form.confirmPassword && !passwordsMatch)}
							required
							disabled={submitting}
						/>
					</div>

					{form.confirmPassword.length > 0 && !passwordsMatch && (
						<p className="text-[11px] text-red-400">Passwords do not match.</p>
					)}

					<Button
						type="submit"
						loading={submitting}
						disabled={!canSubmit}
						className="w-full mt-2"
						size="lg"
						icon={<ShieldCheck size={16} />}
					>
						Set New Password
					</Button>
				</form>
			</div>
		</PreAuthLayout>
	);
}
