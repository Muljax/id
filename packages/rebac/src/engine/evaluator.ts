import type { RuleAst, TupleStore } from "../types";

export type EvaluationFunction = (
	currObj: string,
	target: string | RuleAst,
	currSub: string,
	depth: number,
) => Promise<boolean>;

export type SubjectClosureGetter = (subject: string) => Promise<Set<string>>;

/**
 * Evaluates an array of async predicates concurrently with early short-circuiting on the first true match.
 */
export async function asyncSome<T>(
	items: readonly T[],
	fn: (item: T) => Promise<boolean>,
): Promise<boolean> {
	if (items.length === 0) return false;
	if (items.length === 1 && items[0] !== undefined) return fn(items[0]);

	return new Promise<boolean>((resolve) => {
		let pending = items.length;
		let resolved = false;

		for (const item of items) {
			fn(item).then(
				(match) => {
					if (resolved) return;
					if (match) {
						resolved = true;
						resolve(true);
					} else {
						pending--;
						if (pending === 0) {
							resolve(false);
						}
					}
				},
				() => {
					if (resolved) return;
					pending--;
					if (pending === 0) {
						resolve(false);
					}
				},
			);
		}
	});
}

/**
 * Evaluates an AST rule node against an object and subject.
 */
export async function evaluateRule(
	rule: RuleAst,
	currObj: string,
	currSub: string,
	depth: number,
	store: TupleStore,
	evaluate: EvaluationFunction,
	getSubjectClosure?: SubjectClosureGetter,
): Promise<boolean> {
	switch (rule.kind) {
		case "self":
			return currObj === currSub;

		case "role":
			return evaluate(currObj, rule.role, currSub, depth);

		case "ability":
			return evaluate(currObj, rule.ability, currSub, depth);

		case "traverse": {
			const linkTuples = await store.readTuples({
				object: currObj,
				relation: rule.relation,
			});

			if (linkTuples.length === 0) {
				return false;
			}

			// Fast check 1: Direct subject link
			for (const link of linkTuples) {
				if (link.subject === currSub) {
					return true;
				}
			}

			// Fast check 2: Reverse Subject Transitive Closure Check
			if (getSubjectClosure) {
				const closure = await getSubjectClosure(currSub);
				for (const link of linkTuples) {
					if (closure.has(link.subject)) {
						const match = await evaluate(
							link.subject,
							rule.targetRule,
							currSub,
							depth + 1,
						);
						if (match) return true;
					}
				}
			}

			return asyncSome(linkTuples, (link) =>
				evaluate(link.subject, rule.targetRule, currSub, depth + 1),
			);
		}

		case "union": {
			for (const child of rule.children) {
				const match = await evaluateRule(
					child,
					currObj,
					currSub,
					depth,
					store,
					evaluate,
					getSubjectClosure,
				);
				if (match) return true;
			}
			return false;
		}

		case "intersect": {
			const results = await Promise.all(
				rule.children.map((child) =>
					evaluateRule(
						child,
						currObj,
						currSub,
						depth,
						store,
						evaluate,
						getSubjectClosure,
					),
				),
			);
			return results.every(Boolean);
		}

		case "subtract": {
			const baseMatch = await evaluateRule(
				rule.base,
				currObj,
				currSub,
				depth,
				store,
				evaluate,
				getSubjectClosure,
			);
			if (!baseMatch) return false;

			const subtractMatch = await evaluateRule(
				rule.subtract,
				currObj,
				currSub,
				depth,
				store,
				evaluate,
				getSubjectClosure,
			);
			return !subtractMatch;
		}
	}
}
