export interface OpenApiParameter {
	name: string;
	in: "query" | "header" | "path" | "cookie";
	description?: string;
	required?: boolean;
	deprecated?: boolean;
	schema?: OpenApiSchema;
	example?: unknown;
}

export interface OpenApiMediaType {
	schema?: OpenApiSchema;
	example?: unknown;
	examples?: Record<string, { value: unknown; summary?: string }>;
}

export interface OpenApiRequestBody {
	description?: string;
	required?: boolean;
	content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
	description: string;
	headers?: Record<string, OpenApiParameter>;
	content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
	tags?: string[];
	summary?: string;
	description?: string;
	operationId?: string;
	parameters?: OpenApiParameter[];
	requestBody?: OpenApiRequestBody;
	responses?: Record<string, OpenApiResponse>;
	deprecated?: boolean;
	security?: Array<Record<string, string[]>>;
}

export interface OpenApiSchema {
	type?: string | string[];
	format?: string;
	description?: string;
	nullable?: boolean;
	properties?: Record<string, OpenApiSchema>;
	items?: OpenApiSchema;
	required?: string[];
	enum?: unknown[];
	example?: unknown;
	examples?: unknown[];
	default?: unknown;
	$ref?: string;
	allOf?: OpenApiSchema[];
	anyOf?: OpenApiSchema[];
	oneOf?: OpenApiSchema[];
}

export interface OpenApiSpec {
	openapi: string;
	info: {
		title: string;
		version: string;
		description?: string;
	};
	servers?: Array<{ url: string; description?: string }>;
	paths: Record<string, Record<string, OpenApiOperation>>;
	components?: {
		schemas?: Record<string, OpenApiSchema>;
		responses?: Record<string, OpenApiResponse>;
		parameters?: Record<string, OpenApiParameter>;
		securitySchemes?: Record<string, unknown>;
	};
}
