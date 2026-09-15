export type ValidatorFn<T = unknown, F = unknown> = (
	value: T,
	form: F,
) => string | null | undefined;

export const validators = {
	/**
	 * Validates that a value is present and non-empty.
	 */
	required: (
		message = "This field is required.",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (value === null || value === undefined) {
				return message;
			}
			if (typeof value === "string" && !value.trim()) {
				return message;
			}
			if (Array.isArray(value) && value.length === 0) {
				return message;
			}
			return null;
		};
	},

	/**
	 * Validates that a string is a properly formatted email address.
	 */
	email: (
		message = "Please enter a valid email address.",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value.trim())) {
				return message;
			}
			return null;
		};
	},

	/**
	 * Validates that a string does not exceed the maximum character length.
	 */
	maxLength: (max: number, message?: string): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (typeof value === "string" && value.length > max) {
				return message ?? `Must be ${max} characters or fewer.`;
			}
			return null;
		};
	},

	/**
	 * Validates that a non-empty string meets a minimum character length.
	 */
	minLength: (min: number, message?: string): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (typeof value === "string" && value.length > 0 && value.length < min) {
				return message ?? `Must be at least ${min} characters.`;
			}
			return null;
		};
	},

	/**
	 * Validates password constraints (min/max length).
	 */
	password: ({
		min = 8,
		max = 128,
		message,
	}: {
		min?: number;
		max?: number;
		message?: string;
	} = {}): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string") {
				return null;
			}
			if (value.length < min || value.length > max) {
				return message ?? `Must be between ${min} and ${max} characters long.`;
			}
			return null;
		};
	},

	/**
	 * Validates that a field matches the value of another field in the same form.
	 */
	matches: <F extends object = Record<string, unknown>>(
		targetKey: keyof F,
		message = "Values do not match.",
	): ValidatorFn<unknown, F> => {
		return (value, form) => {
			if (!value) {
				return null;
			}
			if (value !== form[targetKey]) {
				return message;
			}
			return null;
		};
	},

	/**
	 * Validates that a field is different from the value of another field in the same form.
	 */
	differentFrom: <F extends object = Record<string, unknown>>(
		targetKey: keyof F,
		message = "Value must be different.",
	): ValidatorFn<unknown, F> => {
		return (value, form) => {
			if (!value || !form[targetKey]) {
				return null;
			}
			if (value === form[targetKey]) {
				return message;
			}
			return null;
		};
	},

	/**
	 * Validates that a non-empty value is a valid HTTP or HTTPS URL.
	 */
	url: (
		message = "Please enter a valid URL (e.g. https://example.com).",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}

			try {
				const parsed = new URL(value.trim());
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
					return message;
				}
				return null;
			} catch {
				return message;
			}
		};
	},

	/**
	 * Validates that each non-empty line is a valid HTTP or HTTPS URL.
	 */
	urlList: (
		message = "Each line must be a valid HTTP or HTTPS URL.",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}

			const lines = value
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean);

			for (const line of lines) {
				try {
					const parsed = new URL(line);
					if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
						return message;
					}
				} catch {
					return message;
				}
			}

			return null;
		};
	},

	/**
	 * Validates that an array has at least a minimum number of items.
	 */
	minItems: (min = 1, message?: string): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!Array.isArray(value) || value.length < min) {
				return message ?? `Select at least ${min} item${min === 1 ? "" : "s"}.`;
			}
			return null;
		};
	},

	/**
	 * Validates that a non-empty value is a valid IANA time zone identifier.
	 */
	timeZone: (
		message = "Please enter a valid IANA time zone (e.g. America/New_York).",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}

			try {
				Intl.DateTimeFormat(undefined, { timeZone: value.trim() });
				return null;
			} catch {
				return message;
			}
		};
	},

	/**
	 * Validates that a non-empty value is a valid BCP 47 locale tag.
	 */
	locale: (
		message = "Please enter a valid locale tag (e.g. en-US).",
	): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}

			try {
				const loc = new Intl.Locale(value.trim());
				if (!loc.language) {
					return message;
				}
				return null;
			} catch {
				return message;
			}
		};
	},

	/**
	 * Validates that a non-empty value matches a regular expression.
	 */
	pattern: (regex: RegExp, message: string): ValidatorFn<unknown, unknown> => {
		return (value) => {
			if (!value || typeof value !== "string" || !value.trim()) {
				return null;
			}

			if (!regex.test(value.trim())) {
				return message;
			}

			return null;
		};
	},

	/**
	 * Runs a custom predicate function.
	 */
	custom: <T = unknown, F = unknown>(
		fn: (value: T, form: F) => boolean | string | null | undefined,
		message: string,
	): ValidatorFn<T, F> => {
		return (value, form) => {
			const result = fn(value, form);
			if (typeof result === "string") {
				return result;
			}
			if (result === false) {
				return message;
			}
			return null;
		};
	},
};

export type FieldValidators<T extends object> = {
	[K in keyof T]?:
		| ValidatorFn<unknown, T>
		| ValidatorFn<T[K], T>
		| (ValidatorFn<unknown, T> | ValidatorFn<T[K], T>)[];
};

export type ValidationErrors<T extends object> = {
	[K in keyof T]?: string;
};

/**
 * Validates a form object against a set of field validator rules.
 */
export function validateForm<T extends object>(
	form: T,
	rules: FieldValidators<T>,
): { errors: ValidationErrors<T>; isValid: boolean } {
	const errors: ValidationErrors<T> = {};
	let isValid = true;

	for (const key in rules) {
		const rule = rules[key];
		if (!rule) {
			continue;
		}

		const fns = Array.isArray(rule) ? rule : [rule];
		const value = (form as Record<string, unknown>)[key];

		for (const fn of fns) {
			const error = fn(value, form);
			if (error) {
				errors[key] = error;
				isValid = false;
				break;
			}
		}
	}

	return { errors, isValid };
}
