import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

const force = process.argv.includes("--force");

if (hasValidKey && !force) {
	console.log(
		"ℹ  SSH CA private key already exists in terraform.tfvars (use --force to regenerate)",
	);
	process.exit(0);
}

if (hasValidKey && force) {
	const rl = createInterface({ input, output });

	console.log();
	console.log("=".repeat(72));
	console.log("                         ⚠  WARNING  ⚠");
	console.log("=".repeat(72));
	console.log();
	console.log("You are about to REPLACE the SSH CA private key.");
	console.log();
	console.log("This is a destructive operation. Any SSH certificates issued");
	console.log("by the current CA may no longer be usable after the key is");
	console.log("replaced.");
	console.log();
	console.log("MOST IMPORTANTLY:");
	console.log();
	console.log("If machines are configured to trust ONLY this SSH CA, changing");
	console.log("the CA key can leave you UNABLE TO SSH INTO THOSE MACHINES.");
	console.log();
	console.log("If you lose SSH access to a machine and have no other access");
	console.log("(console, recovery environment, another administrator, etc.),");
	console.log("you may be locked out of that machine.");
	console.log();
	console.log("=".repeat(72));
	console.log();

	const first = await rl.question(
		'Type "I UNDERSTAND" to acknowledge that changing this key can break SSH access: ',
	);

	if (first !== "I UNDERSTAND") {
		console.log("\nAborted. The existing SSH CA key was not changed.");
		rl.close();
		process.exit(1);
	}

	console.log();
	console.log("Second confirmation:");
	console.log(
		"Changing the CA key can break machines that rely on this CA for SSH authentication.",
	);
	console.log(
		"Make absolutely sure you have another way to access every affected machine.",
	);
	console.log();

	const second = await rl.question(
		'Type "I HAVE ANOTHER WAY IN" to continue: ',
	);

	if (second !== "I HAVE ANOTHER WAY IN") {
		console.log("\nAborted. The existing SSH CA key was not changed.");
		rl.close();
		process.exit(1);
	}

	console.log();
	console.log("FINAL WARNING:");
	console.log();
	console.log("This will permanently replace the SSH CA private key stored in");
	console.log(TFVARS_FILE);
	console.log();
	console.log("Once Terraform is applied with the new key, machines that only");
	console.log("trust the old CA may reject certificates issued by the new CA.");
	console.log();
	console.log("If you are not intentionally rotating the CA, STOP NOW.");
	console.log();

	const third = await rl.question(
		'Type "ROTATE SSH CA KEY" to permanently confirm: ',
	);

	if (third !== "ROTATE SSH CA KEY") {
		console.log("\nAborted. The existing SSH CA key was not changed.");
		rl.close();
		process.exit(1);
	}

	rl.close();

	console.log();
	console.log("✓ All confirmations received. Generating a new SSH CA key...");
	console.log();
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
