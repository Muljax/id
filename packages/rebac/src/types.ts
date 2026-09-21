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
 * Canonical relationship tuple in Zanzibar notation.
 * Represents: `<object>#<relation>@<subject>`
 * e.g. `document:readme#viewer@group:engineering#member`
 */
export interface Tuple {
	object: string;
	relation: string;
	subject: string;
}

/**
 * Query filter for selecting relationship tuples.
 */
export interface TupleFilter {
	object?: string;
	objectType?: string;
	relation?: string;
	subject?: string;
	subjectType?: string;
}

export type RewriteRule =
	| { type: "this" }
	| { type: "computed_userset"; relation: string }
	| {
			type: "tuple_to_userset";
			tuplesetRelation: string;
			computedRelation: string;
	  }
	| { type: "union"; children: RewriteRule[] }
	| { type: "intersection"; children: RewriteRule[] }
	| { type: "exclusion"; base: RewriteRule; subtract: RewriteRule };

/**
 * Type-level schema specification for an object namespace.
 */
export interface TypeDefinition {
	name: string;
	relations: Record<string, RewriteRule>;
}

/**
 * Full ReBAC authorization schema.
 */
export interface Schema {
	types: Record<string, TypeDefinition>;
}

export interface CheckRequest {
	object: string;
	relation: string;
	subject: string;
	contextualTuples?: Tuple[];
}

export interface CheckResult {
	allowed: boolean;
	evaluatedNodes: number;
}

export interface ExpandRequest {
	object: string;
	relation: string;
	contextualTuples?: Tuple[];
}

export interface UsersetTreeNode {
	type: "leaf" | "union" | "intersection" | "exclusion";
	subjects?: string[];
	children?: UsersetTreeNode[];
}

export interface ListObjectsRequest {
	objectType: string;
	relation: string;
	subject: string;
	contextualTuples?: Tuple[];
}

export interface ListSubjectsRequest {
	object: string;
	relation: string;
	subjectType?: string;
	contextualTuples?: Tuple[];
}

/**
 * Pluggable tuple persistence store interface.
 */
export interface TupleStore {
	readTuples(filter: TupleFilter): Promise<Tuple[]>;
	writeTuples(tuples: Tuple[]): Promise<void>;
	deleteTuples(tuples: Tuple[]): Promise<void>;
}
