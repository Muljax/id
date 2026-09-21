import { formatTupleKey, matchFilter, validateTuple } from "./tuple";
import type { Tuple, TupleFilter, TupleStore } from "./types";

/**
 * Fast in-memory implementation of TupleStore with indexed lookups.
 */
export class MemoryTupleStore implements TupleStore {
	private tuples = new Map<string, Tuple>();
	private byObject = new Map<string, Set<string>>();
	private bySubject = new Map<string, Set<string>>();

	constructor(initialTuples: Tuple[] = []) {
		if (initialTuples.length > 0) {
			this.writeTuplesSync(initialTuples);
		}
	}

	private writeTuplesSync(tuples: Tuple[]): void {
		for (const tuple of tuples) {
			validateTuple(tuple);
			const key = formatTupleKey(tuple);
			if (this.tuples.has(key)) {
				continue;
			}
			this.tuples.set(key, tuple);

			if (!this.byObject.has(tuple.object)) {
				this.byObject.set(tuple.object, new Set());
			}
			this.byObject.get(tuple.object)?.add(key);

			if (!this.bySubject.has(tuple.subject)) {
				this.bySubject.set(tuple.subject, new Set());
			}
			this.bySubject.get(tuple.subject)?.add(key);
		}
	}

	async writeTuples(tuples: Tuple[]): Promise<void> {
		this.writeTuplesSync(tuples);
	}

	async deleteTuples(tuples: Tuple[]): Promise<void> {
		for (const tuple of tuples) {
			const key = formatTupleKey(tuple);
			this.tuples.delete(key);
			this.byObject.get(tuple.object)?.delete(key);
			this.bySubject.get(tuple.subject)?.delete(key);
		}
	}

	async readTuples(filter: TupleFilter): Promise<Tuple[]> {
		let candidateKeys: Set<string> | undefined;

		if (filter.object && this.byObject.has(filter.object)) {
			candidateKeys = new Set(this.byObject.get(filter.object));
		}

		if (filter.subject && this.bySubject.has(filter.subject)) {
			const subjectKeys = this.bySubject.get(filter.subject);
			if (candidateKeys && subjectKeys) {
				const intersection = new Set<string>();
				for (const k of candidateKeys) {
					if (subjectKeys.has(k)) {
						intersection.add(k);
					}
				}
				candidateKeys = intersection;
			} else if (subjectKeys) {
				candidateKeys = new Set(subjectKeys);
			}
		}

		const result: Tuple[] = [];
		const keysToScan = candidateKeys ? candidateKeys : this.tuples.keys();

		for (const key of keysToScan) {
			const tuple = this.tuples.get(key);
			if (tuple && matchFilter(tuple, filter)) {
				result.push(tuple);
			}
		}

		return result;
	}

	/**
	 * Creates a copy of the store containing all current tuples.
	 */
	clone(): MemoryTupleStore {
		return new MemoryTupleStore(Array.from(this.tuples.values()));
	}

	/**
	 * Returns the total count of stored tuples.
	 */
	get size(): number {
		return this.tuples.size;
	}
}
