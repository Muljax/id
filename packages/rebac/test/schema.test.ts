import { describe, expect, test } from "bun:test";
import {
	defineSchema,
	defineType,
	exclusion,
	intersection,
	parseRelationDsl,
	tupleToUserset,
	union,
} from "../src/schema";

describe("@id/rebac: Schema & Relation DSL Parser", () => {
	test("parses direct and computed userset DSL expressions", () => {
		expect(parseRelationDsl("direct")).toEqual({ type: "this" });
		expect(parseRelationDsl("this")).toEqual({ type: "this" });
		expect(parseRelationDsl("admin")).toEqual({
			type: "computed_userset",
			relation: "admin",
		});
	});

	test("parses tuple-to-userset expressions", () => {
		expect(parseRelationDsl("parent->viewer")).toEqual(
			tupleToUserset("parent", "viewer"),
		);
	});

	test("parses union and intersection expressions", () => {
		expect(parseRelationDsl("admin or member")).toEqual(
			union(
				{ type: "computed_userset", relation: "admin" },
				{ type: "computed_userset", relation: "member" },
			),
		);

		expect(parseRelationDsl("admin and member")).toEqual(
			intersection(
				{ type: "computed_userset", relation: "admin" },
				{ type: "computed_userset", relation: "member" },
			),
		);
	});

	test("parses exclusion expressions", () => {
		expect(parseRelationDsl("member and not blocked")).toEqual(
			exclusion(
				{ type: "computed_userset", relation: "member" },
				{ type: "computed_userset", relation: "blocked" },
			),
		);
	});

	test("defines multi-type schema correctly", () => {
		const schema = defineSchema([
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

		expect(schema.types.document).toBeDefined();
		expect(schema.types.folder).toBeDefined();
		expect(schema.types.document.relations.viewer).toBeDefined();
	});
});
