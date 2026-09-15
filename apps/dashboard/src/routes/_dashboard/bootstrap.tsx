import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useMemo, useState } from "react";

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
import {
	type FieldValidators,
	validateForm,
	validators,
} from "@/lib/validation";

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

interface BootstrapForm {
	secret: string;
}

const BOOTSTRAP_VALIDATORS: FieldValidators<BootstrapForm> = {
	secret: [validators.required("Bootstrap secret is required.")],
};

function BootstrapPage() {
	const { refresh } = useAuth();
	const [form, setForm] = useState<BootstrapForm>({ secret: "" });
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const { isValid } = useMemo(
		() => validateForm(form, BOOTSTRAP_VALIDATORS),
		[form],
	);

	const canSubmit = isValid && !loading;

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		setLoading(true);
		setStatus(null);

		try {
			await bootstrapAdmin(form.secret.trim());
			await refresh();
			setForm({ secret: "" });
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
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-8 max-w-xl">
			<PageHeader
				title="Bootstrap administrator"
				description="Elevate your current account to super-administrator using the server environment bootstrap secret."
				badge={<Badge variant="warning">Setup Utility</Badge>}
			/>

			<Card>
				<form onSubmit={handleSubmit}>
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
						<div>
							<label
								htmlFor="bootstrap-secret"
								className="mb-2 block text-sm font-medium text-zinc-300"
							>
								Bootstrap Secret
							</label>

							<Input
								id="bootstrap-secret"
								type="password"
								value={form.secret}
								onChange={(event) => setForm({ secret: event.target.value })}
								placeholder="Enter bootstrap secret"
								required
								disabled={loading}
							/>
						</div>

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
						<Button type="submit" loading={loading} disabled={!canSubmit}>
							Claim Administrator
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
