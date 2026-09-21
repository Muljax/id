import { app } from "../../api/src/app.js";

export function getSpec(options?: {
	instanceName?: string;
	serverUrl?: string;
}) {
	const instanceName =
		options?.instanceName ||
		process.env.VITE_INSTANCE_NAME ||
		process.env.INSTANCE_NAME ||
		"Muljax ID";
	const cleanName = instanceName.replace(/^["']|["']$/g, "").trim();

	const apiDomain = (
		process.env.VITE_API_DOMAIN ||
		process.env.API_DOMAIN ||
		""
	)
		.replace(/^https?:\/\//, "")
		.replace(/\/+$/, "");

	const isLocal = process.env.LOCALHOST === "true";
	const protocol = isLocal ? "http" : "https";
	const serverUrl =
		options?.serverUrl ||
		(apiDomain ? `${protocol}://${apiDomain}` : "http://localhost:8787");

	return app.getOpenAPIDocument({
		openapi: "3.1.0" as const,
		info: {
			title: `${cleanName} API`,
			version: "1.0.0",
			description: `REST API specification and interactive endpoint documentation for ${cleanName}.`,
		},
		servers: [
			{
				url: serverUrl,
				description: apiDomain ? "Configured API Server" : "Local API Server",
			},
		],
	});
}

if (import.meta.main) {
	process.stdout.write(JSON.stringify(getSpec()));
}
