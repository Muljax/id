import { MemoryTupleStore } from "./store";
import { parseObject, parseSubject } from "./tuple";
import type {
	CheckRequest,
	CheckResult,
	ExpandRequest,
	ListObjectsRequest,
	ListSubjectsRequest,
	RewriteRule,
	Schema,
	Tuple,
	TupleStore,
	UsersetTreeNode,
} from "./types";

export interface RebacEngineOptions {
	schema: Schema;
	store: TupleStore;
	maxDepth?: number;
}

/**
 * ReBAC Graph Evaluation Engine.
 *
 * Implements Zanzibar-style recursive relationship resolution with cycle detection,
 * contextual tuple merging, and set rewrites (union, intersection, exclusion, tuple-to-userset).
 */
export class RebacEngine {
	private schema: Schema;
	private store: TupleStore;
	private maxDepth: number;

	constructor(options: RebacEngineOptions) {
		this.schema = options.schema;
		this.store = options.store;
		this.maxDepth = options.maxDepth ?? 25;
	}

	/**
	 * Checks whether a subject has a given relationship on an object.
	 */
	async check(request: CheckRequest): Promise<CheckResult> {
		const visited = new Set<string>();
		let evaluatedNodes = 0;

		const activeStore = request.contextualTuples?.length
			? this.createMergedStore(request.contextualTuples)
			: this.store;

		const evaluate = async (
			object: string,
			relation: string,
			targetSubject: string,
			depth: number,
		): Promise<boolean> => {
			if (depth > this.maxDepth) {
				return false;
			}

			const visitKey = `${object}#${relation}@${targetSubject}`;
			if (visited.has(visitKey)) {
				return false; // Cycle detected
			}
			visited.add(visitKey);
			evaluatedNodes++;

			const objRef = parseObject(object);
			const typeDef = this.schema.types[objRef.type];

			// If type or relation is not defined in schema, fallback to direct lookup
			const rule = typeDef?.relations[relation] ?? { type: "this" };

			return await this.evaluateRule(
				rule,
				object,
				relation,
				targetSubject,
				depth,
				activeStore,
				evaluate,
			);
		};

		const allowed = await evaluate(
			request.object,
			request.relation,
			request.subject,
			0,
		);

		return {
			allowed,
			evaluatedNodes,
		};
	}

	private async evaluateRule(
		rule: RewriteRule,
		object: string,
		relation: string,
		targetSubject: string,
		depth: number,
		store: TupleStore,
		evaluate: (
			obj: string,
			rel: string,
			sub: string,
			d: number,
		) => Promise<boolean>,
	): Promise<boolean> {
		switch (rule.type) {
			case "this": {
				// 1. Direct match: <object>#<relation>@<targetSubject>
				const directTuples = await store.readTuples({
					object,
					relation,
				});

				for (const tuple of directTuples) {
					if (tuple.subject === targetSubject) {
						return true;
					}

					// 2. Userset expansion: if tuple.subject is <type>:<id>#<subRelation>,
					// check if targetSubject is a member of that userset
					if (tuple.subject.includes("#")) {
						const parsed = parseSubject(tuple.subject);
						if (parsed.relation) {
							const parentObj = `${parsed.type}:${parsed.id}`;
							const isMember = await evaluate(
								parentObj,
								parsed.relation,
								targetSubject,
								depth + 1,
							);
							if (isMember) {
								return true;
							}
						}
					}
				}

				return false;
			}

			case "computed_userset": {
				return await evaluate(object, rule.relation, targetSubject, depth + 1);
			}

			case "tuple_to_userset": {
				// Find intermediate objects via tuplesetRelation
				const intermediateTuples = await store.readTuples({
					object,
					relation: rule.tuplesetRelation,
				});

				for (const t of intermediateTuples) {
					const intermediateObj = t.subject;
					// If subject is of format `<type>:<id>`, traverse
					if (!intermediateObj.includes("#")) {
						const hasAccess = await evaluate(
							intermediateObj,
							rule.computedRelation,
							targetSubject,
							depth + 1,
						);
						if (hasAccess) {
							return true;
						}
					}
				}

				return false;
			}

			case "union": {
				for (const child of rule.children) {
					const ok = await this.evaluateRule(
						child,
						object,
						relation,
						targetSubject,
						depth + 1,
						store,
						evaluate,
					);
					if (ok) {
						return true;
					}
				}
				return false;
			}

			case "intersection": {
				for (const child of rule.children) {
					const ok = await this.evaluateRule(
						child,
						object,
						relation,
						targetSubject,
						depth + 1,
						store,
						evaluate,
					);
					if (!ok) {
						return false;
					}
				}
				return true;
			}

			case "exclusion": {
				const baseOk = await this.evaluateRule(
					rule.base,
					object,
					relation,
					targetSubject,
					depth + 1,
					store,
					evaluate,
				);
				if (!baseOk) {
					return false;
				}

				const subtractOk = await this.evaluateRule(
					rule.subtract,
					object,
					relation,
					targetSubject,
					depth + 1,
					store,
					evaluate,
				);
				return !subtractOk;
			}
		}
	}

