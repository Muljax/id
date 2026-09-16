import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card, {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { bootstrapAdmin } from "@/lib/api";
import { validateField, validators } from "@/lib/validation";

export const Route = createFileRoute("/_dashboard/bootstrap")({
	staticData: {
		navigation: {
			label: "Bootstrap",
			order: 30,
			hidden: true,
		},
	},
	component: BootstrapPage,
});

function BootstrapPage() {
	const { refresh } = useAuth();
	const [status, setStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const form = useForm({
		defaultValues: {
			secret: "",
		},
		onSubmit: async ({ value, formApi }) => {
			setStatus(null);

			try {
				await bootstrapAdmin(value.secret.trim());
				await refresh();
				formApi.reset();
				setStatus({
					type: "success",
					message:
						"Admin bootstrap successful. You now have administrator permissions.",
				});
			} catch (error) {
				setStatus({
					type: "error",
					message: error instanceof Error ? error.message : "Bootstrap failed.",
				});
			}
		},
	});

	return (
		<div className="space-y-8 max-w-xl">
			<PageHeader
				title="Bootstrap administrator"
				description="Elevate your current account to super-administrator using the server environment bootstrap secret."
				badge={<Badge variant="warning">Setup Utility</Badge>}
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
							<div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-amber-400">
								<KeyRound size={18} />
							</div>
							<div>
								<CardTitle className="text-sm font-semibold">
									Master Secret
								</CardTitle>
								<p className="text-xs text-zinc-400">
									Configured in your Cloudflare Worker environment secrets.
								</p>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-4">
						<form.Field
							name="secret"
							validators={{
								onChange: validateField(
									validators.required("Bootstrap secret is required."),
								),
							}}
						>
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="mb-2 block text-sm font-medium text-zinc-300"
									>
										Bootstrap Secret
									</label>

									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Enter bootstrap secret"
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

						{status && (
							<div
								className={`rounded-xl border p-3.5 text-xs ${
									status.type === "success"
										? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
										: "border-red-500/20 bg-red-500/10 text-red-400"
								}`}
							>
								{status.message}
							</div>
						)}
					</CardContent>

					<CardFooter>
						<form.Subscribe selector={(state) => [state.isSubmitting]}>
							{([isSubmitting]) => (
								<Button
									type="submit"
									loading={Boolean(isSubmitting)}
									disabled={Boolean(isSubmitting)}
								>
									Claim Administrator
								</Button>
							)}
						</form.Subscribe>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
