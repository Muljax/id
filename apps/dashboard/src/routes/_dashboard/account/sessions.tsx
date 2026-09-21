import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { useMemo, useState } from "react";

import SessionCard from "@/components/sessions/SessionCard";
import SessionGeoMap from "@/components/sessions/SessionGeoMap";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useStepUp } from "@/context/StepUpContext";
import { ApiError } from "@/lib/api/client";
import {
	getSessions,
	revokeAllOtherSessions,
	revokeSession,
	type Session,
} from "@/lib/api/sessions";
import { queryKeys } from "@/lib/queryKeys";

export const Route = createFileRoute("/_dashboard/account/sessions")({
	staticData: {
		navigation: {
			label: "Sessions",
			order: 25,
		},
	},
	component: AccountSessionsPage,
});

function AccountSessionsPage() {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { logout } = useAuth();
	const { elevate } = useStepUp();

	const [revokeAllOpen, setRevokeAllOpen] = useState(false);
	const [highlightedId, setHighlightedId] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: queryKeys.account.sessions,
		queryFn: getSessions,
	});

	const sessions = useMemo(() => data?.sessions ?? [], [data]);
	const otherSessionsCount = useMemo(
		() => sessions.filter((s) => !s.current).length,
		[sessions],
	);

	const revokeSingleMutation = useMutation({
		mutationFn: async (session: Session) => {
			if (session.current) {
				await logout();
				return;
			}
			await revokeSession(session.id);
		},
		onSuccess: (_, session) => {
			if (!session.current) {
				toast.success("Session revoked successfully.");
				void queryClient.invalidateQueries({
					queryKey: queryKeys.account.sessions,
				});
			}
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to revoke session.");
		},
	});

	const revokeAllMutation = useMutation({
		mutationFn: async () => {
			try {
				return await revokeAllOtherSessions();
			} catch (err) {
				if (err instanceof ApiError && err.code === "STEP_UP_REQUIRED") {
					const ok = await elevate();
					if (ok) {
						return await revokeAllOtherSessions();
					}
					throw new Error("Step-up authentication cancelled.");
				}
				throw err;
			}
		},
		onSuccess: () => {
			toast.success("All other active sessions have been terminated.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.account.sessions,
			});
			setRevokeAllOpen(false);
		},
		onError: (err: Error) => {
			if (err.message !== "Step-up authentication cancelled.") {
				toast.error(err.message || "Failed to revoke sessions.");
			}
		},
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Active Sessions"
				description="Audit logged-in devices, active sessions, and geographic access locations."
				actions={
					otherSessionsCount > 0 && (
						<Button
							type="button"
							variant="danger"
							size="sm"
							icon={<LogOut size={14} />}
							onClick={() => setRevokeAllOpen(true)}
						>
							Revoke other sessions ({otherSessionsCount})
						</Button>
					)
				}
			/>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Spinner size="lg" />
				</div>
			) : sessions.length === 0 ? (
				<EmptyState
					icon={<MonitorSmartphone size={32} />}
					title="No active sessions found"
					description="Your active sessions will appear here once authenticated."
				/>
			) : (
				<div className="space-y-6">
					<SessionGeoMap
						sessions={sessions}
						highlightedSessionId={highlightedId}
						onHoverSession={setHighlightedId}
						onSelectSession={(s) => setHighlightedId(s.id)}
					/>

					<Card>
						<CardHeader>
							<CardTitle>
								Connected Devices & Sessions ({sessions.length})
							</CardTitle>
						</CardHeader>
						<div className="divide-y divide-white/6">
							{sessions.map((session) => (
								<SessionCard
									key={session.id}
									session={session}
									isCurrent={Boolean(session.current)}
									loading={
										revokeSingleMutation.isPending &&
										revokeSingleMutation.variables?.id === session.id
									}
									highlighted={highlightedId === session.id}
									onMouseEnter={() => setHighlightedId(session.id)}
									onMouseLeave={() => setHighlightedId(null)}
									onRevoke={(s) => revokeSingleMutation.mutate(s)}
								/>
							))}
						</div>
					</Card>
				</div>
			)}

			<ConfirmModal
				open={revokeAllOpen}
				onClose={() => setRevokeAllOpen(false)}
				onConfirm={async () => {
					await revokeAllMutation.mutateAsync();
				}}
				title="Revoke all other sessions"
				description="Sign out all other devices currently authenticated with your account."
				confirmButtonLabel="Sign out other devices"
				confirmButtonIcon={<LogOut size={14} />}
				warningMessage={
					<div>
						<strong>Security Notice:</strong> This action will immediately
						terminate {otherSessionsCount} other active session
						{otherSessionsCount === 1 ? "" : "s"} across all other browsers and
						devices. Your current session will remain active.
					</div>
				}
			/>
		</div>
	);
}
