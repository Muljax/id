import { eq } from "drizzle-orm";
import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";

import { createDb } from "../db";
import { lifecycleActions } from "../db/schema";
import { claimLifecycleAction } from "../lib/lifecycle/claim";
import { executeLifecycleAction } from "../lib/lifecycle/engine";

export interface LifecycleWorkflowParams {
	lifecycleActionId: string;
}

export class LifecycleWorkflow extends WorkflowEntrypoint<
	Env,
	LifecycleWorkflowParams
> {
	override async run(
		event: WorkflowEvent<LifecycleWorkflowParams>,
		step: WorkflowStep,
	) {
		const { lifecycleActionId } = event.payload;

		const db = createDb(this.env.DB);

		const result = await db
			.select()
			.from(lifecycleActions)
			.where(eq(lifecycleActions.id, lifecycleActionId))
			.limit(1);

		const action = result[0];

		if (action?.status !== "pending") {
			return;
		}

		await step.sleepUntil(
			"wait until execution time",
			new Date(action.executeAt),
		);

		const claimedAction = await claimLifecycleAction(db, lifecycleActionId);

		if (!claimedAction) {
			return;
		}

		const executionSucceeded = await step.do(
			"execute lifecycle action",
			async () => {
				const db = createDb(this.env.DB);

				try {
					await executeLifecycleAction(db, claimedAction, {
						profileBucket: this.env.PROFILE_BUCKET,
					});

					return true;
				} catch (error) {
					const now = Date.now();
					const message =
						error instanceof Error ? error.message : String(error);

					await db
						.update(lifecycleActions)
						.set({
							status: "failed",
							error: message,
							updatedAt: now,
						})
						.where(eq(lifecycleActions.id, lifecycleActionId));

					return false;
				}
			},
		);

		if (!executionSucceeded) {
			return;
		}

		const now = Date.now();

		await db
			.update(lifecycleActions)
			.set({
				status: "completed",
				executedAt: now,
				updatedAt: now,
			})
			.where(eq(lifecycleActions.id, lifecycleActionId));
	}
}
