import { validatePrincipals } from "./validation";

export const ADMIN_PRINCIPALS: readonly string[] = [
	"root",
	"admin",
	"ubuntu",
	"debian",
	"ec2-user",
	"wheel",
] as const;

export interface PrincipalUser {
	id: string;
	email: string;
	displayName?: string | null;
}

/**
 * Derives a sanitized UNIX username from a user's display name or email.
 *
 * @param user User identity with email and optional display name.
 * @returns Clean, lowercase POSIX-compatible principal string.
 */
export function deriveDefaultPrincipal(user: PrincipalUser): string {
	const raw = user.displayName?.trim() || user.email.split("@")[0] || "user";
	// Replace non-alphanumeric characters with underscores, force lowercase
	const sanitized = raw
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "_")
		.replace(/^_+/, "");

	return sanitized.slice(0, 32) || "user";
}

function hasWildcardOrExactPermission(
	permissions: ReadonlySet<string>,
	required: string,
): boolean {
	if (permissions.has("*") || permissions.has(required)) {
		return true;
	}
	if (required.includes(":")) {
		const parts = required.split(":");
		for (let i = 1; i < parts.length; i++) {
			const prefixWildcard = `${parts.slice(0, i).join(":")}:*`;
			if (permissions.has(prefixWildcard)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Computes the full set of allowed SSH principals for a user based on their identity and roles.
 *
 * @param user User identity.
 * @param roles Array of role IDs assigned to the user.
 * @param permissions Set of effective permissions granted to the user.
 * @returns Deduplicated list of permitted principals.
 */
export function getPermittedPrincipals(
	user: PrincipalUser,
	roles: readonly string[],
	permissions: ReadonlySet<string>,
): string[] {
	const defaultPrincipal = deriveDefaultPrincipal(user);
	const permitted = [defaultPrincipal];

	const isAdministrator =
		roles.includes("admin") ||
		hasWildcardOrExactPermission(permissions, "*") ||
		hasWildcardOrExactPermission(permissions, "ssh:*") ||
		hasWildcardOrExactPermission(permissions, "ssh:principal:*");

	if (isAdministrator) {
		permitted.push(...ADMIN_PRINCIPALS);
	}

	for (const perm of permissions) {
		if (perm.startsWith("ssh:principal:")) {
			const candidate = perm.slice("ssh:principal:".length);
			if (candidate && candidate !== "*") {
				permitted.push(candidate);
			}
		}
	}

	return validatePrincipals(permitted);
}
