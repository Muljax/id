import type { Tuple, TupleStore, UsersetTreeNode } from "../types";

/**
 * Expands the tree of subjects for a given object and relation.
 */
export async function expandUserset(
	request: {
		object: string;
		relation: string;
		contextualTuples?: Tuple[];
	},
	store: TupleStore,
): Promise<UsersetTreeNode> {
	const tuples = await store.readTuples({
		object: request.object,
		relation: request.relation,
	});

	return {
		type: "leaf",
		subjects: tuples.map((t) => t.subject),
	};
}
