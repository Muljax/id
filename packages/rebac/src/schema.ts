import type {
	EntityAst,
	EntityBase,
	EntityConfig,
	EntityDefinition,
	EntityProxy,
	RuleAst,
	RuleExpression,
	Schema,
	SchemaAst,
} from "./types";

/**
 * Creates a fluent RuleExpression wrapping an AST node.
 */
export function createRuleExpression(ast: RuleAst): RuleExpression {
	return {
		ast,
		or(...others: readonly (RuleExpression | string)[]): RuleExpression {
			const otherAsts = others.map(resolveAst);
			const currentChildren = ast.kind === "union" ? ast.children : [ast];
			const newChildren: RuleAst[] = [...currentChildren];
			for (const o of otherAsts) {
				if (o.kind === "union") {
					newChildren.push(...o.children);
				} else {
					newChildren.push(o);
				}
			}
			return createRuleExpression({ kind: "union", children: newChildren });
		},
		and(...others: readonly (RuleExpression | string)[]): RuleExpression {
			const otherAsts = others.map(resolveAst);
			const currentChildren = ast.kind === "intersect" ? ast.children : [ast];
			const newChildren: RuleAst[] = [...currentChildren];
			for (const o of otherAsts) {
				if (o.kind === "intersect") {
					newChildren.push(...o.children);
				} else {
					newChildren.push(o);
				}
			}
			return createRuleExpression({ kind: "intersect", children: newChildren });
		},
		unless(
			...exclusions: readonly (RuleExpression | string)[]
		): RuleExpression {
			const exclusionAsts = exclusions.map(resolveAst);
			const firstExclusion = exclusionAsts[0];
			const subtractAst: RuleAst =
				exclusionAsts.length === 1 && firstExclusion
					? firstExclusion
					: { kind: "union", children: exclusionAsts };
			return createRuleExpression({
				kind: "subtract",
				base: ast,
				subtract: subtractAst,
			});
		},
	};
}

function resolveAst(item: RuleExpression | string): RuleAst {
	if (typeof item === "string") {
		if (item === "self") {
			return { kind: "self" };
		}
		return { kind: "role", role: item };
	}
	return item.ast;
}

/**
 * Traverses a named relation to evaluate a role or ability on the target entity.
 */
export function through(
	relationName: string,
	targetRuleOrExpr: RuleExpression | string,
): RuleExpression {
	const targetRule = resolveAst(targetRuleOrExpr);
	return createRuleExpression({
		kind: "traverse",
		relation: relationName,
		targetEntity: "",
		targetRule,
	});
}

/**
 * Declares one or more roles, abilities, or cross-entity rules.
 *
 * Examples:
 * - `is("viewer", "editor")`
 * - `is("editor").or(Organization.admin)`
 * - `is("viewer").or("editor").unless("blocked")`
 */
export function is(
	...items: readonly (RuleExpression | string)[]
): RuleExpression {
	if (items.length === 0) {
		throw new Error("is() requires at least one role, ability, or rule.");
	}

	const asts = items.map(resolveAst);
	const first = asts[0];
	if (asts.length === 1 && first) {
		return createRuleExpression(first);
	}

	return createRuleExpression({
		kind: "union",
		children: asts,
	});
}

export type EntityBuilderFn<TRoles extends string> = (
	self: EntityProxy,
) => EntityConfig<TRoles>;

/**
 * Defines an entity with roles, relations, and capabilities in plain TypeScript.
 */
export function define<TName extends string, TRoles extends string = string>(
	name: TName,
	configOrBuilder: EntityConfig<TRoles> | EntityBuilderFn<TRoles>,
): EntityDefinition<TName> {
	let relationsMap: Record<string, EntityDefinition> = {};
	const selfProxy = createEntityProxy({ name }, () => relationsMap);
	const config =
		typeof configOrBuilder === "function"
			? configOrBuilder(selfProxy as unknown as EntityProxy)
			: configOrBuilder;

	const declaredRoles: string[] = config.roles ? Array.from(config.roles) : [];
	relationsMap = config.relations ?? {};
	const compiledAbilities: Record<string, RuleAst> = {};

	const proxyWithRelations = createEntityProxy(
		{ name, roles: declaredRoles },
		() => relationsMap,
		declaredRoles,
	);

	const canEntries =
		typeof config.can === "function"
			? config.can(proxyWithRelations as unknown as EntityProxy)
			: (config.can ?? {});

	for (const [abilityName, expr] of Object.entries(canEntries)) {
		compiledAbilities[abilityName] = resolveAst(expr);
	}

	const baseEntity: EntityBase<TName> = {
		name,
		roles: declaredRoles,
		relations: relationsMap,
		abilities: compiledAbilities,
	};

	return createEntityProxy(baseEntity, () => relationsMap, declaredRoles);
}

