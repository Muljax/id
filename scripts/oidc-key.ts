import { readFile, writeFile } from "node:fs/promises";

const ENV_FILE = ".env";

const keyPair = await crypto.subtle.generateKey(
	{
		name: "ECDSA",
		namedCurve: "P-256",
	},
	true,
	["sign", "verify"],
);

const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

const jwk = JSON.stringify({
	kty: privateKey.kty,
	crv: privateKey.crv,
	x: privateKey.x,
	y: privateKey.y,
	d: privateKey.d,
});

let env = "";

try {
	env = await readFile(ENV_FILE, "utf8");
} catch {
	// .env doesn't exist yet.
}

const line = `OIDC_PRIVATE_KEY='${jwk}'`;

if (/^OIDC_PRIVATE_KEY=.*$/m.test(env)) {
	env = env.replace(/^OIDC_PRIVATE_KEY=.*$/m, line);
} else {
	env = `${env.trimEnd()}\n${line}\n`;
}

await writeFile(ENV_FILE, env);

console.log("Generated OIDC private key and updated .env");
