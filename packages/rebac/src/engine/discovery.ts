import { parseSubject } from "../tuple";
import type { CheckRequest, CheckResult, Tuple, TupleStore } from "../types";

export type CheckFn = (request: CheckRequest) => Promise<CheckResult>;

/**
 * Discovers and lists all objects of a given type accessible under a role or ability.
 */
export async function listAccessibleObjects(
	request: {
		objectType: string;
		can?: string;
		relation?: string;
		subject: string;
		contextualTuples?: Tuple[];
	},
	store: TupleStore,
	check: CheckFn,
): Promise<string[]> {
	const { objectType, can, relation, subject, contextualTuples } = request;
	const target = can || relation || "";

	const allTuples = await store.readTuples({ objectType });
	const candidates = new Set<string>();
	for (const t of allTuples) {
		candidates.add(t.object);
	}

	const results = await Promise.all(
		Array.from(candidates).map(async (obj) => {
			const res = await check({
				object: obj,
				can: target,
				subject,
				contextualTuples,
			});
			return res.allowed ? obj : null;
		}),
	);

	return results.filter((obj): obj is string => obj !== null);
}

/**
 * Discovers and lists all direct and indirect subjects with a specific role or capability on an object.
 */
export async function listMatchingSubjects(
	request: {
		object: string;
		can?: string;
		relation?: string;
		subjectType?: string;
		contextualTuples?: Tuple[];
	},
	store: TupleStore,
	check: CheckFn,
): Promise<string[]> {
	const { object, can, relation, subjectType, contextualTuples } = request;
	const target = can || relation || "";

	const allTuples = await store.readTuples({});
	const candidates = new Set<string>();

	for (const t of allTuples) {
		const parsed = parseSubject(t.subject);
		if (!subjectType || parsed.type === subjectType) {
			candidates.add(t.subject);
		}
	}

	const results = await Promise.all(
		Array.from(candidates).map(async (sub) => {
			const res = await check({
				object,
				can: target,
				subject: sub,
				contextualTuples,
			});
			return res.allowed ? sub : null;
		}),
	);

	return results.filter((sub): sub is string => sub !== null);
}
