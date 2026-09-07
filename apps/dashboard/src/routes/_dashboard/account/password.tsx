import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";

import { useToast } from "@/components/toast/ToastProvider";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { changePassword } from "@/lib/api";

export const Route = createFileRoute("/_dashboard/account/password")({
	staticData: {
		navigation: {
			label: "Password",
			order: 2,
		},
	},
	component: ChangePasswordPage,
});

function ChangePasswordPage() {
	const toast = useToast();

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [saving, setSaving] = useState(false);

	const passwordsMatch = newPassword === confirmPassword;
	const passwordIsDifferent = newPassword !== currentPassword;

	const isValid =
		currentPassword.length > 0 &&
		newPassword.length >= 8 &&
		passwordsMatch &&
		passwordIsDifferent;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!isValid) {
			return;
		}

		setSaving(true);

		try {
			await changePassword(currentPassword, newPassword);

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");

			toast.success("Password changed successfully.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to change your password.",
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="max-w-2xl">
			<div className="mb-8">
				<h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
					Password
				</h1>
				<p className="mt-2 text-sm leading-6 text-zinc-500">
					Update the password you use to sign in to Muljax ID.
				</p>
			</div>

			<div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
				<form onSubmit={handleSubmit}>
					<div className="px-6 py-6">
						<div className="mb-6">
							<h2 className="text-sm font-medium text-white">
								Change password
							</h2>
							<p className="mt-1 text-sm text-zinc-500">
								Choose a new password for your account.
							</p>
						</div>

						<div className="space-y-5">
							<div>
								<label
									htmlFor="current-password"
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									Current password
								</label>
								<Input
									id="current-password"
									type="password"
									autoComplete="current-password"
									value={currentPassword}
									onChange={(event) => setCurrentPassword(event.target.value)}
									disabled={saving}
								/>
							</div>

							<div>
								<label
									htmlFor="new-password"
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									New password
								</label>
								<Input
									id="new-password"
									type="password"
									autoComplete="new-password"
									value={newPassword}
									onChange={(event) => setNewPassword(event.target.value)}
									disabled={saving}
								/>
								<p className="mt-2 text-xs text-zinc-600">
									Password must be at least 8 characters.
								</p>
							</div>

							<div>
								<label
									htmlFor="confirm-password"
									className="mb-2 block text-sm font-medium text-zinc-300"
								>
									Confirm new password
								</label>
								<Input
									id="confirm-password"
									type="password"
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									disabled={saving}
								/>

								{confirmPassword && !passwordsMatch && (
									<p className="mt-2 text-xs text-red-400">
										Passwords do not match.
									</p>
								)}

								{newPassword && currentPassword && !passwordIsDifferent && (
									<p className="mt-2 text-xs text-red-400">
										New password must be different from your current password.
									</p>
								)}
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-3 border-t border-white/8 bg-white/1.5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs leading-5 text-zinc-600">
							You will be signed out of your other sessions.
						</p>

						<Button type="submit" disabled={!isValid || saving}>
							{saving ? "Changing..." : "Change password"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
