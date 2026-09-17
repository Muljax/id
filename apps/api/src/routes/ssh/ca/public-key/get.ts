import { Hono } from "hono";

import { createSshCaContext } from "@/lib/ssh";
import { type AppEnv, requirePermission } from "@/middleware/auth";

const route = new Hono<AppEnv>();

route.get("/", requirePermission("ssh:ca:read"), async (c) => {
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
		const format = c.req.query("format");

		if (format === "raw") {
			return c.text(caContext.publicOpenSsh, 200, {
				"content-type": "text/plain; charset=utf-8",
			});
		}

		return c.json({
			algorithm: "ssh-ed25519",
			publicKey: caContext.publicOpenSsh.trim(),
			fingerprint: caContext.fingerprint,
		});
	} catch (error) {
		console.error("Failed to load SSH CA public key:", error);
		return c.json({ error: "Failed to load CA public key." }, 500);
	}
});

export default route;
