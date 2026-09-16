import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import PreAuthLayout from "@/components/PreAuthLayout";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InstanceLogo from "@/components/ui/InstanceLogo";
import { useAuth } from "@/context/AuthContext";
import { register } from "@/lib/api";
import { INSTANCE_NAME } from "@/lib/config";
import { validateField, validators } from "@/lib/validation";

export interface RegisterSearch {
	return_to?: string;
}

export const Route = createFileRoute("/register")({
	validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
		return_to:
			typeof search.return_to === "string" ? search.return_to : undefined,
	}),
	staticData: {
		title: "Create Account",
	},
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
	const { user, setUser } = useAuth();
	const toast = useToast();
	const { return_to } = Route.useSearch();

	useEffect(() => {
		if (user) {
			const destination = getSafeReturnTo(return_to);
			if (destination) {
				window.location.href = destination;
			} else {
				void navigate({ to: "/" });
			}
		}
	}, [user, return_to, navigate]);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const response = await register(value.email.trim(), value.password);
				setUser(response.user);

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
			}
		},
	});

	return (
		<PreAuthLayout>
			<div className="space-y-6">
				{/* Heading */}
				<div className="space-y-3">
					<InstanceLogo className="h-10 w-10 rounded-xl" />

					<div>
						<h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
							Create your account
						</h1>

						<p className="mt-1.5 text-sm text-zinc-400">
							Set up your{" "}
							<span className="text-violet-400 font-medium">
								{INSTANCE_NAME}
							</span>{" "}
							account to authenticate securely.
						</p>
					</div>
				</div>

				{/* Form */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
					className="space-y-4"
				>
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
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="you@example.com"
									autoComplete="email"
									autoFocus
									disabled={form.state.isSubmitting}
									hasError={
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0
									}
									required
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
						name="password"
						validators={{
							onChange: validateField([
								validators.required("Password is required."),
								validators.password({
									min: 12,
									max: 128,
									message: "Must be between 12 and 128 characters long.",
								}),
							]),
						}}
					>
						{(field) => {
							const isValid =
								field.state.value.length >= 12 &&
								field.state.value.length <= 128;

							return (
								<div>
									<label
										htmlFor={field.name}
										className="mb-1.5 block text-xs font-medium text-zinc-300"
									>
										Password
									</label>

									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Create a strong password"
										autoComplete="new-password"
										disabled={form.state.isSubmitting}
										hasError={
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										}
										required
									/>

									<p
										className={`mt-1.5 text-xs ${
											field.state.value.length === 0
												? "text-zinc-500"
												: isValid
													? "text-emerald-400"
													: "text-amber-400"
										}`}
									>
										{isValid
											? "Password meets security requirements."
											: "Must be between 12 and 128 characters long."}
									</p>
								</div>
							);
						}}
					</form.Field>

					<form.Field
						name="confirmPassword"
						validators={{
							onChangeListenTo: ["password"],
							onChange: validateField([
								validators.required("Confirm password is required."),
								validators.matches("password", "Passwords do not match."),
							]),
						}}
					>
						{(field) => {
							const matches =
								field.state.value.length > 0 &&
								field.state.value === form.state.values.password;

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
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Re-enter your password"
										autoComplete="new-password"
										disabled={form.state.isSubmitting}
										hasError={
											Boolean(field.state.value) &&
											(!matches || field.state.meta.errors.length > 0)
										}
										required
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
								className="w-full mt-2"
								size="lg"
								loading={Boolean(isSubmitting)}
								disabled={Boolean(isSubmitting)}
							>
								Create account
							</Button>
						)}
					</form.Subscribe>
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
