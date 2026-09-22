import { createMergedStore } from "./engine/context";
import {
	listAccessibleObjects,
	listMatchingSubjects,
} from "./engine/discovery";
import { asyncSome, evaluateRule } from "./engine/evaluator";
import { expandUserset } from "./engine/expansion";
import { formatObject, parseObject, parseSubject } from "./tuple";
import type {
	CheckRequest,
	CheckResult,
	RuleAst,
	RuleExpression,
	Schema,
	Tuple,
	TupleStore,
	UsersetTreeNode,
} from "./types";

export * from "./engine/context";
export * from "./engine/discovery";
export * from "./engine/evaluator";
export * from "./engine/expansion";

export interface RebacEngineOptions {
	schema: Schema;
	store: TupleStore;
	maxDepth?: number;
}

const astIdMap = new WeakMap<object, number>();
let nextAstId = 1;

function getTargetKey(target: string | RuleAst): string {
	if (typeof target === "string") {
		return target;
	}
	let id = astIdMap.get(target);
	if (!id) {
		id = nextAstId++;
		astIdMap.set(target, id);
	}
	return `ast#${id}`;
}

/**
 * High-performance Zanzibar evaluation engine orchestrator.
 */
export class RebacEngine {
	readonly schema: Schema;
	readonly store: TupleStore;
	readonly maxDepth: number;

	constructor(options: RebacEngineOptions) {
		this.schema = options.schema;
		this.store = options.store;
		this.maxDepth = options.maxDepth ?? 25;
	}

	/**
	 * Evaluates whether a subject has a specific role or capability on an object.
	 */
	async check(request: CheckRequest): Promise<CheckResult> {
		const { object, abilityOrRole, subject, contextualTuples } =
			this.normalizeRequest(request);

		const activeStack = new Set<string>();
		const memoCache = new Map<string, boolean>();
		let evaluatedNodes = 0;

		const activeStore = contextualTuples?.length
			? createMergedStore(this.store, contextualTuples)
			: this.store;

		const subjectClosureCache = new Map<string, Promise<Set<string>>>();

		const getSubjectClosure = async (sub: string): Promise<Set<string>> => {
			if (subjectClosureCache.has(sub)) {
				return subjectClosureCache.get(sub)!;
			}
			const promise = (async () => {
				const closure = new Set<string>([sub]);
				const queue = [sub];
				const subVisited = new Set<string>();

				while (queue.length > 0) {
					const curr = queue.shift()!;
					if (subVisited.has(curr)) continue;
					subVisited.add(curr);

					const directTuples = await activeStore.readTuples({ subject: curr });
					for (const t of directTuples) {
						closure.add(t.object);
						const usersetRef = `${t.object}#${t.relation}`;
						closure.add(usersetRef);
						if (!subVisited.has(usersetRef)) {
							queue.push(usersetRef);
						}
						if (!subVisited.has(t.object)) {
							queue.push(t.object);
						}
					}
				}
				return closure;
			})();
			subjectClosureCache.set(sub, promise);
			return promise;
		};

		const evaluate = async (
			currObj: string,
			currTarget: string | RuleAst,
			currSub: string,
			depth: number,
		): Promise<boolean> => {
			if (depth > this.maxDepth) {
				throw new Error(
					`ReBAC evaluation depth limit (${this.maxDepth}) exceeded for ${currObj} on ${currSub}. Cycle detected.`,
				);
			}

			const targetKey = getTargetKey(currTarget);
			const memoKey = `${currObj}#${targetKey}@${currSub}`;

			// 1. Instant return for already-resolved nodes (Diamond DAG memoization)
			if (memoCache.has(memoKey)) {
				return memoCache.get(memoKey)!;
			}

			// 2. Active Ancestor Loop Detection: If key is on active call stack, break cycle!
			if (activeStack.has(memoKey)) {
				return false;
			}

			activeStack.add(memoKey);
			evaluatedNodes++;

			let result = false;
			try {
				// Direct AST evaluation
				if (typeof currTarget !== "string") {
					result = await evaluateRule(
						currTarget,
						currObj,
						currSub,
						depth,
						activeStore,
						evaluate,
						getSubjectClosure,
					);
				} else if (currTarget === "self") {
					result = currObj === currSub;
				} else {
					const objRef = parseObject(currObj);
					const entity = this.schema.getEntity(objRef.type);

					// Check if target is a direct Role
					if (entity?.roles.includes(currTarget)) {
						const tuples = await activeStore.readTuples({
							object: currObj,
							relation: currTarget,
						});

						const usersets: Tuple[] = [];
						let directHit = false;

						for (const tuple of tuples) {
							if (tuple.subject === currSub) {
								directHit = true;
								break;
							}
							if (tuple.subject.includes("#")) {
								usersets.push(tuple);
							}
						}

						if (directHit) {
							result = true;
						} else if (usersets.length === 0) {
							result = false;
						} else {
							// Reverse Subject Transitive Closure Check
							const closure = await getSubjectClosure(currSub);
							let matchedClosure = false;
							for (const u of usersets) {
								const parsed = parseSubject(u.subject);
								const baseObj = formatObject({
									type: parsed.type,
									id: parsed.id,
								});
								if (closure.has(u.subject) || closure.has(baseObj)) {
									matchedClosure = true;
									break;
								}
							}

							if (matchedClosure) {
								result = true;
							} else {
								result = await asyncSome(usersets, async (tuple) => {
									const parsedSub = parseSubject(tuple.subject);
									if (!parsedSub.relation) return false;
									const usersetObj = formatObject({
										type: parsedSub.type,
										id: parsedSub.id,
									});
									return evaluate(
										usersetObj,
										parsedSub.relation,
										currSub,
										depth + 1,
									);
								});
							}
						}
					} else {
						// Check if target is a defined ability
						const abilityRule = entity?.abilities[currTarget];
						if (abilityRule) {
							result = await evaluateRule(
								abilityRule,
								currObj,
								currSub,
								depth,
								activeStore,
								evaluate,
								getSubjectClosure,
							);
						} else {
							// Fallback: check direct tuple relation matching the string
							const fallbackTuples = await activeStore.readTuples({
								object: currObj,
								relation: currTarget,
							});

							result = fallbackTuples.some((t) => t.subject === currSub);
						}
					}
				}

				memoCache.set(memoKey, result);
				return result;
			} finally {
				activeStack.delete(memoKey);
			}
		};

		const allowed = await evaluate(object, abilityOrRole, subject, 0);
		return { allowed, evaluatedNodes };
	}

