import { describe, expect, test } from "bun:test";
import {
	assertPermissionCeiling,
	PermissionCeilingError,
} from "../src/ceiling";
import { RebacEngine } from "../src/engine";
import { SYSTEM_REBAC_SCHEMA } from "../src/models/system";
import { MemoryTupleStore } from "../src/store";

describe("@id/rebac: Muljax System Authorization Model & Ceilings", () => {
	test("grants SSH host connection via team membership", async () => {
		const store = new MemoryTupleStore([
			// User is member of platform team
			{
				object: "group:platform-team",
				relation: "member",
				subject: "user:ops-alice",
			},
			// Production bastions belong to platform team
			{
				object: "ssh_host:bastion-prod-01",
				relation: "parent_group",
				subject: "group:platform-team",
			},
		]);

		const engine = new RebacEngine({
			schema: SYSTEM_REBAC_SCHEMA,
			store,
		});

		// Alice can connect to bastion-prod-01 via group membership
		const resAlice = await engine.check({
			object: "ssh_host:bastion-prod-01",
			relation: "can_connect",
			subject: "user:ops-alice",
		});
		expect(resAlice.allowed).toBe(true);

		// Bob cannot connect
		const resBob = await engine.check({
			object: "ssh_host:bastion-prod-01",
			relation: "can_connect",
			subject: "user:marketing-bob",
		});
		expect(resBob.allowed).toBe(false);
	});

	test("enforces permission ceilings on role/principal grants", async () => {
		const store = new MemoryTupleStore([
			// Alice is system admin
			{
				object: "system:root",
				relation: "admin",
				subject: "user:alice",
			},
			// Bob is standard user
			{
				object: "system:root",
				relation: "reader",
				subject: "user:bob",
			},
		]);

		const engine = new RebacEngine({
			schema: SYSTEM_REBAC_SCHEMA,
			store,
		});

		// Alice can grant admin role to charlie
		await expect(
			assertPermissionCeiling(
				"user:alice",
				{
					object: "role:admin",
					relation: "assignee",
					subject: "user:charlie",
				},
				engine,
			),
		).resolves.toBeUndefined();

		// Bob cannot grant admin role to charlie (ceiling violation)
		await expect(
			assertPermissionCeiling(
				"user:bob",
				{
					object: "role:admin",
					relation: "assignee",
					subject: "user:charlie",
				},
				engine,
			),
		).rejects.toThrow(PermissionCeilingError);
	});
});
