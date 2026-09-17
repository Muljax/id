import { hasPermission } from "../rbac/matcher";
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

/**
 * Computes the full set of allowed SSH principals for a user based on their identity and roles.
 *
 * Implements Option A:
 * - Standard users receive their own derived username principal.
 * - Users with administrative privileges (`admin` role or `*` permission) also receive standard
 *   system administrator principals (`root`, `admin`, `ubuntu`, `debian`, `ec2-user`, `wheel`).
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
		hasPermission(permissions, "*") ||
		hasPermission(permissions, "ssh:*");

	if (isAdministrator) {
		permitted.push(...ADMIN_PRINCIPALS);
	}

	return validatePrincipals(permitted);
}
