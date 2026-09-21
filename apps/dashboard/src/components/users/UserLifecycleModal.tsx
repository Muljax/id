import { useForm } from "@tanstack/react-form";
import { Calendar, CheckCircle2, Clock, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, { ModalWarningAlert } from "@/components/ui/Modal";
import { getUserStatus } from "@/components/users/status";
import {
	executeUserLifecycle,
	type AdminUser,
	type LifecycleAction,
} from "@/lib/api/admin";
import {
	type FieldValidators,
	validateField,
	validators,
} from "@/lib/validation";

interface ScheduleForm {
	date: string;
	time: string;
}

const SCHEDULE_VALIDATORS: FieldValidators<ScheduleForm> = {
	date: [validators.required("Date is required.")],
	time: [validators.required("Time is required.")],
};

interface UserLifecycleModalProps {
	user: AdminUser;
	isSelf: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function UserLifecycleModal({
	user,
	isSelf,
	onClose,
	onSuccess,
}: UserLifecycleModalProps) {
	const toast = useToast();
	const status = getUserStatus(user);
	const [selectedAction, setSelectedAction] = useState<LifecycleAction>(
		status.isDisabled ? "enable" : "disable",
	);

	const action = selectedAction;

	const [scheduleMode, setScheduleMode] = useState<"immediate" | "scheduled">(
		status.isScheduled ? "scheduled" : "immediate",
	);

	const defaultDate = useMemo(() => {
		const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
		return tomorrow.toISOString().split("T")[0];
	}, []);

	const form = useForm({
		defaultValues: {
			date: defaultDate,
			time: "00:00",
		},
		onSubmit: async ({ value }) => {
			const executeAt =
				scheduleMode === "scheduled"
					? new Date(`${value.date}T${value.time}`).getTime()
					: null;

			try {
				await executeUserLifecycle(user.id, {
					action,
					executeAt,
				});

				if (action === "enable") {
					if (executeAt) {
						toast.success(
							`Activation scheduled for ${new Date(executeAt).toLocaleString()}.`,
						);
					} else {
						toast.success(`Account for ${user.email} enabled immediately.`);
					}
				} else if (action === "delete") {
					if (executeAt) {
						toast.success(
							`Deletion scheduled for ${new Date(executeAt).toLocaleString()}.`,
						);
					} else {
						toast.success(`Account for ${user.email} permanently deleted.`);
					}
				} else if (executeAt) {
					toast.success(
						`Deactivation scheduled for ${new Date(executeAt).toLocaleString()}.`,
					);
				} else {
					toast.success(
						`Account for ${user.email} disabled immediately. Active sessions revoked.`,
					);
				}

				onSuccess();
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to update account lifecycle.";
				toast.error(message);
			}
		},
	});

	return (
		<Modal
			open={true}
			title={
				action === "enable"
					? "Manage Account Activation"
					: action === "delete"
						? "Manage Account Deletion"
						: "Manage Account Deactivation"
			}
			description={`Update access status for ${user.displayName || user.email}.`}
			onClose={onClose}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-5"
			>
				{isSelf && (action === "disable" || action === "delete") ? (
					<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
						You cannot {action} your own administrator account.
					</div>
				) : (
					<>
						{!status.isDisabled && (
							<div>
								<span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
									Action Type
								</span>
								<div className="grid grid-cols-2 gap-2.5">
									<button
										type="button"
										onClick={() => setSelectedAction("disable")}
										className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
											selectedAction === "disable"
												? "border-amber-500/50 bg-amber-500/10 text-white"
												: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
										}`}
									>
										<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
											<UserX size={14} className="text-amber-400" />
											<span>Deactivate</span>
										</div>
										<span className="text-[11px] text-zinc-400 mt-1">
											Disable sign-in (reversible)
										</span>
									</button>

									<button
										type="button"
										onClick={() => setSelectedAction("delete")}
										className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
											selectedAction === "delete"
												? "border-red-500/50 bg-red-500/10 text-white"
												: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
										}`}
									>
										<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
											<UserX size={14} className="text-red-400" />
											<span>Permanent Delete</span>
										</div>
										<span className="text-[11px] text-zinc-400 mt-1">
											Purge all account records
										</span>
									</button>
								</div>
							</div>
						)}

						{action === "enable" ? (
							<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
								<CheckCircle2
									size={16}
									className="shrink-0 text-emerald-400 mt-0.5"
								/>
								<div>
									Enabling this account will restore sign-in access and allow
									the user to authenticate across all connected services.
								</div>
							</div>
						) : action === "delete" ? (
							<ModalWarningAlert variant="danger">
								<strong>Permanent Deletion:</strong> Deleting an account
								permanently removes all user records, sessions, SSH keys,
								certificates, and OAuth grants.
							</ModalWarningAlert>
						) : (
							<ModalWarningAlert variant="warning">
								Disabling an account immediately revokes all active sign-in
								sessions, terminates OAuth access & refresh tokens, and prevents
								authentication.
							</ModalWarningAlert>
						)}

						{status.isScheduled && user.disabledAt && (
							<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
								<span className="font-medium text-amber-300">
									Currently Scheduled:
								</span>{" "}
								Deactivation on{" "}
								<span className="font-mono text-white">
									{new Date(user.disabledAt).toLocaleString()}
								</span>
							</div>
						)}

						<div>
							<span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
								Timing & Execution
							</span>
							<div className="grid grid-cols-2 gap-2.5">
								<button
									type="button"
									onClick={() => setScheduleMode("immediate")}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										scheduleMode === "immediate"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										{action === "enable" ? (
											<UserCheck size={14} className="text-emerald-400" />
										) : (
											<UserX size={14} className="text-red-400" />
										)}
										<span>Immediate</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										{action === "enable"
											? "Activate right now"
											: "Deactivate right now"}
									</span>
								</button>

								<button
									type="button"
									onClick={() => setScheduleMode("scheduled")}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										scheduleMode === "scheduled"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Calendar size={14} className="text-violet-400" />
										<span>Scheduled</span>
									</div>
									<span className="text-[11px] text-zinc-400 mt-1">
										Execute on specific date
									</span>
								</button>
							</div>
						</div>

						{scheduleMode === "scheduled" && (
							<div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
								<div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
									<Clock size={14} className="text-violet-400" />
									<span>
										Scheduled{" "}
										{action === "enable" ? "Activation" : "Deactivation"} Date &
										Time
									</span>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<form.Field
										name="date"
										validators={{
											onChange: validateField(SCHEDULE_VALIDATORS.date),
										}}
									>
										{(field) => (
											<div>
												<label
													htmlFor="schedule-date"
													className="mb-1 block text-[11px] font-medium text-zinc-400"
												>
													Date
												</label>
												<Input
													id="schedule-date"
													type="date"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													hasError={Boolean(field.state.meta.errors[0])}
													required
												/>
											</div>
										)}
									</form.Field>

									<form.Field
										name="time"
										validators={{
											onChange: validateField(SCHEDULE_VALIDATORS.time),
										}}
									>
										{(field) => (
											<div>
												<label
													htmlFor="schedule-time"
													className="mb-1 block text-[11px] font-medium text-zinc-400"
												>
													Time
												</label>
												<Input
													id="schedule-time"
													type="time"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													hasError={Boolean(field.state.meta.errors[0])}
													required
												/>
											</div>
										)}
									</form.Field>
								</div>

								<form.Subscribe
									selector={(state) => [state.values.date, state.values.time]}
								>
									{([date, time]) => {
										const ts =
											date && time
												? new Date(`${date}T${time}`).getTime()
												: null;
										const isFut = Boolean(
											ts && !Number.isNaN(ts) && ts > Date.now(),
										);

										return (
											<>
												{ts && !isFut && (
													<p className="text-xs text-red-400">
														Scheduled execution time must be in the future.
													</p>
												)}

												{ts && isFut && (
													<p className="text-[11px] text-zinc-400">
														Will automatically execute on{" "}
														<span className="font-mono text-zinc-200">
															{new Date(ts).toLocaleString()}
														</span>
													</p>
												)}
											</>
										);
									}}
								</form.Subscribe>
							</div>
						)}

						<div className="flex justify-end gap-3 pt-2">
							<form.Subscribe selector={(state) => [state.isSubmitting]}>
								{([isSubmitting]) => (
									<Button
										type="button"
										variant="secondary"
										disabled={Boolean(isSubmitting)}
										onClick={onClose}
									>
										Cancel
									</Button>
								)}
							</form.Subscribe>

							<form.Subscribe
								selector={(state) =>
									[state.values, state.canSubmit, state.isSubmitting] as const
								}
							>
								{([values, canSubmit, isSubmitting]) => {
									const scheduledTimestamp =
										values.date && values.time
											? new Date(`${values.date}T${values.time}`).getTime()
											: null;
									const isFuture = Boolean(
										scheduledTimestamp &&
											!Number.isNaN(scheduledTimestamp) &&
											scheduledTimestamp > Date.now(),
									);
									const disabled =
										Boolean(isSubmitting) ||
										(isSelf && action === "disable") ||
										(scheduleMode === "scheduled" && (!canSubmit || !isFuture));

									return (
										<Button
											type="submit"
											variant={action === "enable" ? "primary" : "danger"}
											loading={Boolean(isSubmitting)}
											disabled={disabled}
											icon={
												action === "enable" ? (
													scheduleMode === "scheduled" ? (
														<Calendar size={14} />
													) : (
														<UserCheck size={14} />
													)
												) : scheduleMode === "scheduled" ? (
													<Calendar size={14} />
												) : (
													<UserX size={14} />
												)
											}
										>
											{action === "enable"
												? scheduleMode === "scheduled"
													? "Schedule Activation"
													: "Enable Account"
												: action === "delete"
													? scheduleMode === "scheduled"
														? "Schedule Deletion"
														: "Delete Immediately"
													: scheduleMode === "scheduled"
														? "Schedule Deactivation"
														: "Deactivate Immediately"}
										</Button>
									);
								}}
							</form.Subscribe>
						</div>
					</>
				)}
			</form>
		</Modal>
	);
}
