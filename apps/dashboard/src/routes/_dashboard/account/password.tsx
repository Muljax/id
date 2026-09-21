import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

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
import { validateField, validators } from "@/lib/validation";

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

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value, formApi }) => {
			try {
				await changePassword(value.currentPassword, value.newPassword);
				toast.success("Password changed successfully.");
				formApi.reset();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Unable to change your password.",
				);
			}
		},
	});

	return (
		<div className="space-y-8 max-w-2xl">
			<PageHeader
				title="Password"
				description="Manage your primary authentication password and active session security."
			/>

			<Card>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
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
						<form.Field
							name="currentPassword"
							validators={{
								onChange: validateField([
									validators.required("Current password is required."),
									validators.maxLength(
										128,
										"Current password must be 128 characters or fewer.",
									),
								]),
							}}
						>
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="mb-2 block text-sm font-medium text-zinc-300"
									>
										Current password
									</label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="current-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={form.state.isSubmitting}
										hasError={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										}
										required
									/>
									{field.state.meta.isTouched && field.state.meta.errors[0] ? (
										<p className="mt-2 text-xs text-red-400">
											{String(field.state.meta.errors[0])}
										</p>
									) : null}
								</div>
							)}
						</form.Field>

						<form.Field
							name="newPassword"
							validators={{
								onChangeListenTo: ["currentPassword"],
								onChange: validateField([
									validators.required("New password is required."),
									validators.password({
										min: 8,
										max: 128,
										message:
											"Password must be between 8 and 128 characters long.",
									}),
									validators.differentFrom(
										"currentPassword",
										"New password must be different from your current password.",
									),
								]),
							}}
						>
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="mb-2 block text-sm font-medium text-zinc-300"
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
										disabled={form.state.isSubmitting}
										hasError={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										}
										required
									/>
									{field.state.meta.isTouched && field.state.meta.errors[0] ? (
										<p className="mt-2 text-xs text-red-400">
											{String(field.state.meta.errors[0])}
										</p>
									) : (
										<p className="mt-2 text-xs text-zinc-500">
											Password must be between 8 and 128 characters long.
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="confirmPassword"
							validators={{
								onChangeListenTo: ["newPassword"],
								onChange: validateField([
									validators.required("Confirm new password is required."),
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
											className="mb-2 block text-sm font-medium text-zinc-300"
										>
											Confirm new password
										</label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											autoComplete="new-password"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={form.state.isSubmitting}
											hasError={
												Boolean(field.state.value) &&
												(!matches || field.state.meta.errors.length > 0)
											}
											required
										/>

										{field.state.value.length > 0 && !matches && (
											<p className="mt-2 text-xs text-red-400">
												Passwords do not match.
											</p>
										)}
									</div>
								);
							}}
						</form.Field>
					</CardContent>

					<CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-zinc-500">
							Updating your password will revoke all other active sign-in
							sessions.
						</p>

						<form.Subscribe selector={(state) => [state.isSubmitting]}>
							{([isSubmitting]) => (
								<Button
									type="submit"
									disabled={Boolean(isSubmitting)}
									loading={Boolean(isSubmitting)}
									className="w-full sm:w-auto"
								>
									Change password
								</Button>
							)}
						</form.Subscribe>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
