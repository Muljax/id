import { describe, expect, test } from "bun:test";
import { ENTERPRISE_REBAC_SCHEMA } from "../src/models/enterprise";
import { SYSTEM_REBAC_SCHEMA } from "../src/models/system";
import {
	define,
	formatRuleAst,
	is,
	schema,
	schemaFromAst,
	schemaFromJSON,
} from "../src/schema";
import { createDocumentSchema } from "./helpers/fixtures";

describe("@id/rebac: Schema DSL, AST Formatting, JSON & Mermaid", () => {
	test("defines entities with roles, relations, and computed abilities", () => {
		const docSchema = createDocumentSchema();
		const doc = docSchema.getEntity("document");

		expect(doc).toBeDefined();
		expect(doc?.roles).toEqual(["owner", "editor", "viewer", "blocked"]);
		expect(doc?.abilities.view.kind).toBe("subtract");
	});

	test("pretty-prints schema AST into human-readable text format", () => {
		const docSchema = createDocumentSchema();
		const formatted = docSchema.format();

		expect(formatted).toContain("entity document {");
		expect(formatted).toContain("roles: [owner, editor, viewer, blocked]");
		expect(formatted).toContain("folder: folder");
		expect(formatted).toContain("view:");
		expect(formatted).toContain("subtract(");
		expect(formatted).toContain('traverse(folder -> folder.ability("view"))');
	});

	test("pretty-prints individual RuleAst nodes", () => {
		const docSchema = createDocumentSchema();
		const viewRule = docSchema.getEntity("document")?.abilities.view;
		expect(viewRule).toBeDefined();

		const formatted = formatRuleAst(viewRule!);
		expect(formatted).toContain("subtract(");
		expect(formatted).toContain('role("blocked")');
	});

	test("serializes schema to JSON AST and roundtrips with schemaFromJSON", () => {
		const docSchema = createDocumentSchema();
		const json = docSchema.toJSON(2);

		expect(json).toContain('"document"');
		expect(json).toContain('"kind": "subtract"');

		const reloaded = schemaFromJSON(json);
		expect(reloaded.getEntity("document")?.roles).toEqual([
			"owner",
			"editor",
			"viewer",
			"blocked",
		]);
		expect(reloaded.getEntity("document")?.abilities.view.kind).toBe(
			"subtract",
		);
	});

	test("generates valid Mermaid diagram for Core System Schema", () => {
		const mermaid = SYSTEM_REBAC_SCHEMA.toMermaid();
		expect(mermaid.startsWith("flowchart TD")).toBe(true);
		expect(mermaid).toContain("subgraph organization");
		expect(mermaid).toContain("subgraph ssh_host");
		expect(mermaid).toContain("subgraph secret_vault");
	});

	test("generates valid Mermaid diagram for Enterprise Multi-Tier Fabric Schema", () => {
		const mermaid = ENTERPRISE_REBAC_SCHEMA.toMermaid();
		expect(mermaid.startsWith("flowchart TD")).toBe(true);
		expect(mermaid).toContain("subgraph holding_company");
		expect(mermaid).toContain("subgraph cloud_tenant");
		expect(mermaid).toContain("subgraph iceberg_table");
		expect(mermaid).toContain("subgraph release_gate");
		expect(mermaid).toContain("subgraph audit_log_sink");
	});
});