function createEntityProxy<TName extends string>(
	base: Partial<EntityBase<TName>>,
	getRelationsMap: () => Record<string, EntityDefinition> = () => ({}),
	declaredRoles: string[] = [],
): EntityDefinition<TName> {
	return new Proxy(base as EntityDefinition<TName>, {
		get(target, prop: string | symbol) {
			if (typeof prop !== "string") {
				return Reflect.get(target, prop);
			}

			if (prop in target) {
				return (target as Record<string, unknown>)[prop];
			}

			const isRole = declaredRoles.includes(prop);
			const baseAst: RuleAst = {
				kind: isRole ? "role" : "ability",
				targetEntity: target.name ?? "",
				...(isRole ? { role: prop } : { ability: prop }),
			} as RuleAst;

			const ruleExpr = createRuleExpression(baseAst);

			const traverseFn = (targetRuleOrExpr: RuleExpression | string) => {
				const targetRule = resolveAst(targetRuleOrExpr);
				const currentRelations = getRelationsMap();
				const targetEntity =
					currentRelations[prop]?.name ||
					("targetEntity" in targetRule && typeof targetRule.targetEntity === "string"
						? targetRule.targetEntity
						: "");
				return createRuleExpression({
					kind: "traverse",
					relation: prop,
					targetEntity,
					targetRule,
				});
			};

			return Object.assign(traverseFn, ruleExpr);
		},
	});
}

/**
 * Compiles a collection of Entity definitions into an executable Schema.
 */
export function schema<
	TEntities extends
		| Record<string, EntityDefinition>
		| readonly EntityDefinition[],
>(entities: TEntities): Schema {
	const entityMap: Record<string, EntityDefinition> = {};

	const list = Array.isArray(entities)
		? entities
		: Object.values(entities as Record<string, EntityDefinition>);

	for (const e of list) {
		entityMap[e.name] = e;
	}

	return {
		entities: entityMap,
		getEntity(name: string) {
			return entityMap[name];
		},
		toAst(): SchemaAst {
			const ast: SchemaAst = { entities: {} };
			for (const [name, entity] of Object.entries(entityMap)) {
				const relations: Record<string, string> = {};
				for (const [relName, target] of Object.entries(entity.relations)) {
					relations[relName] = target.name;
				}
				(ast.entities as Record<string, EntityAst>)[name] = {
					name,
					roles: [...entity.roles],
					relations,
					abilities: { ...entity.abilities },
				};
			}
			return ast;
		},
		toJSON(indent: number = 2): string {
			return JSON.stringify(this.toAst(), null, indent);
		},
		format(): string {
			return formatSchema(this);
		},
		toMermaid(): string {
			const lines: string[] = ["flowchart TD"];
			for (const [name, entity] of Object.entries(entityMap)) {
				lines.push(`  subgraph ${name}["${name}"]`);
				for (const role of entity.roles) {
					lines.push(`    ${name}_role_${role}["Role: ${role}"]`);
				}
				for (const [ability, rule] of Object.entries(entity.abilities)) {
					const nodeKey = `${name}_can_${ability}`;
					lines.push(`    ${nodeKey}["Can: ${ability}"]`);
					renderMermaid(name, nodeKey, rule, lines);
				}
				lines.push("  end");
			}
			return lines.join("\n");
		},
	};
}

/**
 * Pretty-prints an individual RuleAst into human-readable formatted string.
 */
