export const INSTANCE_NAME: string =
	import.meta.env.VITE_INSTANCE_NAME ||
	import.meta.env.INSTANCE_NAME ||
	"Muljax ID";

/**
 * Custom instance logo.
 * Supports:
 * - URL: e.g. "https://example.com/logo.svg"
 * - Dist asset / path: e.g. "/assets/logo.svg" or "/logo.png"
 * If not set, defaults to "/assets/logo.svg" placed in public/assets or dist.
 */
export const INSTANCE_LOGO: string =
	import.meta.env.VITE_INSTANCE_LOGO ||
	import.meta.env.INSTANCE_LOGO ||
	"/assets/logo.svg";
