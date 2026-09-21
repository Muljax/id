import type { RewriteRule, Schema, TypeDefinition } from "./types";

/**
 * Creates a direct relationship rule (`this`).
 */
export function thisRule(): RewriteRule {
	return { type: "this" };
}

/**
 * Creates a computed userset rule referencing another relation on the same object.
 */
export function computedUserset(relation: string): RewriteRule {
	return { type: "computed_userset", relation };
}

/**
 * Creates a tuple-to-userset rule traversing a relation on a related object (`tupleset->computed`).
 */
export function tupleToUserset(
	tuplesetRelation: string,
	computedRelation: string,
): RewriteRule {
	return {
		type: "tuple_to_userset",
		tuplesetRelation,
		computedRelation,
	};
}

/**
 * Creates a union rule (OR condition across multiple rules).
 */
export function union(...children: RewriteRule[]): RewriteRule {
	const flattened: RewriteRule[] = [];
	for (const child of children) {
		if (child.type === "union") {
			flattened.push(...child.children);
		} else {
			flattened.push(child);
		}
	}
	return { type: "union", children: flattened };
}

/**
 * Creates an intersection rule (AND condition across multiple rules).
 */
export function intersection(...children: RewriteRule[]): RewriteRule {
	return { type: "intersection", children };
}

/**
 * Creates an exclusion rule (base BUT NOT subtract).
 */
export function exclusion(
	base: RewriteRule,
	subtract: RewriteRule,
): RewriteRule {
	return { type: "exclusion", base, subtract };
}

/**
 * Parses a simple relation DSL expression into an AST RewriteRule.
 * Examples:
 * - `"direct"` -> `{ type: "this" }`
 * - `"admin or member"` -> `union(computedUserset("admin"), computedUserset("member"))`
 * - `"direct | parent->viewer"` -> `union(thisRule(), tupleToUserset("parent", "viewer"))`
 * - `"member and not blocked"` -> `exclusion(computedUserset("member"), computedUserset("blocked"))`
 */
export function parseRelationDsl(dsl: string): RewriteRule {
	const trimmed = dsl.trim();

	// Check exclusion ("A and not B" or "A - B")
	const notIndex = trimmed.indexOf(" and not ");
	if (notIndex !== -1) {
		const base = parseRelationDsl(trimmed.slice(0, notIndex));
		const subtract = parseRelationDsl(trimmed.slice(notIndex + 9));
		return exclusion(base, subtract);
	}

	// Check union ("A or B" or "A | B")
	const unionDelim = trimmed.includes(" or ")
		? " or "
		: trimmed.includes(" | ")
			? " | "
			: null;
	if (unionDelim) {
		const parts = trimmed.split(unionDelim);
		return union(...parts.map((p) => parseRelationDsl(p.trim())));
	}

	// Check intersection ("A and B" or "A & B")
	const intersectDelim = trimmed.includes(" and ")
		? " and "
		: trimmed.includes(" & ")
			? " & "
			: null;
	if (intersectDelim) {
		const parts = trimmed.split(intersectDelim);
		return intersection(...parts.map((p) => parseRelationDsl(p.trim())));
	}

	// Direct
	if (trimmed === "direct" || trimmed === "this") {
		return thisRule();
	}

	// Tuple to userset ("parent->viewer")
	if (trimmed.includes("->")) {
		const [tupleset, computed] = trimmed.split("->").map((s) => s.trim());
		if (!tupleset || !computed) {
			throw new Error(`Invalid tuple-to-userset expression: '${trimmed}'.`);
		}
		return tupleToUserset(tupleset, computed);
	}

	// Simple computed userset
	return computedUserset(trimmed);
}

/**
 * Defines an object type with its relations.
 */
export function defineType(
	name: string,
	relations: Record<string, RewriteRule | string>,
): TypeDefinition {
	const compiledRelations: Record<string, RewriteRule> = {};

	for (const [rel, rule] of Object.entries(relations)) {
		compiledRelations[rel] =
			typeof rule === "string" ? parseRelationDsl(rule) : rule;
	}

	return {
		name,
		relations: compiledRelations,
	};
}

/**
 * Defines a complete ReBAC schema.
 */
export function defineSchema(
	types: TypeDefinition[] | Record<string, TypeDefinition>,
): Schema {
	const typeMap: Record<string, TypeDefinition> = {};

	const typeList = Array.isArray(types) ? types : Object.values(types);
	for (const t of typeList) {
		typeMap[t.name] = t;
	}

	return {
		types: typeMap,
	};
}
