import { defineSchema, defineType } from "../schema";
import type { Schema } from "../types";

/**
 * Standard Muljax ID System Authorization Schema.
 */
export const SYSTEM_REBAC_SCHEMA: Schema = defineSchema([
	// User
	defineType("user", {
		self: "direct",
	}),

	// Groups / Teams
	defineType("group", {
		member: "direct",
		admin: "direct",
		// Admin is automatically a member
		effective_member: "member or admin",
	}),

	// System Roles
	defineType("role", {
		assignee: "direct",
		admin: "direct",
	}),

	// SSH Hosts
	defineType("ssh_host", {
		owner: "direct",
		admin: "direct",
		// Users with can_connect can authenticate to the host
		can_connect: "direct | owner | admin | parent_group->effective_member",
		// Host groupings (e.g. env:production, cluster:k8s)
		parent_group: "direct",
	}),

	// SSH Principals (e.g. root, ubuntu, deploy)
	defineType("ssh_principal", {
		authorized: "direct | role->assignee",
	}),

	// OAuth Clients
	defineType("oauth_client", {
		owner: "direct",
		admin: "direct",
		viewer: "direct | owner | admin",
		can_rotate_secret: "owner or admin",
	}),

	// Settings & Instance Policy
	defineType("system", {
		admin: "direct",
		reader: "direct | admin",
		writer: "admin",
	}),
]);