	/**
	 * Lists all objects of a given type accessible to a subject under a relation.
	 */
	async listObjects(request: ListObjectsRequest): Promise<string[]> {
		const store = request.contextualTuples?.length
			? this.createMergedStore(request.contextualTuples)
			: this.store;

		const candidateTuples = await store.readTuples({
			objectType: request.objectType,
		});

		const uniqueObjects = new Set<string>();
		for (const t of candidateTuples) {
			uniqueObjects.add(t.object);
		}

		const allowedObjects: string[] = [];
		for (const obj of uniqueObjects) {
			const res = await this.check({
				object: obj,
				relation: request.relation,
				subject: request.subject,
				contextualTuples: request.contextualTuples,
			});
			if (res.allowed) {
				allowedObjects.push(obj);
			}
		}

		return allowedObjects.sort();
	}

	/**
	 * Lists all direct and indirect subjects holding a relation on an object.
	 */
	async listSubjects(request: ListSubjectsRequest): Promise<string[]> {
		const store = request.contextualTuples?.length
			? this.createMergedStore(request.contextualTuples)
			: this.store;

		const allTuples = await store.readTuples({});
		const candidateSubjects = new Set<string>();

		for (const t of allTuples) {
			if (!t.subject.includes("#")) {
				if (
					!request.subjectType ||
					parseSubject(t.subject).type === request.subjectType
				) {
					candidateSubjects.add(t.subject);
				}
			}
		}

		const allowedSubjects: string[] = [];
		for (const sub of candidateSubjects) {
			const res = await this.check({
				object: request.object,
				relation: request.relation,
				subject: sub,
				contextualTuples: request.contextualTuples,
			});
			if (res.allowed) {
				allowedSubjects.push(sub);
			}
		}

		return allowedSubjects.sort();
	}

	/**
	 * Expands an authorization relation into a userset explanation tree.
	 */
	async expand(request: ExpandRequest): Promise<UsersetTreeNode> {
		const store = request.contextualTuples?.length
			? this.createMergedStore(request.contextualTuples)
			: this.store;

		const objRef = parseObject(request.object);
		const typeDef = this.schema.types[objRef.type];
		const rule = typeDef?.relations[request.relation] ?? { type: "this" };

		const directTuples = await store.readTuples({
			object: request.object,
			relation: request.relation,
		});

		return {
			type: "leaf",
			subjects: directTuples.map((t) => t.subject),
		};
	}

	private createMergedStore(contextualTuples: Tuple[]): TupleStore {
		const merged = new MemoryTupleStore();
		// In an edge runtime, contextual tuples augment the base store
		return {
			readTuples: async (filter) => {
				const baseResults = await this.store.readTuples(filter);
				const ctxResults = await merged.readTuples(filter);
				const seen = new Set<string>();
				const combined: Tuple[] = [];
				for (const t of [...baseResults, ...ctxResults, ...contextualTuples]) {
					const k = `${t.object}#${t.relation}@${t.subject}`;
					if (!seen.has(k)) {
						seen.add(k);
						combined.push(t);
					}
				}
				return combined;
			},
			writeTuples: async (tuples) => this.store.writeTuples(tuples),
			deleteTuples: async (tuples) => this.store.deleteTuples(tuples),
		};
	}
}
