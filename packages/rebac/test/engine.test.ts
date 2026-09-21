import { describe, expect, test } from "bun:test";
import { RebacEngine } from "../src/engine";
import { defineSchema, defineType } from "../src/schema";
import { MemoryTupleStore } from "../src/store";

describe("@id/rebac: RebacEngine Graph Evaluation", () => {
	const testSchema = defineSchema([
		defineType("user", {}),
		defineType("group", {
			member: "direct",
			admin: "direct",
			effective_member: "member or admin",
		}),
		defineType("document", {
			owner: "direct",
			editor: "direct | owner",
			viewer: "direct | editor | parent->viewer",
			parent: "direct",
		}),
		defineType("folder", {
			owner: "direct",
			viewer: "direct | owner",
		}),
	]);

	test("evaluates direct relationships", async () => {
		const store = new MemoryTupleStore([
			{
				object: "document:budget.xlsx",
				relation: "owner",
				subject: "user:cfo-bob",
			},
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		const res1 = await engine.check({
			object: "document:budget.xlsx",
			relation: "owner",
			subject: "user:cfo-bob",
		});
		expect(res1.allowed).toBe(true);

		const res2 = await engine.check({
			object: "document:budget.xlsx",
			relation: "owner",
			subject: "user:intern-alice",
		});
		expect(res2.allowed).toBe(false);
	});

	test("evaluates computed usersets (owner implies editor)", async () => {
		const store = new MemoryTupleStore([
			{
				object: "document:specs.md",
				relation: "owner",
				subject: "user:lead-dev",
			},
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:specs.md",
			relation: "editor",
			subject: "user:lead-dev",
		});
		expect(res.allowed).toBe(true);
	});

	test("evaluates group membership and nested usersets", async () => {
		const store = new MemoryTupleStore([
			{
				object: "group:eng",
				relation: "member",
				subject: "user:alice",
			},
			{
				object: "document:architecture.md",
				relation: "viewer",
				subject: "group:eng#member",
			},
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		// Alice is in group:eng -> can view architecture.md
		const resAlice = await engine.check({
			object: "document:architecture.md",
			relation: "viewer",
			subject: "user:alice",
		});
		expect(resAlice.allowed).toBe(true);

		// Bob is not in group:eng
		const resBob = await engine.check({
			object: "document:architecture.md",
			relation: "viewer",
			subject: "user:bob",
		});
		expect(resBob.allowed).toBe(false);
	});

	test("evaluates hierarchical tuple-to-userset (folder->document inheritance)", async () => {
		const store = new MemoryTupleStore([
			{
				object: "folder:secret-projects",
				relation: "viewer",
				subject: "user:cto-dan",
			},
			{
				object: "document:project-apollo.doc",
				relation: "parent",
				subject: "folder:secret-projects",
			},
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "document:project-apollo.doc",
			relation: "viewer",
			subject: "user:cto-dan",
		});
		expect(res.allowed).toBe(true);
	});

	test("detects and avoids infinite recursive loops (cycle prevention)", async () => {
		const store = new MemoryTupleStore([
			{
				object: "group:team-a",
				relation: "member",
				subject: "group:team-b#member",
			},
			{
				object: "group:team-b",
				relation: "member",
				subject: "group:team-a#member",
			},
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		const res = await engine.check({
			object: "group:team-a",
			relation: "member",
			subject: "user:stranger",
		});
		expect(res.allowed).toBe(false);
	});

	test("lists accessible objects of a type", async () => {
		const store = new MemoryTupleStore([
			{ object: "document:doc-1", relation: "viewer", subject: "user:alice" },
			{ object: "document:doc-2", relation: "viewer", subject: "user:alice" },
			{ object: "document:doc-3", relation: "viewer", subject: "user:bob" },
		]);

		const engine = new RebacEngine({ schema: testSchema, store });

		const docs = await engine.listObjects({
			objectType: "document",
			relation: "viewer",
			subject: "user:alice",
		});
		expect(docs).toEqual(["document:doc-1", "document:doc-2"]);
	});

	test("evaluates contextual tuples dynamically", async () => {
		const store = new MemoryTupleStore([]);
		const engine = new RebacEngine({ schema: testSchema, store });

		// Without context, access is denied
		const res1 = await engine.check({
			object: "document:dynamic.txt",
			relation: "viewer",
			subject: "user:guest",
		});
		expect(res1.allowed).toBe(false);

		// With contextual tuple passed in request, access is granted
		const res2 = await engine.check({
			object: "document:dynamic.txt",
			relation: "viewer",
			subject: "user:guest",
			contextualTuples: [
				{
					object: "document:dynamic.txt",
					relation: "viewer",
					subject: "user:guest",
				},
			],
		});
		expect(res2.allowed).toBe(true);
	});
});
