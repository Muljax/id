import type { RebacEngine } from "./engine";
import { parseObject } from "./tuple";
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

/**
 * Validates that an actor has sufficient authority to grant/assign a relationship tuple.
 *
 * Prevents privilege escalation: an actor cannot assign a role, SSH principal, or resource
 * relationship unless the actor has admin or owner authority over the object.
 *
 * @param actor Subject string of the actor attempting the assignment (e.g. `user:alice`).
 * @param tuple Target tuple being granted (e.g. `role:admin#assignee@user:bob`).
 * @param engine Active ReBAC engine instance.
 * @throws PermissionCeilingError if the actor exceeds their permission ceiling.
 */
export async function assertPermissionCeiling(
	actor: string,
	tuple: Tuple,
	engine: RebacEngine,
): Promise<void> {
	const obj = parseObject(tuple.object);

	// 1. Check if actor is system admin
	const isSystemAdmin = await engine.check({
		object: "system:root",
		relation: "admin",
		subject: actor,
	});
	if (isSystemAdmin.allowed) {
		return;
	}

	// 2. Check if actor is admin or owner of the target object
	const isObjectAdmin = await engine.check({
		object: tuple.object,
		relation: "admin",
		subject: actor,
	});
	if (isObjectAdmin.allowed) {
		return;
	}

	const isObjectOwner = await engine.check({
		object: tuple.object,
		relation: "owner",
		subject: actor,
	});
	if (isObjectOwner.allowed) {
		return;
	}

	throw new PermissionCeilingError(
		`Actor '${actor}' lacks administrative authority over '${tuple.object}' to grant relation '${tuple.relation}'.`,
		actor,
		tuple,
	);
}