export function formatRuleAst(ast: RuleAst, indent = 0): string {
	const pad = "  ".repeat(indent);
	switch (ast.kind) {
		case "self":
			return `${pad}self`;
		case "role":
			return `${pad}role("${ast.role}")`;
		case "ability":
			return `${pad}ability("${ast.ability}")`;
		case "traverse":
			return `${pad}traverse(${ast.relation} -> ${ast.targetEntity || "target"}.${formatRuleAst(ast.targetRule, 0).trim()})`;
		case "union":
			return `${pad}union(\n${ast.children.map((c) => formatRuleAst(c, indent + 1)).join(",\n")}\n${pad})`;
		case "intersect":
			return `${pad}intersect(\n${ast.children.map((c) => formatRuleAst(c, indent + 1)).join(",\n")}\n${pad})`;
		case "subtract":
			return `${pad}subtract(\n${formatRuleAst(ast.base, indent + 1)},\n${pad}  unless:\n${formatRuleAst(ast.subtract, indent + 1)}\n${pad})`;
	}
}

/**
 * Pretty-prints an entire Schema into human-readable formatted text.
 */
export function formatSchema(schemaObj: Schema): string {
	const lines: string[] = [];
	for (const [name, entity] of Object.entries(schemaObj.entities)) {
		lines.push(`entity ${name} {`);
		if (entity.roles.length > 0) {
			lines.push(`  roles: [${entity.roles.join(", ")}]`);
		}
		const relEntries = Object.entries(entity.relations);
		if (relEntries.length > 0) {
			lines.push(`  relations: {`);
			for (const [rel, target] of relEntries) {
				lines.push(`    ${rel}: ${target.name}`);
			}
			lines.push(`  }`);
		}
		const abilityEntries = Object.entries(entity.abilities);
		if (abilityEntries.length > 0) {
			lines.push(`  abilities: {`);
			for (const [ability, rule] of abilityEntries) {
				lines.push(`    ${ability}:`);
				lines.push(formatRuleAst(rule, 3));
			}
			lines.push(`  }`);
		}
		lines.push(`}\n`);
	}
	return lines.join("\n").trim();
}

/**
 * Deserializes a SchemaAst into an executable live Schema.
 */
export function schemaFromAst(ast: SchemaAst): Schema {
	const entityMap: Record<string, EntityDefinition> = {};

	// 1. Instantiate base entity definitions and proxies
	for (const [name, def] of Object.entries(ast.entities)) {
		const declaredRoles = [...def.roles];
		const relationsMap: Record<string, EntityDefinition> = {};
		const base: EntityBase = {
			name,
			roles: declaredRoles,
			relations: relationsMap,
			abilities: { ...def.abilities },
		};
		entityMap[name] = createEntityProxy(
			base,
			() => relationsMap,
			declaredRoles,
		);
	}

	// 2. Link cross-entity relationship proxies
	for (const [name, def] of Object.entries(ast.entities)) {
		const entity = entityMap[name];
		for (const [relName, targetName] of Object.entries(def.relations)) {
			if (entityMap[targetName]) {
				(entity.relations as Record<string, EntityDefinition>)[relName] =
					entityMap[targetName];
			}
		}
	}

	return schema(entityMap);
}

/**
 * Deserializes a JSON string into an executable live Schema.
 */
export function schemaFromJSON(jsonString: string): Schema {
	const ast = JSON.parse(jsonString) as SchemaAst;
	return schemaFromAst(ast);
}

function renderMermaid(
	entityName: string,
	sourceKey: string,
	rule: RuleAst,
	lines: string[],
): void {
	switch (rule.kind) {
		case "role":
			lines.push(`    ${sourceKey} --> ${entityName}_role_${rule.role}`);
			break;
		case "ability":
			lines.push(`    ${sourceKey} --> ${entityName}_can_${rule.ability}`);
			break;
		case "traverse": {
			const targetEnt = rule.targetEntity || entityName;
			let targetId = targetEnt;
			if (rule.targetRule.kind === "role") {
				targetId = `${targetEnt}_role_${rule.targetRule.role}`;
			} else if (rule.targetRule.kind === "ability") {
				targetId = `${targetEnt}_can_${rule.targetRule.ability}`;
			}
			lines.push(`    ${sourceKey} -.->|${rule.relation}| ${targetId}`);
			break;
		}
		case "union":
		case "intersect":
			for (const child of rule.children) {
				renderMermaid(entityName, sourceKey, child, lines);
			}
			break;
		case "subtract":
			renderMermaid(entityName, sourceKey, rule.base, lines);
			break;
		case "self":
			lines.push(`    ${sourceKey} --> ${entityName}_self["Self (Caller)"]`);
			break;
	}
}
