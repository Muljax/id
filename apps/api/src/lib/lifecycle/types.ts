export const LIFECYCLE_ACTIONS = ["enable", "disable", "delete"] as const;

export type LifecycleAction = (typeof LIFECYCLE_ACTIONS)[number];

export const LIFECYCLE_STATUSES = [
	"pending",
	"processing",
	"completed",
	"cancelled",
	"failed",
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];

export interface LifecycleActionRecord {
	id: string;
	userId: string;
	action: LifecycleAction;
	executeAt: number;
	status: LifecycleStatus;
	createdAt: number;
	updatedAt: number;
	executedAt: number | null;
	cancelledAt: number | null;
	error: string | null;
}
