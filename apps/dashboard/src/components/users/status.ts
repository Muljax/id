import type { AdminUser } from "@/lib/api/admin";

export interface UserStatusInfo {
	label: string;
	variant: "success" | "danger" | "warning";
	isScheduled: boolean;
	isDisabled: boolean;
}

export function getUserStatus(user: AdminUser): UserStatusInfo {
	const now = Date.now();
	if (user.disabledAt != null) {
		if (user.disabledAt <= now) {
			return {
				label: "Disabled",
				variant: "danger",
				isScheduled: false,
				isDisabled: true,
			};
		}
		return {
			label: "Deactivation Scheduled",
			variant: "warning",
			isScheduled: true,
			isDisabled: false,
		};
	}
	return {
		label: "Active",
		variant: "success",
		isScheduled: false,
		isDisabled: false,
	};
}
