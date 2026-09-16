import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import Spinner from "@/components/ui/Spinner";
import { confirmPasswordReset, verifyPasswordResetToken } from "@/lib/api";
import { validateField, validators } from "@/lib/validation";

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

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const toast = useToast();
	const navigate = useNavigate();

	const [checking, setChecking] = useState(true);
	const [valid, setValid] = useState(false);
	const [email, setEmail] = useState<string | null>(null);
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

	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (!token) {
				return;
			}

			try {
				await confirmPasswordReset(token, value.newPassword);
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
			}
		},
	});

	if (checking) {
		return (
			<PreAuthLayout>
				<div className="flex flex-col items-center justify-center py-12">
					<Spinner size="lg" />
					<p className="mt-4 text-xs font-medium text-zinc-400">
						Verifying reset token...
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

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field
						name="newPassword"
						validators={{
							onChange: validateField([
								validators.required("New password is required."),
								validators.password({
									min: 8,
									max: 128,
									message:
										"Password must be between 8 and 128 characters long.",
								}),
							]),
						}}
					>
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="mb-1.5 block text-xs font-medium text-zinc-300"
								>
									New password
								</label>

								<Input
									id={field.name}
									name={field.name}
									type="password"
									autoComplete="new-password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="At least 8 characters"
									required
									disabled={form.state.isSubmitting}
									hasError={
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0
									}
								/>

								{field.state.meta.isTouched && field.state.meta.errors[0] ? (
									<p className="mt-1 text-xs text-red-400">
										{String(field.state.meta.errors[0])}
									</p>
								) : null}
							</div>
						)}
					</form.Field>

					<form.Field
						name="confirmPassword"
						validators={{
							onChangeListenTo: ["newPassword"],
							onChange: validateField([
								validators.required("Confirm password is required."),
								validators.matches("newPassword", "Passwords do not match."),
							]),
						}}
					>
						{(field) => {
							const matches =
								field.state.value.length > 0 &&
								field.state.value === form.state.values.newPassword;

							return (
								<div>
									<label
										htmlFor={field.name}
										className="mb-1.5 block text-xs font-medium text-zinc-300"
									>
										Confirm password
									</label>

									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Re-enter new password"
										hasError={
											Boolean(field.state.value) &&
											(!matches || field.state.meta.errors.length > 0)
										}
										required
										disabled={form.state.isSubmitting}
									/>

									{field.state.value.length > 0 && (
										<p
											className={`mt-1.5 text-xs ${
												matches ? "text-emerald-400" : "text-red-400"
											}`}
										>
											{matches ? "Passwords match." : "Passwords do not match."}
										</p>
									)}
								</div>
							);
						}}
					</form.Field>

					<form.Subscribe selector={(state) => [state.isSubmitting]}>
						{([isSubmitting]) => (
							<Button
								type="submit"
								loading={Boolean(isSubmitting)}
								disabled={Boolean(isSubmitting)}
								className="w-full mt-2"
								size="lg"
								icon={<ShieldCheck size={16} />}
							>
								Set New Password
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>
		</PreAuthLayout>
	);
}
