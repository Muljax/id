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

	if (required.includes(":")) {
		const parts = required.split(":");
		for (let i = 1; i < parts.length; i++) {
			const prefixWildcard = `${parts.slice(0, i).join(":")}:*`;
			if (set.has(prefixWildcard)) {
				return true;
			}
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
