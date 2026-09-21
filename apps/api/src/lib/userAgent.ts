/**
 * Parsed browser and operating system information from a user agent.
 */
export interface UserAgentInfo {
	browser: string;
	os: string;
}

/**
 * Parses browser and operating system information from a user agent.
 *
 * @param userAgent The user agent string to parse.
 * @returns The parsed browser and operating system information.
 */
export function parseUserAgent(userAgent: string | undefined): UserAgentInfo {
	if (!userAgent) {
		return {
			browser: "Unknown browser",
			os: "Unknown OS",
		};
	}

	return {
		browser: parseBrowser(userAgent),
		os: parseOS(userAgent),
	};
}

function parseBrowser(userAgent: string): string {
	if (/Edg\//i.test(userAgent)) {
		return "Edge";
	}

	if (/OPR\//i.test(userAgent)) {
		return "Opera";
	}

	if (/Chrome\//i.test(userAgent)) {
		return "Chrome";
	}

	if (/Firefox\//i.test(userAgent)) {
		return "Firefox";
	}

	if (/Safari\//i.test(userAgent)) {
		return "Safari";
	}

	if (/MSIE|Trident\//i.test(userAgent)) {
		return "Internet Explorer";
	}

	return "Unknown browser";
}

function parseOS(userAgent: string): string {
	if (/Windows NT/i.test(userAgent)) {
		return "Windows";
	}

	if (/iPhone|iPad|iPod/i.test(userAgent)) {
		return "iOS";
	}

	if (/Android/i.test(userAgent)) {
		return "Android";
	}

	if (/Mac OS X/i.test(userAgent)) {
		return "macOS";
	}

	if (/CrOS/i.test(userAgent)) {
		return "ChromeOS";
	}

	if (/Linux/i.test(userAgent)) {
		return "Linux";
	}

	return "Unknown OS";
}
