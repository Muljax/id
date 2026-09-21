import { Globe, Laptop, LogOut, MapPin, Smartphone } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EntityRow from "@/components/ui/EntityRow";
import type { Session } from "@/lib/api/sessions";

interface SessionCardProps {
	session: Session;
	isCurrent?: boolean;
	onRevoke?: (session: Session) => void;
	loading?: boolean;
	highlighted?: boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}

function getDeviceIcon(os?: string | null) {
	const normalized = (os || "").toLowerCase();
	if (
		normalized.includes("ios") ||
		normalized.includes("android") ||
		normalized.includes("mobile")
	) {
		return <Smartphone size={16} className="text-violet-400" />;
	}
	if (
		normalized.includes("mac") ||
		normalized.includes("windows") ||
		normalized.includes("linux")
	) {
		return <Laptop size={16} className="text-violet-400" />;
	}
	return <Globe size={16} className="text-violet-400" />;
}

export default function SessionCard({
	session,
	isCurrent = false,
	onRevoke,
	loading = false,
	highlighted = false,
	onMouseEnter,
	onMouseLeave,
}: SessionCardProps) {
	const browser = session.browser || "Web Browser";
	const os = session.os || "Device";
	const location = [session.city, session.region, session.country]
		.filter(Boolean)
		.join(", ");

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: decorative mouse hover highlighting between map and card list
		<div
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			className={`transition-all duration-150 ${
				highlighted ? "ring-1 ring-violet-500/50 bg-violet-500/[0.04]" : ""
			}`}
		>
			<EntityRow
				avatar={
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-zinc-900/80 shadow-inner">
						{getDeviceIcon(session.os)}
					</div>
				}
				title={
					<span className="text-sm font-medium text-white">
						{browser} on {os}
					</span>
				}
				badges={
					<>
						{isCurrent && (
							<Badge variant="violet" size="sm">
								Current Device
							</Badge>
						)}
						{location && (
							<span className="inline-flex items-center gap-1 text-xs text-zinc-400">
								<MapPin size={11} className="text-zinc-500" />
								{location}
							</span>
						)}
					</>
				}
				subtitle={
					<span className="font-mono text-xs text-zinc-400">
						{session.ipAddress || "Unknown IP address"}
					</span>
				}
				meta={
					<span>
						Active since {new Date(session.createdAt).toLocaleDateString()}
					</span>
				}
				actions={
					onRevoke && (
						<Button
							type="button"
							variant={isCurrent ? "secondary" : "danger"}
							size="sm"
							icon={<LogOut size={13} />}
							loading={loading}
							onClick={() => onRevoke(session)}
						>
							{isCurrent ? "Sign out" : "Revoke"}
						</Button>
					)
				}
			/>
		</div>
	);
}
