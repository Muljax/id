import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	Clock,
	UserCheck,
	UserX,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useToast } from "@/components/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { getUserStatus } from "@/components/users/status";
import {
	executeUserLifecycle,
	type AdminUser,
	type LifecycleAction,
} from "@/lib/api/admin";
import {
	type FieldValidators,
	validateForm,
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
	const action: LifecycleAction = status.isDisabled ? "enable" : "disable";

	const [scheduleMode, setScheduleMode] = useState<"immediate" | "scheduled">(
		status.isScheduled ? "scheduled" : "immediate",
	);

	const defaultDate = useMemo(() => {
		const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
		return tomorrow.toISOString().split("T")[0];
	}, []);

	const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
		date: defaultDate,
		time: "00:00",
	});
	const [submitting, setSubmitting] = useState(false);

	const { errors, isValid } = useMemo(
		() => validateForm(scheduleForm, SCHEDULE_VALIDATORS),
		[scheduleForm],
	);

	const scheduledTimestamp = useMemo(() => {
		if (!scheduleForm.date || !scheduleForm.time) {
			return null;
		}
		const ts = new Date(`${scheduleForm.date}T${scheduleForm.time}`).getTime();
		return Number.isNaN(ts) ? null : ts;
	}, [scheduleForm.date, scheduleForm.time]);

	const isFuture = Boolean(
		scheduledTimestamp && scheduledTimestamp > Date.now(),
	);

	const canSubmit =
		!submitting && (scheduleMode === "immediate" || (isValid && isFuture));

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSubmit) {
			return;
		}

		setSubmitting(true);

		const executeAt = scheduleMode === "scheduled" ? scheduledTimestamp : null;

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
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Modal
			open={true}
			title={
				action === "enable"
					? "Manage Account Activation"
					: "Manage Account Deactivation"
			}
			description={`Update access status for ${user.displayName || user.email}.`}
			onClose={onClose}
		>
			<form onSubmit={handleSubmit} className="space-y-5">
				{isSelf && action === "disable" ? (
					<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
						You cannot disable your own administrator account.
					</div>
				) : (
					<>
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
						) : (
							<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
								<AlertTriangle
									size={16}
									className="shrink-0 text-amber-400 mt-0.5"
								/>
								<div>
									Disabling an account immediately revokes all active sign-in
									sessions, terminates OAuth access & refresh tokens, and
									prevents authentication.
								</div>
							</div>
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
									disabled={submitting}
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
									disabled={submitting}
									className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
										scheduleMode === "scheduled"
											? "border-violet-500/50 bg-violet-500/10 text-white"
											: "border-white/8 bg-zinc-900/40 text-zinc-400 hover:bg-white/[0.04]"
									}`}
								>
									<div className="flex items-center gap-1.5 text-xs font-semibold text-white">
										<Calendar size={14} className="text-amber-400" />
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
											value={scheduleForm.date}
											onChange={(e) =>
												setScheduleForm((prev) => ({
													...prev,
													date: e.target.value,
												}))
											}
											hasError={Boolean(errors.date)}
											disabled={submitting}
											required
										/>
									</div>

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
											value={scheduleForm.time}
											onChange={(e) =>
												setScheduleForm((prev) => ({
													...prev,
													time: e.target.value,
												}))
											}
											hasError={Boolean(errors.time)}
											disabled={submitting}
											required
										/>
									</div>
								</div>

								{scheduledTimestamp && !isFuture && (
									<p className="text-xs text-red-400">
										Scheduled execution time must be in the future.
									</p>
								)}

								{scheduledTimestamp && isFuture && (
									<p className="text-[11px] text-zinc-400">
										Will automatically execute on{" "}
										<span className="font-mono text-zinc-200">
											{new Date(scheduledTimestamp).toLocaleString()}
										</span>
									</p>
								)}
							</div>
						)}

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="secondary"
								disabled={submitting}
								onClick={onClose}
							>
								Cancel
							</Button>

							<Button
								type="submit"
								variant={action === "enable" ? "primary" : "danger"}
								loading={submitting}
								disabled={!canSubmit || (isSelf && action === "disable")}
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
									: scheduleMode === "scheduled"
										? "Schedule Deactivation"
										: "Deactivate Immediately"}
							</Button>
						</div>
					</>
				)}
			</form>
		</Modal>
	);
}
