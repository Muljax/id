import type { OpenApiSchema, OpenApiSpec } from "./types";

export function resolveRef<T = OpenApiSchema>(
	ref: string,
	spec: OpenApiSpec,
): T | null {
	if (!ref.startsWith("#/")) return null;
	const parts = ref.replace(/^#\//, "").split("/");
	let current: unknown = spec;
	for (const part of parts) {
		if (!current || typeof current !== "object") return null;
		current = (current as Record<string, unknown>)[part];
	}
	return (current as T) || null;
}

export function dereferenceSchema(
	schema: OpenApiSchema | undefined,
	spec: OpenApiSpec,
	seenRefs = new Set<string>(),
): OpenApiSchema | null {
	if (!schema) return null;
	if (schema.$ref) {
		if (seenRefs.has(schema.$ref)) {
			return {
				type: "object",
				description: `Circular reference to ${schema.$ref}`,
			};
		}
		seenRefs.add(schema.$ref);
		const resolved = resolveRef<OpenApiSchema>(schema.$ref, spec);
		if (!resolved) return null;
		return dereferenceSchema(resolved, spec, seenRefs);
	}

	if (schema.allOf) {
		const merged: OpenApiSchema = {
			type: "object",
			properties: {},
			required: [],
		};
		for (const sub of schema.allOf) {
			const deref = dereferenceSchema(sub, spec, seenRefs);
			if (deref?.properties) {
				merged.properties = { ...merged.properties, ...deref.properties };
			}
			if (deref?.required) {
				merged.required = [...(merged.required || []), ...deref.required];
			}
		}
		return merged;
	}

	return schema;
}

export function generateSampleJson(
	schema: OpenApiSchema | undefined,
	spec: OpenApiSpec,
	depth = 0,
): unknown {
	if (!schema || depth > 5) return null;

	if (schema.$ref) {
		const deref = dereferenceSchema(schema, spec);
		return generateSampleJson(deref || undefined, spec, depth + 1);
	}

	if (schema.example !== undefined) return schema.example;
	if (
		schema.examples &&
		Array.isArray(schema.examples) &&
		schema.examples.length > 0
	) {
		return schema.examples[0];
	}
	if (schema.default !== undefined) return schema.default;
	if (schema.enum && schema.enum.length > 0) return schema.enum[0];

	const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

	switch (type) {
		case "string":
			if (schema.format === "date-time") return new Date().toISOString();
			if (schema.format === "email") return "user@example.com";
			if (schema.format === "uuid")
				return "f47ac10b-58cc-4372-a567-0e02b2c3d479";
			if (schema.format === "uri" || schema.format === "url")
				return "https://example.com";
			return "string";
		case "number":
		case "integer":
			return 0;
		case "boolean":
			return true;
		case "array":
			if (schema.items) {
				return [generateSampleJson(schema.items, spec, depth + 1)];
			}
			return [];
		default:
			if (schema.properties) {
				const obj: Record<string, unknown> = {};
				for (const [key, prop] of Object.entries(schema.properties)) {
					obj[key] = generateSampleJson(prop, spec, depth + 1);
				}
				return obj;
			}
			return {};
	}
}

export function formatSchemaType(schema: OpenApiSchema | undefined): string {
	if (!schema) return "unknown";
	if (schema.$ref) {
		const name = schema.$ref.split("/").pop();
		return name || "object";
	}
	const type = Array.isArray(schema.type)
		? schema.type.join(" | ")
		: schema.type;
	if (type === "array" && schema.items) {
		return `${formatSchemaType(schema.items)}[]`;
	}
	if (schema.format) {
		return `${type} (${schema.format})`;
	}
	if (schema.enum) {
		return schema.enum.map((e) => JSON.stringify(e)).join(" | ");
	}
	return type || "object";
}
