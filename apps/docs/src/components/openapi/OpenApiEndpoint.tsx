import { AlertCircle, Loader2 } from "lucide-react";
import {
	dereferenceSchema,
	formatSchemaType,
	generateSampleJson,
} from "../../lib/openapi/resolver";
import type {
	OpenApiOperation,
	OpenApiParameter,
} from "../../lib/openapi/types";
import { useOpenApi } from "../../lib/openapi/useOpenApi";
import {
	EndpointCard,
	type ParameterItem,
	type RequestBodyItem,
	type ResponseItem,
} from "./EndpointCard";

export interface OpenApiEndpointProps {
	path: string;
	method: "get" | "post" | "put" | "delete" | "patch" | string;
	auth?: string;
	summary?: string;
	description?: string;
}

export function OpenApiEndpoint({
	path,
	method,
	auth,
	summary,
	description,
}: OpenApiEndpointProps) {
	const { spec, loading, error } = useOpenApi();
	const normalizedMethod = method.toLowerCase();

	if (loading) {
		return (
			<div className="my-6 flex items-center gap-3 p-5 rounded-2xl border border-white/8 bg-zinc-900/40 text-xs text-zinc-400">
				<Loader2 size={16} className="animate-spin text-violet-400" />
				<span>Loading endpoint definition...</span>
			</div>
		);
	}

	if (error || !spec) {
		return (
			<div className="my-6 flex items-center gap-2 p-4 rounded-2xl border border-red-500/25 bg-red-500/10 text-xs text-red-300">
				<AlertCircle size={15} className="text-red-400 shrink-0" />
				<span>{error || "Failed to load OpenAPI specification"}</span>
			</div>
		);
	}

	// Lookup path in spec (check exact match, :param -> {param}, or trailing slash variations)
	const normalizedPath = path.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
	const pathItem =
		spec.paths[path] ||
		spec.paths[normalizedPath] ||
		spec.paths[path.replace(/\/$/, "")] ||
		spec.paths[normalizedPath.replace(/\/$/, "")] ||
		spec.paths[`${path}/`] ||
		spec.paths[`${normalizedPath}/`];

	const operation: OpenApiOperation | undefined = pathItem?.[normalizedMethod];

	if (!operation) {
		return (
			<div className="my-6 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-300">
				<span className="font-semibold">
					{method.toUpperCase()} {path}
				</span>{" "}
				was not found in the OpenAPI spec.
			</div>
		);
	}

	// 1. Resolve Parameters
	const parameters: ParameterItem[] = (operation.parameters || []).map(
		(p: OpenApiParameter) => {
			const deref = dereferenceSchema(p.schema, spec);
			return {
				name: p.name,
				in: p.in,
				type: formatSchemaType(deref || p.schema),
				required: p.required,
				description: p.description,
				example:
					p.example !== undefined
						? p.example
						: generateSampleJson(deref || undefined, spec),
			};
		},
	);

	// 2. Resolve Request Body
	let requestBody: RequestBodyItem | undefined;
	if (operation.requestBody?.content) {
		const contentType =
			Object.keys(operation.requestBody.content)[0] || "application/json";
		const media = operation.requestBody.content[contentType];
		const deref = dereferenceSchema(media?.schema, spec);
		const sample =
			media?.example !== undefined
				? media.example
				: generateSampleJson(deref || undefined, spec);

		requestBody = {
			contentType,
			description: operation.requestBody.description,
			required: operation.requestBody.required,
			example: sample,
			schema: deref,
		};
	}

	// 3. Resolve Responses
	const responses: ResponseItem[] = Object.entries(
		operation.responses || {},
	).map(([status, res]) => {
		const contentType = res.content ? Object.keys(res.content)[0] : undefined;
		const media =
			contentType && res.content ? res.content[contentType] : undefined;
		const deref = dereferenceSchema(media?.schema, spec);
		const sample =
			media?.example !== undefined
				? media.example
				: generateSampleJson(deref || undefined, spec);

		return {
			status,
			description: res.description,
			contentType,
			example: sample,
			schema: deref,
		};
	});

	// Infer auth from security if not explicitly provided
	const inferredAuth =
		auth ||
		(operation.security && operation.security.length > 0
			? Object.keys(operation.security[0] || {})[0] || "bearer"
			: "public");

	return (
		<EndpointCard
			method={normalizedMethod.toUpperCase()}
			path={path}
			summary={summary || operation.summary}
			description={description || operation.description}
			auth={inferredAuth}
			parameters={parameters}
			requestBody={requestBody}
			responses={responses}
		/>
	);
}
