import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { type FormEvent, useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Card, {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
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
		currentPassword.length <= 128 &&
		newPassword.length >= 8 &&
		newPassword.length <= 128 &&
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
		<div className="space-y-8 max-w-2xl">
			<PageHeader
				title="Password"
				description="Manage your primary authentication password and active session security."
			/>

			<Card>
				<form onSubmit={handleSubmit}>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-violet-400">
								<Lock size={18} />
							</div>
							<div>
								<CardTitle className="text-sm font-semibold">
									Change password
								</CardTitle>
								<p className="text-xs text-zinc-400">
									Choose a strong password between 8 and 128 characters.
								</p>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-5">
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
								required
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
								required
							/>
							<p className="mt-2 text-xs text-zinc-500">
								Password must be between 8 and 128 characters long.
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
								hasError={Boolean(confirmPassword && !passwordsMatch)}
								required
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
					</CardContent>

					<CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-zinc-500">
							Updating your password will revoke all other active sign-in
							sessions.
						</p>

						<Button
							type="submit"
							disabled={!isValid || saving}
							loading={saving}
							className="w-full sm:w-auto"
						>
							Change password
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
