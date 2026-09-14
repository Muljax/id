import { Plus, X } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export const SUPPORTED_USER_SCOPES = [
	{
		id: "openid",
		label: "openid",
		description: "Required. Grants access to user identity and subject ID.",
		required: true,
	},
	{
		id: "profile",
		label: "profile",
		description: "Grants access to name, avatar, timezone, and profile fields.",
		required: false,
	},
	{
		id: "email",
		label: "email",
		description: "Grants access to user email address and verification state.",
		required: false,
	},
] as const;

interface ScopeSelectorProps {
	profile: "web_app" | "spa_native" | "m2m_service";
	scopes: string[];
	onChange: (scopes: string[]) => void;
	disabled?: boolean;
}

/**
 * UI selector for choosing standard OIDC scopes or managing custom machine-to-machine scopes.
 */
export default function ScopeSelector({
	profile,
	scopes,
	onChange,
	disabled = false,
}: ScopeSelectorProps) {
	const [customInput, setCustomInput] = useState("");

	function toggleUserScope(scopeId: string) {
		if (scopeId === "openid") return;
		if (scopes.includes(scopeId)) {
			onChange(scopes.filter((s) => s !== scopeId));
		} else {
			onChange([...scopes, scopeId]);
		}
	}

	function addCustomScope() {
		const trimmed = customInput.trim();
		if (!trimmed) return;
		if (!/^[a-zA-Z0-9_:.*-]+$/.test(trimmed)) {
			return;
		}
		if (!scopes.includes(trimmed)) {
			onChange([...scopes, trimmed]);
		}
		setCustomInput("");
	}

	function removeScope(scope: string) {
		if (profile !== "m2m_service" && scope === "openid") {
			return;
		}
		onChange(scopes.filter((s) => s !== scope));
	}

	if (profile === "web_app" || profile === "spa_native") {
		return (
			<div className="space-y-3">
				<p className="text-sm font-medium text-zinc-300">
					Supported User Scopes
				</p>

				<div className="space-y-2">
					{SUPPORTED_USER_SCOPES.map((item) => {
						const isChecked = scopes.includes(item.id);
						return (
							<label
								key={item.id}
								className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
									isChecked
										? "border-violet-500/40 bg-violet-500/10 text-white"
										: "border-white/8 bg-zinc-900/30 text-zinc-400 hover:bg-white/[0.04]"
								}`}
							>
								<div className="space-y-0.5">
									<div className="flex items-center gap-2">
										<span className="font-mono text-xs font-semibold text-white">
											{item.label}
										</span>
										{item.required && (
											<span className="text-[10px] font-medium text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded">
												Required
											</span>
										)}
									</div>
									<p className="text-xs text-zinc-400">{item.description}</p>
								</div>

								<input
									type="checkbox"
									checked={isChecked}
									disabled={item.required || disabled}
									onChange={() => toggleUserScope(item.id)}
									className="mt-1 rounded border-white/10 bg-zinc-800 accent-violet-500 cursor-pointer"
								/>
							</label>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium text-zinc-300">Machine Scopes</p>
				<span className="text-xs text-zinc-500">
					{scopes.length} {scopes.length === 1 ? "scope" : "scopes"}
				</span>
			</div>

			<div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-white/8 bg-zinc-950/60 min-h-[48px]">
				{scopes.length === 0 ? (
					<span className="text-xs text-zinc-600 italic">
						No scopes assigned. Add scopes below.
					</span>
				) : (
					scopes.map((scope) => (
						<span
							key={scope}
							className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-mono text-violet-200"
						>
							{scope}
							<button
								type="button"
								onClick={() => removeScope(scope)}
								disabled={disabled}
								className="text-violet-400 hover:text-white transition-colors cursor-pointer"
								title={`Remove ${scope}`}
							>
								<X size={12} />
							</button>
						</span>
					))
				)}
			</div>

			<div className="flex gap-2">
				<Input
					value={customInput}
					onChange={(e) => setCustomInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							addCustomScope();
						}
					}}
					placeholder="Enter scope (e.g. read:licenses, write:customers, admin)"
					disabled={disabled}
					className="text-xs font-mono"
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					disabled={!customInput.trim() || disabled}
					onClick={addCustomScope}
					icon={<Plus size={14} />}
				>
					Add scope
				</Button>
			</div>
			<p className="text-[11px] text-zinc-500">
				Specify the granular permission scopes this machine client is allowed to request.
			</p>
		</div>
	);
}
