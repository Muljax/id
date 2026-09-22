import type { RebacEngine } from "./engine";
import type { Tuple } from "./types";

export class PermissionCeilingError extends Error {
	constructor(
		message: string,
		public readonly actor: string,
		public readonly tuple: Tuple,
	) {
		super(message);
		this.name = "PermissionCeilingError";
	}
}

export interface PermissionCeilingOptions {
	/**
	 * Optional global superadmin target (e.g. `{ object: "system:root", can: "admin" }` or `{ object: "org:root", can: "owner" }`).
	 * If specified and actor satisfies this condition, permission ceiling check passes immediately.
	 */
	superAdmin?: {
		object: string;
		can?: string;
		relation?: string;
	};

	/**
	 * Required capabilities or roles the actor must hold on the target object to grant relationships on it.
	 * Defaults to `["admin", "owner", "manage"]`.
	 */
	requiredAbilities?: string[];

	/**
	 * Custom authorizer function to evaluate arbitrary ceiling policies.
	 */
	customAuthorizer?: (
		actor: string,
		tuple: Tuple,
		engine: RebacEngine,
	) => Promise<boolean>;
}

/**
 * Validates that an actor has sufficient authority to grant/assign a relationship tuple.
 *
 * Prevents privilege escalation: an actor cannot assign a role, SSH principal, or resource
 * relationship unless the actor has admin or owner authority over the target object or global superadmin status.
 *
 * @param actor Subject string of the actor attempting the assignment (e.g. `user:alice`).
 * @param tuple Target tuple being granted (e.g. `cluster:prod#operator@user:bob`).
 * @param engine Active ReBAC engine instance.
 * @param options Configurable ceiling options (superadmin bypass, required abilities, custom authorizer).
 * @throws PermissionCeilingError if the actor exceeds their permission ceiling.
 */
export async function assertPermissionCeiling(
	actor: string,
	tuple: Tuple,
	engine: RebacEngine,
	options: PermissionCeilingOptions = {},
): Promise<void> {
	// 1. Check custom authorizer if provided
	if (options.customAuthorizer) {
		const customAllowed = await options.customAuthorizer(actor, tuple, engine);
		if (customAllowed) {
			return;
		}
	}

	// 2. Check global superadmin bypass if configured
	if (options.superAdmin) {
		const superCheck = await engine.check({
			object: options.superAdmin.object,
			can: options.superAdmin.can ?? options.superAdmin.relation ?? "admin",
			subject: actor,
		});
		if (superCheck.allowed) {
			return;
		}
	}

	// 3. Check authority on the target object
	const requiredAbilities = options.requiredAbilities ?? [
		"admin",
		"owner",
		"manage",
	];

	for (const ability of requiredAbilities) {
		const objCheck = await engine.check({
			object: tuple.object,
			can: ability,
			subject: actor,
		});
		if (objCheck.allowed) {
			return;
		}
	}

	throw new PermissionCeilingError(
		`Actor '${actor}' lacks administrative authority over '${tuple.object}' (required one of: ${requiredAbilities.join(", ")}) to grant relation '${tuple.relation}'.`,
		actor,
		tuple,
	);
}
