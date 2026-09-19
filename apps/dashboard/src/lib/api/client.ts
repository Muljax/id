const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
	throw new Error("VITE_API_URL is not configured");
}

export class ApiError extends Error {
	readonly status: number;
	readonly error: string;
	readonly errorDescription?: string;

	constructor(status: number, error: string, errorDescription?: string) {
		super(
			errorDescription || error || "Something went wrong. Please try again.",
		);
		this.name = "ApiError";
		this.status = status;
		this.error = error;
		this.errorDescription = errorDescription;
	}
}

export async function api<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: "include",
		headers: {
			...(options.body instanceof FormData
				? {}
				: { "Content-Type": "application/json" }),
			...options.headers,
		},
	});

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		const errorCode = data?.error ?? "unknown_error";
		const errorDescription = data?.error_description ?? data?.message;

		throw new ApiError(response.status, errorCode, errorDescription);
	}

	return data as T;
}

export { API_URL };
