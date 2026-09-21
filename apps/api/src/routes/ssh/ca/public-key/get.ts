import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

import { createSshCaContext } from "@/lib/ssh";
import { type AppEnv, requirePermission } from "@/middleware/auth";
import { ErrorResponseSchema } from "@/schemas/common";
import { CaPublicKeyResponseSchema } from "@/schemas/ssh";

const CaPublicKeyQuerySchema = z.object({
	format: z
		.enum(["json", "raw", "text"])
		.optional()
		.openapi({
			param: { name: "format", in: "query" },
			description:
				"Response format ('raw' or 'text' for plain OpenSSH key, 'json' for JSON object)",
		}),
});

export const getCaPublicKeyRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["SSH Keys & CA"],
	summary: "Get SSH Certificate Authority public key",
	description:
		"Retrieve CA public key in OpenSSH format for configuring TrustedUserCAKeys on Linux servers.",
	request: {
		query: CaPublicKeyQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: CaPublicKeyResponseSchema,
				},
				"text/plain": {
					schema: z.string().openapi({
						example: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... Muljax-ID-CA",
					}),
				},
			},
			description: "CA public key",
		},
		401: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Unauthorized",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "CA not configured",
		},
	},
});

const route = new OpenAPIHono<AppEnv>();

route.use("/*", requirePermission("ssh:ca:read"));

route.openapi(getCaPublicKeyRoute, async (c) => {
	const caPrivateKeyJwk = c.env.SSH_CA_PRIVATE_KEY;
	if (!caPrivateKeyJwk) {
		return c.json(
			{
				error: "SSH CA is not configured on this instance.",
			},
			500,
		);
	}

	try {
		const caContext = await createSshCaContext(caPrivateKeyJwk);
		const { format } = c.req.valid("query");
		const accept = c.req.header("accept");

		const isText =
			format === "raw" ||
			format === "text" ||
			(format === undefined &&
				accept?.includes("text/plain") &&
				!accept?.includes("application/json"));

		if (isText) {
			return c.text(caContext.publicOpenSsh, 200, {
				"content-type": "text/plain; charset=utf-8",
			});
		}

		return c.json(
			{
				algorithm: "ssh-ed25519",
				publicKey: caContext.publicOpenSsh.trim(),
				fingerprint: caContext.fingerprint,
			},
			200,
		);
	} catch (error) {
		console.error("Failed to load SSH CA public key:", error);
		return c.json({ error: "Failed to load CA public key." }, 500);
	}
});

export default route;
