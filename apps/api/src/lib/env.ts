/**
 * Checks whether the application is running in local development mode.
 */
export function isLocalhost(env: Env): boolean {
	return (env.LOCALHOST as string) === "true";
}

/**
 * Returns the HTTP protocol based on the environment configuration.
 */
export function getProtocol(env: Env): "http" | "https" {
	return isLocalhost(env) ? "http" : "https";
}

/**
 * Returns the full dashboard origin URL based on the environment.
 */
export function getDashboardOrigin(env: Env): string {
	return `${getProtocol(env)}://${env.DASHBOARD_DOMAIN}`;
}
