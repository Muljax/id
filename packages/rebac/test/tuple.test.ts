import { describe, expect, test } from "bun:test";
import {
	formatObject,
	formatSubject,
	formatTupleKey,
	matchFilter,
	parseObject,
	parseSubject,
	parseTupleKey,
	validateTuple,
} from "../src/tuple";

describe("@id/rebac: Tuple Parsing & Formatting", () => {
	test("parses and formats object strings", () => {
		const obj = parseObject("document:readme.md");
		expect(obj.type).toBe("document");
		expect(obj.id).toBe("readme.md");
		expect(formatObject(obj)).toBe("document:readme.md");
	});

	test("parses and formats direct subjects and usersets", () => {
		const direct = parseSubject("user:alice");
		expect(direct.type).toBe("user");
		expect(direct.id).toBe("alice");
		expect(direct.relation).toBeUndefined();
		expect(formatSubject(direct)).toBe("user:alice");

		const userset = parseSubject("group:engineering#member");
		expect(userset.type).toBe("group");
		expect(userset.id).toBe("engineering");
		expect(userset.relation).toBe("member");
		expect(formatSubject(userset)).toBe("group:engineering#member");
	});

	test("parses and formats canonical Zanzibar tuple keys", () => {
		const tuple = parseTupleKey(
			"document:architecture.md#viewer@group:platform#member",
		);
		expect(tuple.object).toBe("document:architecture.md");
		expect(tuple.relation).toBe("viewer");
		expect(tuple.subject).toBe("group:platform#member");

		expect(formatTupleKey(tuple)).toBe(
			"document:architecture.md#viewer@group:platform#member",
		);
	});

	test("validates malformed tuples", () => {
		expect(() =>
			validateTuple({ object: "invalid", relation: "rel", subject: "user:1" }),
		).toThrow();
		expect(() =>
			validateTuple({
				object: "doc:1",
				relation: "invalid relation!",
				subject: "user:1",
			}),
		).toThrow();
	});

	test("filters tuples accurately", () => {
		const t = {
			object: "server:bastion-01",
			relation: "admin",
			subject: "user:ops-alice",
		};

		expect(matchFilter(t, { object: "server:bastion-01" })).toBe(true);
		expect(matchFilter(t, { objectType: "server" })).toBe(true);
		expect(matchFilter(t, { objectType: "document" })).toBe(false);
		expect(matchFilter(t, { relation: "admin" })).toBe(true);
		expect(matchFilter(t, { subject: "user:ops-alice" })).toBe(true);
		expect(matchFilter(t, { subjectType: "user" })).toBe(true);
		expect(matchFilter(t, { subjectType: "group" })).toBe(false);
	});
});
