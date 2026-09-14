import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { useState } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const toast = useToast();
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const normalizedEmail = email.trim();
	const emailValid =
		normalizedEmail.length > 0 &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!emailValid || submitting) {
			return;
		}

		setSubmitting(true);

		try {
			await requestPasswordReset(normalizedEmail);
			setSubmitted(true);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to submit password reset request. Please try again.";
			toast.error(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<PreAuthLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-400 shadow-inner">
						<KeyRound size={22} />
					</div>

					<h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
						Reset password
					</h1>

					<p className="text-xs text-zinc-400 sm:text-sm">
						Enter your email address to request a secure password reset.
					</p>
				</div>

				{submitted ? (
					<div className="space-y-6 pt-2">
						<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
							<div className="flex items-start gap-3">
								<CheckCircle2
									size={18}
									className="mt-0.5 shrink-0 text-emerald-400"
								/>
								<div className="text-xs text-emerald-200/90 space-y-1">
									<p className="font-medium text-emerald-300">
										Request submitted
									</p>
									<p className="text-zinc-400 leading-relaxed">
										If an account exists for{" "}
										<span className="font-mono text-zinc-200">
											{normalizedEmail}
										</span>
										, a reset request has been logged. An administrator can
										generate a one-time link to help you regain access.
									</p>
								</div>
							</div>
						</div>

						<Link
							to="/login"
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
						>
							<ArrowLeft size={14} />
							Return to sign in
						</Link>
					</div>
				) : (
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
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="you@example.com"
								required
								disabled={submitting}
							/>
						</div>

						<Button
							type="submit"
							loading={submitting}
							disabled={!emailValid}
							className="w-full mt-2"
							size="lg"
						>
							Request Reset
						</Button>

						<div className="pt-2 text-center">
							<Link
								to="/login"
								className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
							>
								<ArrowLeft size={13} />
								Back to sign in
							</Link>
						</div>
					</form>
				)}
			</div>
		</PreAuthLayout>
	);
}
