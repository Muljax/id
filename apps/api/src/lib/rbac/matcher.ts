/**
 * Evaluates whether a set of granted permissions satisfies a required permission.
 * Supports:
 * - Global superuser wildcard: '*'
 * - Resource wildcard: 'users:*' matches 'users:read', 'users:write', etc.
 * - Exact match: 'users:read' matches 'users:read'
 *
 * @param grantedPermissions Set or array of granted permission strings.
 * @param required The permission string being required.
 * @returns boolean True if permission is satisfied.
 */
export function hasPermission(
	grantedPermissions: ReadonlySet<string> | readonly string[],
	required: string,
): boolean {
	const set =
		grantedPermissions instanceof Set
			? grantedPermissions
			: new Set(grantedPermissions);

	if (set.has("*") || set.has(required)) {
		return true;
	}

	const colonIndex = required.indexOf(":");
	if (colonIndex !== -1) {
		const resourceWildcard = `${required.slice(0, colonIndex)}:*`;
		if (set.has(resourceWildcard)) {
			return true;
		}
	}

	return false;
}

/**
 * Checks if all required permissions are satisfied.
 */
export function hasAllPermissions(
	granted: ReadonlySet<string> | readonly string[],
	required: string[],
): boolean {
	return required.every((p) => hasPermission(granted, p));
}

/**
 * Checks if at least one of the required permissions is satisfied.
 */
export function hasAnyPermission(
	granted: ReadonlySet<string> | readonly string[],
	required: string[],
): boolean {
	return required.some((p) => hasPermission(granted, p));
}