	/**
	 * Lists all objects of a given type accessible by a subject under a role or capability.
	 */
	async listObjects(request: {
		objectType: string;
		can?: string;
		relation?: string;
		subject: string;
		contextualTuples?: Tuple[];
	}): Promise<string[]> {
		const activeStore = request.contextualTuples?.length
			? createMergedStore(this.store, request.contextualTuples)
			: this.store;

		return listAccessibleObjects(request, activeStore, (r) => this.check(r));
	}

	/**
	 * Lists all direct and indirect subjects with a specific role or capability on an object.
	 */
	async listSubjects(request: {
		object: string;
		can?: string;
		relation?: string;
		subjectType?: string;
		contextualTuples?: Tuple[];
	}): Promise<string[]> {
		const activeStore = request.contextualTuples?.length
			? createMergedStore(this.store, request.contextualTuples)
			: this.store;

		return listMatchingSubjects(request, activeStore, (r) => this.check(r));
	}

	/**
	 * Expands the tree of subjects for a given object and relation.
	 */
	async expand(request: {
		object: string;
		relation: string;
		contextualTuples?: Tuple[];
	}): Promise<UsersetTreeNode> {
		const activeStore = request.contextualTuples?.length
			? createMergedStore(this.store, request.contextualTuples)
			: this.store;

		return expandUserset(request, activeStore);
	}

	private normalizeRequest(request: CheckRequest): {
		object: string;
		abilityOrRole: string | RuleAst;
		subject: string;
		contextualTuples?: Tuple[];
	} {
		if ("user" in request) {
			const abilityOrRole: string | RuleAst =
				typeof request.can === "string"
					? request.can
					: (request.can as RuleExpression).ast;
			return {
				object: request.on,
				abilityOrRole,
				subject: request.user,
				contextualTuples: request.contextualTuples,
			};
		}

		let object = "";
		if ("object" in request && typeof request.object === "string") {
			object = request.object;
		} else {
			const req = request as { objectType: string; objectId: string };
			object = formatObject({ type: req.objectType, id: req.objectId });
		}

		const target = request.can || request.relation || "";
		return {
			object,
			abilityOrRole: target,
			subject: request.subject,
			contextualTuples: request.contextualTuples,
		};
	}
}
