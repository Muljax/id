import { Copy, Sparkles } from "lucide-react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";

interface ClientCredentialsViewProps {
	clientId: string;
	secret: string | null;
	isM2M?: boolean;
	onDone: () => void;
}

export default function ClientCredentialsView({
	clientId,
	secret,
	isM2M = false,
	onDone,
}: ClientCredentialsViewProps) {
	const toast = useToast();

	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-4">
				<div>
					<span className="text-xs font-medium text-amber-400">Client ID</span>
					<div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
						<code className="font-mono text-xs text-zinc-200 break-all">
							{clientId}
						</code>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							icon={<Copy size={13} />}
							onClick={() => {
								void navigator.clipboard.writeText(clientId);
								toast.success("Client ID copied to clipboard.");
							}}
						>
							Copy
						</Button>
					</div>
				</div>

				{secret && (
					<div>
						<span className="text-xs font-medium text-amber-400">
							Client Secret
						</span>
						<div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
							<code className="font-mono text-xs text-zinc-200 break-all">
								{secret}
							</code>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								icon={<Copy size={13} />}
								onClick={() => {
									void navigator.clipboard.writeText(secret);
									toast.success("Client secret copied to clipboard.");
								}}
							>
								Copy
							</Button>
						</div>
					</div>
				)}
			</div>

			{isM2M && secret && (
				<div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4 space-y-2">
					<div className="flex items-center gap-2 text-xs font-medium text-violet-300">
						<Sparkles size={14} />
						<span>M2M Token Request Example</span>
					</div>
					<p className="text-xs text-zinc-400">
						External services (like Keyzori) can obtain access tokens using:
					</p>
					<div className="rounded-xl border border-white/10 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
						<code>
							curl -X POST /oauth/token \<br />
							&nbsp;&nbsp;-u &quot;{clientId}:{secret}&quot; \<br />
							&nbsp;&nbsp;-d &quot;grant_type=client_credentials&quot; \<br />
							&nbsp;&nbsp;-d &quot;audience=keyzori&quot;
						</code>
					</div>
				</div>
			)}

			<Button type="button" className="w-full" onClick={onDone}>
				Done
			</Button>
		</div>
	);
}
