import { parseObject, parseSubject } from "../tuple";
import type { Tuple, TupleStore } from "../types";

/**
 * Creates an ephemeral overlay store merging persistent storage with request contextual tuples.
 */
export function createMergedStore(
	baseStore: TupleStore,
	contextualTuples: Tuple[],
): TupleStore {
	return {
		async readTuples(filter) {
			const base = await baseStore.readTuples(filter);
			const ctx = contextualTuples.filter((t) => {
				if (filter.object && t.object !== filter.object) return false;
				if (filter.relation && t.relation !== filter.relation) return false;
				if (filter.subject && t.subject !== filter.subject) return false;
				if (filter.objectType) {
					const objRef = parseObject(t.object);
					if (objRef.type !== filter.objectType) return false;
				}
				if (filter.subjectType) {
					const subRef = parseSubject(t.subject);
					if (subRef.type !== filter.subjectType) return false;
				}
				return true;
			});

			const seen = new Set<string>();
			const merged: Tuple[] = [];
			for (const t of [...base, ...ctx]) {
				const k = `${t.object}#${t.relation}@${t.subject}`;
				if (!seen.has(k)) {
					seen.add(k);
					merged.push(t);
				}
			}
			return merged;
		},
		async writeTuples(tuples) {
			await baseStore.writeTuples(tuples);
		},
		async deleteTuples(tuples) {
			await baseStore.deleteTuples(tuples);
		},
	};
}
