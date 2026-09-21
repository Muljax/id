import { Plus, Terminal, UserCheck, X } from "lucide-react";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const PRINCIPAL_REGEX = /^[a-zA-Z0-9_.][a-zA-Z0-9_.-]{0,63}$/;

interface CustomPrincipalManagerProps {
	principals: string[];
	onAddPrincipal: (principal: string) => void;
	onRemovePrincipal: (principal: string) => void;
}

export default function CustomPrincipalManager({
	principals,
	onAddPrincipal,
	onRemovePrincipal,
}: CustomPrincipalManagerProps) {
	const [newPrincipal, setNewPrincipal] = useState("");
	const [error, setError] = useState<string | null>(null);

	function handleAdd() {
		const trimmed = newPrincipal.trim().toLowerCase();
		if (!trimmed) return;

		if (trimmed === "*") {
			onAddPrincipal("*");
			setNewPrincipal("");
			setError(null);
			return;
		}

		if (!PRINCIPAL_REGEX.test(trimmed)) {
			setError(
				"Principal must be a valid POSIX username (letters, digits, '.', '_', '-').",
			);
			return;
		}

		if (principals.includes(trimmed)) {
			setError(`Principal '${trimmed}' is already granted.`);
			return;
		}

		setError(null);
		setNewPrincipal("");
		onAddPrincipal(trimmed);
	}

	return (
		<div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-3">
			<div>
				<div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300">
					<Terminal size={14} />
					<span>Custom SSH Principals</span>
				</div>
				<p className="text-[11px] text-zinc-400 mt-0.5">
					Allow members of this role to claim specific UNIX usernames on issued
					certificates.
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Input
					value={newPrincipal}
					onChange={(e) => {
						setNewPrincipal(e.target.value);
						if (error) setError(null);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							e.stopPropagation();
							handleAdd();
						}
					}}
					placeholder="e.g. deploy, postgres, ubuntu"
					className="h-8 text-xs font-mono"
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					icon={<Plus size={13} />}
					onClick={handleAdd}
				>
					Add
				</Button>
			</div>

			{error && <p className="text-xs text-red-400">{error}</p>}

			{principals.length > 0 && (
				<div className="flex flex-wrap gap-1.5 pt-1">
					{principals.map((principal) => (
						<span
							key={principal}
							className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-mono text-violet-200"
						>
							<UserCheck size={12} className="text-violet-400" />
							ssh:principal:{principal}
							<button
								type="button"
								onClick={() => onRemovePrincipal(principal)}
								className="text-zinc-400 hover:text-white transition-colors cursor-pointer ml-0.5"
								aria-label={`Remove principal ${principal}`}
							>
								<X size={12} />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}
