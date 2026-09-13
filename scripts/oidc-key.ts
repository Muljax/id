import { readFile, writeFile } from "node:fs/promises";

const TFVARS_FILE = "terraform/terraform.tfvars";

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

// JSON.stringify again so the JWK is correctly escaped as an HCL string.
const line = `oidc_private_key = ${JSON.stringify(jwk)}`;

let tfvars = "";

try {
	tfvars = await readFile(TFVARS_FILE, "utf8");
} catch {
	// terraform.tfvars doesn't exist yet.
}

if (/^oidc_private_key\s*=.*$/m.test(tfvars)) {
	tfvars = tfvars.replace(/^oidc_private_key\s*=.*$/m, line);
} else {
	tfvars = `${tfvars.trimEnd()}\n${line}\n`;
}

await writeFile(TFVARS_FILE, tfvars);

console.log("Generated OIDC private key and updated terraform.tfvars");
