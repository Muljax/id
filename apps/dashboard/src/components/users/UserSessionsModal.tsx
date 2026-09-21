import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, MonitorSmartphone, UserX } from "lucide-react";
import { useMemo, useState } from "react";

import SessionCard from "@/components/sessions/SessionCard";
import SessionGeoMap from "@/components/sessions/SessionGeoMap";
import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalErrorAlert } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import {
	type AdminUser,
	getUserAdminSessions,
	revokeAllUserAdminSessions,
	revokeUserAdminSession,
} from "@/lib/api/admin";
import type { Session } from "@/lib/api/sessions";
import { queryKeys } from "@/lib/queryKeys";

interface UserSessionsModalProps {
	open: boolean;
	user: AdminUser;
	isSelf: boolean;
	onClose: () => void;
	onManageLifecycle?: (user: AdminUser) => void;
}

export default function UserSessionsModal({
	open,
	user,
	isSelf,
	onClose,
	onManageLifecycle,
}: UserSessionsModalProps) {
	const toast = useToast();
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();
	const canWriteUsers = hasPermission("users:write");
	const canManageLifecycle = hasPermission("users:lifecycle");

	const [revokeAllOpen, setRevokeAllOpen] = useState(false);
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: queryKeys.admin.userSessions(user.id),
		queryFn: () => getUserAdminSessions(user.id),
		enabled: open,
	});

	const sessions: Session[] = useMemo(() => {
		return (data?.sessions ?? []).map((s) => ({
			...s,
			current: false,
		}));
	}, [data]);

	const revokeSingleMutation = useMutation({
		mutationFn: async (session: Session) => {
			setError(null);
			await revokeUserAdminSession(user.id, session.id);
		},
		onSuccess: () => {
			toast.success("User session terminated.");
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.userSessions(user.id),
			});
		},
		onError: (err: Error) => {
			setError(err.message || "Failed to terminate session.");
		},
	});

	const revokeAllMutation = useMutation({
		mutationFn: async () => {
			setError(null);
			await revokeAllUserAdminSessions(user.id);
		},
		onSuccess: () => {
			toast.success(`All active sessions for ${user.email} were terminated.`);
			void queryClient.invalidateQueries({
				queryKey: queryKeys.admin.userSessions(user.id),
			});
			setRevokeAllOpen(false);
		},
		onError: (err: Error) => {
			setError(err.message || "Failed to terminate sessions.");
		},
	});

	return (
		<>
			<Modal
				open={open}
				onClose={onClose}
				title={`Active Sessions: ${user.displayName || user.email}`}
				description="Inspect active devices, geographic login locations, and manage session status."
				size="xl"
			>
				<div className="space-y-5">
					<ModalErrorAlert error={error} />

					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
						<div className="text-xs text-zinc-400">
							Target user:{" "}
							<span className="font-mono text-white">{user.email}</span>
						</div>

						<div className="flex items-center gap-2">
							{canManageLifecycle && onManageLifecycle && !isSelf && (
								<Button
									type="button"
									variant="secondary"
									size="sm"
									icon={<UserX size={13} className="text-amber-400" />}
									onClick={() => {
										onClose();
										onManageLifecycle(user);
									}}
								>
									Disable account
								</Button>
							)}

							{canWriteUsers && sessions.length > 0 && (
								<Button
									type="button"
									variant="danger"
									size="sm"
									icon={<LogOut size={13} />}
									onClick={() => setRevokeAllOpen(true)}
								>
									Terminate all sessions ({sessions.length})
								</Button>
							)}
						</div>
					</div>

					{isLoading ? (
						<div className="flex justify-center py-12">
							<Spinner size="md" />
						</div>
					) : sessions.length === 0 ? (
						<EmptyState
							icon={<MonitorSmartphone size={32} />}
							title="No active sessions"
							description={`User ${user.email} has no active sessions.`}
						/>
					) : (
						<div className="space-y-4">
							<SessionGeoMap
								sessions={sessions}
								highlightedSessionId={highlightedId}
								onHoverSession={setHighlightedId}
								onSelectSession={(s) => setHighlightedId(s.id)}
								description={
									isSelf
										? "Live interactive map of devices logged into your account"
										: `Live interactive map of active device locations for ${user.displayName || user.email}`
								}
							/>

							<div className="divide-y divide-white/6 rounded-xl border border-white/8 bg-zinc-900/40">
								{sessions.map((session) => (
									<SessionCard
										key={session.id}
										session={session}
										loading={
											revokeSingleMutation.isPending &&
											revokeSingleMutation.variables?.id === session.id
										}
										highlighted={highlightedId === session.id}
										onMouseEnter={() => setHighlightedId(session.id)}
										onMouseLeave={() => setHighlightedId(null)}
										onRevoke={
											canWriteUsers
												? (s) => revokeSingleMutation.mutate(s)
												: undefined
										}
									/>
								))}
							</div>
						</div>
					)}

					<div className="flex justify-end pt-2 border-t border-white/8">
						<Button type="button" variant="secondary" onClick={onClose}>
							Close
						</Button>
					</div>
				</div>
			</Modal>

			<ConfirmModal
				open={revokeAllOpen}
				onClose={() => setRevokeAllOpen(false)}
				onConfirm={async () => {
					await revokeAllMutation.mutateAsync();
				}}
				title={`Terminate all sessions for ${user.email}`}
				description="Force sign out all devices currently authenticated for this user."
				confirmButtonLabel="Terminate all sessions"
				confirmButtonIcon={<LogOut size={14} />}
				warningMessage={
					<div>
						<strong>Security Warning:</strong> This will terminate all{" "}
						{sessions.length} active sessions immediately. The user will be
						required to re-authenticate with their credentials.
					</div>
				}
			/>
		</>
	);
}
