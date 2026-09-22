import { describe, expect, test } from "bun:test";
import {
	assertPermissionCeiling,
	PermissionCeilingError,
} from "../src/ceiling";
import { RebacEngine } from "../src/engine";
import { define, is, schema } from "../src/schema";
import { MemoryTupleStore } from "../src/store";
import type { Tuple } from "../src/types";
import {
	createDocumentSchema,
	generateCyclicKnotTuples,
	generateDeepChainTuples,
	generateFanOutTuples,
} from "./helpers/fixtures";

describe("@id/rebac: RebacEngine Graph Resolution & Security", () => {
	const testSchema = createDocumentSchema();

	test("evaluates direct role assignments in O(1)", async () => {
		const store = new MemoryTupleStore([
			{ object: "document:1", relation: "owner", subject: "user:alice" },
		]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:1",
			can: "edit",
			subject: "user:alice",
		});
		expect(res.allowed).toBe(true);
	});

	test("evaluates cross-entity traversals and nested folder inheritance", async () => {
		const store = new MemoryTupleStore([
			{ object: "folder:root", relation: "owner", subject: "user:alice" },
			{ object: "folder:sub", relation: "parent", subject: "folder:root" },
			{ object: "document:1", relation: "folder", subject: "folder:sub" },
		]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:1",
			can: "view",
			subject: "user:alice",
		});
		expect(res.allowed).toBe(true);
	});

	test("evaluates ad-hoc group sharing", async () => {
		const store = new MemoryTupleStore([
			{ object: "group:eng", relation: "member", subject: "user:bob" },
			{ object: "document:1", relation: "group", subject: "group:eng" },
		]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:1",
			can: "view",
			subject: "user:bob",
		});
		expect(res.allowed).toBe(true);
	});

	test("evaluates unless exclusions (blocked overrides all grants)", async () => {
		const store = new MemoryTupleStore([
			{ object: "document:1", relation: "owner", subject: "user:mallory" },
			{ object: "document:1", relation: "blocked", subject: "user:mallory" },
		]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:1",
			can: "view",
			subject: "user:mallory",
		});
		expect(res.allowed).toBe(false);
	});

	test("evaluates self identity check", async () => {
		const User = define("user", {
			roles: ["active"],
			can: {
				edit_profile: is("self").or("active"),
			},
		});
		const userSchema = schema({ User });
		const store = new MemoryTupleStore([]);
		const engine = new RebacEngine({ schema: userSchema, store });

		const selfRes = await engine.check({
			object: "user:alice",
			can: "edit_profile",
			subject: "user:alice",
		});
		expect(selfRes.allowed).toBe(true);

		const otherRes = await engine.check({
			object: "user:alice",
			can: "edit_profile",
			subject: "user:bob",
		});
		expect(otherRes.allowed).toBe(false);
	});

	test("prevents infinite loops in cyclic graphs", async () => {
		const Group = define("group", (self) => ({
			relations: {
				linkedGroup: self as any,
			},
			roles: ["direct_member"],
			can: {
				member: is("direct_member").or(self.linkedGroup("member")),
			},
		}));

		const cyclicSchema = schema({ Group });
		const store = new MemoryTupleStore(generateCyclicKnotTuples(10));
		const engine = new RebacEngine({ schema: cyclicSchema, store });

		const res = await engine.check({
			object: "group:0",
			can: "member",
			subject: "user:unauthorized-stranger",
		});
		expect(res.allowed).toBe(false);
	});

	test("resolves deep linear hierarchy (30-hop chain)", async () => {
		const Node = define("node", (self) => ({
			relations: { parent: self as any },
			roles: ["admin"],
			can: { view: is("admin").or(self.parent("view")) },
		}));
		const chainSchema = schema({ Node });
		const store = new MemoryTupleStore(
			generateDeepChainTuples(30, "user:root-alice"),
		);
		const engine = new RebacEngine({
			schema: chainSchema,
			store,
			maxDepth: 50,
		});

		const res = await engine.check({
			object: "node:30",
			can: "view",
			subject: "user:root-alice",
		});
		expect(res.allowed).toBe(true);
	});

	test("evaluates high fan-out graph with 1,000 teams and subteams", async () => {
		const Group = define("group", { roles: ["member"] });
		const Document = define("document", (self) => ({
			relations: { sharedWith: Group },
			roles: ["owner"],
			can: { view: is("owner").or(self.sharedWith(Group.member)) },
		}));
		const fanOutSchema = schema({ Group, Document });
		const store = new MemoryTupleStore(
			generateFanOutTuples(100, 10, "user:needle"),
		);
		const engine = new RebacEngine({ schema: fanOutSchema, store });

		const res = await engine.check({
			object: "document:mega-spec",
			can: "view",
			subject: "user:needle",
		});
		expect(res.allowed).toBe(true);
	});

	test("lists accessible objects of a given type", async () => {
		const store = new MemoryTupleStore([
			{ object: "document:1", relation: "owner", subject: "user:alice" },
			{ object: "document:2", relation: "viewer", subject: "user:alice" },
			{ object: "document:3", relation: "owner", subject: "user:bob" },
		]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const objects = await engine.listObjects({
			objectType: "document",
			can: "view",
			subject: "user:alice",
		});
		expect(objects.sort()).toEqual(["document:1", "document:2"]);
	});

	test("evaluates contextual tuples dynamically", async () => {
		const store = new MemoryTupleStore([]);
		const engine = new RebacEngine({ schema: testSchema, store });

		const contextualTuples: Tuple[] = [
			{
				object: "document:ephemeral",
				relation: "viewer",
				subject: "user:guest",
			},
		];

		const res = await engine.check({
			object: "document:ephemeral",
			can: "view",
			subject: "user:guest",
			contextualTuples,
		});
		expect(res.allowed).toBe(true);
	});

	test("enforces configurable permission ceilings on tuple assignment", async () => {
		const Org = define("org", {
			roles: ["admin", "member"],
		});
		const orgSchema = schema({ Org });
		const store = new MemoryTupleStore([
			{ object: "org:root", relation: "admin", subject: "user:superadmin" },
			{ object: "org:engineering", relation: "admin", subject: "user:lead" },
			{
				object: "org:engineering",
				relation: "member",
				subject: "user:developer",
			},
		]);
		const engine = new RebacEngine({ schema: orgSchema, store });

		const ceilingOpts = {
			superAdmin: { object: "org:root", can: "admin" },
			requiredAbilities: ["admin"],
		};

		// 1. Superadmin can grant on any org
		await expect(
			assertPermissionCeiling(
				"user:superadmin",
				{
					object: "org:marketing",
					relation: "member",
					subject: "user:new-hire",
				},
				engine,
				ceilingOpts,
			),
		).resolves.toBeUndefined();

		// 2. Lead can grant on their own org
		await expect(
			assertPermissionCeiling(
				"user:lead",
				{
					object: "org:engineering",
					relation: "member",
					subject: "user:new-hire",
				},
				engine,
				ceilingOpts,
			),
		).resolves.toBeUndefined();

		// 3. Regular developer cannot grant
		await expect(
			assertPermissionCeiling(
				"user:developer",
				{
					object: "org:engineering",
					relation: "admin",
					subject: "user:new-hire",
				},
				engine,
				ceilingOpts,
			),
		).rejects.toThrow(PermissionCeilingError);
	});
});
