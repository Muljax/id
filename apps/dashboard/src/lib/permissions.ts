import type { AuthUser } from "./api";

export function checkPermission(
	grantedPermissions: ReadonlySet<string> | readonly string[] | undefined,
	required: string,
): boolean {
	if (!grantedPermissions) {
		return false;
	}

	const set =
		grantedPermissions instanceof Set
			? grantedPermissions
			: new Set(grantedPermissions);

	if (set.size === 0) {
		return false;
	}

	if (set.has("*") || set.has(required)) {
		return true;
	}

	const colonIndex = required.indexOf(":");
	if (colonIndex !== -1) {
		const prefixWildcard = `${required.slice(0, colonIndex)}:*`;
		if (set.has(prefixWildcard)) {
			return true;
		}
	}

	return false;
}

export function userHasPermission(
	user: AuthUser | null | undefined,
	required: string,
): boolean {
	if (!user) {
		return false;
	}

	return checkPermission(user.permissions, required);
}

export function userHasAnyPermission(
	user: AuthUser | null | undefined,
	required: string[],
): boolean {
	return required.some((p) => userHasPermission(user, p));
}
