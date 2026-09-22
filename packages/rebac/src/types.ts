/**
 * Reference to an entity object in the ReBAC graph (<type>:<id>).
 */
export interface ObjectRef {
	type: string;
	id: string;
}

/**
 * Reference to a subject in the ReBAC graph (<type>:<id> or <type>:<id>#<relation>).
 */
export interface SubjectRef {
	type: string;
	id: string;
	relation?: string;
}

/**
 * Relationship tuple in canonical Zanzibar notation (<object>#<relation>@<subject>).
 */
export interface Tuple {
	object: string;
	relation: string;
	subject: string;
}

/**
 * Query filter for indexed tuple store lookups.
 */
export interface TupleFilter {
	object?: string;
	objectType?: string;
	relation?: string;
	subject?: string;
	subjectType?: string;
}

/**
 * Internal AST Rule Node for Graph Evaluation.
 */
export type RuleAst =
	| { readonly kind: "self" }
	| {
			readonly kind: "role";
			readonly role: string;
			readonly targetEntity?: string;
	  }
	| {
			readonly kind: "ability";
			readonly ability: string;
			readonly targetEntity?: string;
	  }
	| {
			readonly kind: "traverse";
			readonly relation: string;
			readonly targetEntity: string;
			readonly targetRule: RuleAst;
	  }
	| { readonly kind: "union"; readonly children: readonly RuleAst[] }
	| { readonly kind: "intersect"; readonly children: readonly RuleAst[] }
	| {
			readonly kind: "subtract";
			readonly base: RuleAst;
			readonly subtract: RuleAst;
	  };

/**
 * Fluent Rule Builder Interface returned by is(...), Entity.relation(...), etc.
 */
export interface RuleExpression {
	readonly ast: RuleAst;
	or(...others: readonly (RuleExpression | string)[]): RuleExpression;
	and(...others: readonly (RuleExpression | string)[]): RuleExpression;
	unless(...exclusions: readonly (RuleExpression | string)[]): RuleExpression;
}

/**
 * Proxy representing entity relation functions in builders.
 */
export type EntityProxy = {
	[relationOrAbility: string]: (
		target: RuleExpression | string,
	) => RuleExpression;
};

/**
 * Entity configuration provided to define().
 */
export interface EntityConfig<TRoles extends string = string> {
	relations?: Record<string, EntityDefinition>;
	roles?: readonly TRoles[];
	can?:
		| Record<string, RuleExpression | string>
		| ((self: EntityProxy) => Record<string, RuleExpression | string>);
}

/**
 * Property on an Entity definition (either a RuleExpression or a callable relation traversal).
 */
export type EntityProperty = RuleExpression &
	((target: RuleExpression | string) => RuleExpression);

/**
 * Base metadata on an Entity definition.
 */
export interface EntityBase<TName extends string = string> {
	readonly name: TName;
	readonly roles: readonly string[];
	readonly relations: Record<string, EntityDefinition>;
	readonly abilities: Record<string, RuleAst>;
}

/**
 * Compiled Entity definition with dynamic relation and ability properties.
 */
export type EntityDefinition<TName extends string = string> =
	EntityBase<TName> & {
		readonly [relationOrAbility: string]: EntityProperty;
	};

/**
 * Serialized AST representation of an Entity.
 */
export interface EntityAst {
	readonly name: string;
	readonly roles: readonly string[];
	readonly relations: Record<string, string>;
	readonly abilities: Record<string, RuleAst>;
}

/**
 * Serialized AST representation of the full Schema.
 */
export interface SchemaAst {
	readonly entities: Record<string, EntityAst>;
}

/**
 * Compiled Authorization Schema.
 */
export interface Schema {
	readonly entities: Record<string, EntityDefinition>;
	getEntity(name: string): EntityDefinition | undefined;
	toAst(): SchemaAst;
	toJSON(indent?: number): string;
	toMermaid(): string;
	format(): string;
}

/**
 * Check request input.
 */
export type CheckRequest =
	| {
			object: string;
			can?: string;
			relation?: string;
			subject: string;
			contextualTuples?: Tuple[];
	  }
	| {
			objectType: string;
			objectId: string;
			can?: string;
			relation?: string;
			subject: string;
			contextualTuples?: Tuple[];
	  }
	| {
			user: string;
			can: string | RuleExpression;
			on: string;
			contextualTuples?: Tuple[];
	  };

/**
 * Check response result.
 */
export interface CheckResult {
	readonly allowed: boolean;
	readonly evaluatedNodes: number;
}

/**
 * Userset expansion tree node.
 */
export interface UsersetTreeNode {
	readonly type: "leaf" | "union" | "intersect" | "subtract";
	readonly subjects?: readonly string[];
	readonly children?: readonly UsersetTreeNode[];
}

/**
 * Pluggable tuple persistence store interface.
 */
export interface TupleStore {
	readTuples(filter: TupleFilter): Promise<Tuple[]>;
	writeTuples(tuples: Tuple[]): Promise<void>;
	deleteTuples(tuples: Tuple[]): Promise<void>;
}
