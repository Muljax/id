import { readFile, writeFile } from "node:fs/promises";
import { generateCaKeyPairJwk } from "../apps/api/src/lib/ssh";

const TFVARS_FILE = "terraform/terraform.tfvars";

let tfvars = "";

try {
	tfvars = await readFile(TFVARS_FILE, "utf8");
} catch {
	// terraform.tfvars doesn't exist yet.
}

const existingMatch = tfvars.match(/^ssh_ca_private_key\s*=\s*(.*)$/m);
const existingVal = existingMatch?.[1]?.trim();
const hasValidKey =
	existingVal &&
	existingVal !== '""' &&
	existingVal !== '"replace-me"' &&
	existingVal !== "replace-me";

if (hasValidKey && !process.argv.includes("--force")) {
	console.log(
		"ℹ  SSH CA private key already exists in terraform.tfvars (use --force to regenerate)",
	);
	process.exit(0);
}

const { privateKeyJwk, publicOpenSsh, fingerprint } =
	await generateCaKeyPairJwk();

// JSON.stringify so the JWK is correctly escaped as an HCL string.
const line = `ssh_ca_private_key = ${JSON.stringify(privateKeyJwk)}`;

if (/^ssh_ca_private_key\s*=.*$/m.test(tfvars)) {
	tfvars = tfvars.replace(/^ssh_ca_private_key\s*=.*$/m, line);
} else {
	tfvars = `${tfvars.trimEnd()}\n${line}\n`;
}

await writeFile(TFVARS_FILE, tfvars);

console.log("✓ Generated SSH CA private key and updated terraform.tfvars");
console.log(`   CA Fingerprint: ${fingerprint}`);
console.log(`   CA Public Key:\n   ${publicOpenSsh.trim()}`);
