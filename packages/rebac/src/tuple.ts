import type { ObjectRef, SubjectRef, Tuple, TupleFilter } from "./types";

const OBJECT_REGEX = /^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.:/@-]+$/;
const RELATION_REGEX = /^[a-zA-Z0-9_.-]+$/;
const SUBJECT_REGEX = /^[a-zA-Z0-9_.-]+:[a-zA-Z0-9_.:/@-]+(#[a-zA-Z0-9_.-]+)?$/;

/**
 * Parses an object string (`<type>:<id>`) into an `ObjectRef`.
 */
export function parseObject(object: string): ObjectRef {
	const colonIndex = object.indexOf(":");
	if (colonIndex === -1 || !OBJECT_REGEX.test(object)) {
		throw new Error(
			`Invalid object format '${object}'. Expected format: '<type>:<id>'.`,
		);
	}
	return {
		type: object.slice(0, colonIndex),
		id: object.slice(colonIndex + 1),
	};
}

/**
 * Formats an `ObjectRef` into standard object string `<type>:<id>`.
 */
export function formatObject(ref: ObjectRef): string {
	return `${ref.type}:${ref.id}`;
}

/**
 * Parses a subject string (`<type>:<id>` or `<type>:<id>#<relation>`) into a `SubjectRef`.
 */
export function parseSubject(subject: string): SubjectRef {
	if (!SUBJECT_REGEX.test(subject)) {
		throw new Error(
			`Invalid subject format '${subject}'. Expected format: '<type>:<id>' or '<type>:<id>#<relation>'.`,
		);
	}

	const hashIndex = subject.indexOf("#");
	const base = hashIndex === -1 ? subject : subject.slice(0, hashIndex);
	const relation = hashIndex === -1 ? undefined : subject.slice(hashIndex + 1);

	const colonIndex = base.indexOf(":");
	return {
		type: base.slice(0, colonIndex),
		id: base.slice(colonIndex + 1),
		relation,
	};
}

/**
 * Formats a `SubjectRef` into standard subject string.
 */
export function formatSubject(ref: SubjectRef): string {
	if (ref.relation) {
		return `${ref.type}:${ref.id}#${ref.relation}`;
	}
	return `${ref.type}:${ref.id}`;
}

/**
 * Validates a relationship tuple against structural constraints.
 */
export function validateTuple(tuple: Tuple): void {
	if (!tuple.object || !OBJECT_REGEX.test(tuple.object)) {
		throw new Error(`Invalid tuple object '${tuple.object}'.`);
	}
	if (!tuple.relation || !RELATION_REGEX.test(tuple.relation)) {
		throw new Error(`Invalid tuple relation '${tuple.relation}'.`);
	}
	if (!tuple.subject || !SUBJECT_REGEX.test(tuple.subject)) {
		throw new Error(`Invalid tuple subject '${tuple.subject}'.`);
	}
}

/**
 * Formats a tuple into standard Zanzibar notation (`<object>#<relation>@<subject>`).
 */
export function formatTupleKey(tuple: Tuple): string {
	return `${tuple.object}#${tuple.relation}@${tuple.subject}`;
}

/**
 * Parses a Zanzibar tuple key string (`<object>#<relation>@<subject>`).
 */
export function parseTupleKey(key: string): Tuple {
	const hashIdx = key.indexOf("#");
	const atIdx = key.indexOf("@");

	if (hashIdx === -1 || atIdx === -1 || atIdx <= hashIdx) {
		throw new Error(
			`Invalid tuple key '${key}'. Expected format: '<object>#<relation>@<subject>'.`,
		);
	}

	const tuple: Tuple = {
		object: key.slice(0, hashIdx),
		relation: key.slice(hashIdx + 1, atIdx),
		subject: key.slice(atIdx + 1),
	};

	validateTuple(tuple);
	return tuple;
}

/**
 * Evaluates whether a tuple matches a given filter.
 */
export function matchFilter(tuple: Tuple, filter: TupleFilter): boolean {
	if (filter.object && tuple.object !== filter.object) {
		return false;
	}
	if (filter.relation && tuple.relation !== filter.relation) {
		return false;
	}
	if (filter.subject && tuple.subject !== filter.subject) {
		return false;
	}
	if (filter.objectType) {
		const parsed = parseObject(tuple.object);
		if (parsed.type !== filter.objectType) {
			return false;
		}
	}
	if (filter.subjectType) {
		const parsed = parseSubject(tuple.subject);
		if (parsed.type !== filter.subjectType) {
			return false;
		}
	}
	return true;
}
