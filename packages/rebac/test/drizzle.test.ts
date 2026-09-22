import { describe, expect, test } from "bun:test";
import { RebacEngine } from "../src/engine";
import { define, is, schema } from "../src/schema";
import { createTestDrizzleStore } from "./helpers/fixtures";

describe("@id/rebac: Universal Drizzle ORM Tuple Store", () => {
	test("executes ReBAC engine directly on top of Drizzle database", async () => {
		const { store } = createTestDrizzleStore("rebac_tuples");

		const Team = define("team", {
			roles: ["admin", "member"],
		});

		const Project = define("project", (self) => ({
			relations: {
				owningTeam: Team,
			},
			roles: ["maintainer", "viewer", "blocked"],
			can: {
				manage: is("maintainer").or(self.owningTeam(Team.admin)),
				view: is("viewer")
					.or("manage")
					.or(self.owningTeam(Team.member))
					.unless("blocked"),
			},
		}));

		const appSchema = schema({ Team, Project });
		const engine = new RebacEngine({ schema: appSchema, store });

		// Write relational facts into Drizzle database
		await store.writeTuples([
			{ object: "team:security", relation: "admin", subject: "user:alice" },
			{ object: "team:security", relation: "member", subject: "user:bob" },
			{
				object: "project:core-auth",
				relation: "owningTeam",
				subject: "team:security",
			},
			{
				object: "project:core-auth",
				relation: "viewer",
				subject: "user:charlie",
			},
			{
				object: "project:core-auth",
				relation: "blocked",
				subject: "user:mallory",
			},
		]);

		// Verify filtered lookups
		const aliceTuples = await store.readTuples({ subject: "user:alice" });
		expect(aliceTuples.length).toBe(1);
		expect(aliceTuples[0]?.object).toBe("team:security");

		const projectLinks = await store.readTuples({
			object: "project:core-auth",
			relation: "owningTeam",
		});
		expect(projectLinks.length).toBe(1);
		expect(projectLinks[0]?.subject).toBe("team:security");

		// Check authorizations
		const aliceManage = await engine.check({
			object: "project:core-auth",
			can: "manage",
			subject: "user:alice",
		});
		expect(aliceManage.allowed).toBe(true);

		const bobView = await engine.check({
			object: "project:core-auth",
			can: "view",
			subject: "user:bob",
		});
		expect(bobView.allowed).toBe(true);

		const bobManage = await engine.check({
			object: "project:core-auth",
			can: "manage",
			subject: "user:bob",
		});
		expect(bobManage.allowed).toBe(false);

		const charlieView = await engine.check({
			object: "project:core-auth",
			can: "view",
			subject: "user:charlie",
		});
		expect(charlieView.allowed).toBe(true);

		const malloryView = await engine.check({
			object: "project:core-auth",
			can: "view",
			subject: "user:mallory",
		});
		expect(malloryView.allowed).toBe(false);

		// Delete tuple and verify revocation
		await store.deleteTuples([
			{ object: "team:security", relation: "admin", subject: "user:alice" },
		]);

		const aliceAfterRevocation = await engine.check({
			object: "project:core-auth",
			can: "manage",
			subject: "user:alice",
		});
		expect(aliceAfterRevocation.allowed).toBe(false);
	});
});
