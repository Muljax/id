import { execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import {
	createSshCaContext,
	formatOpenSshEd25519PublicKey,
	generateCaKeyPairJwk,
	issueUserCertificate,
	parseOpenSshCertificate,
} from "../apps/api/src/lib/ssh";

async function main() {
	const caKeys = await generateCaKeyPairJwk();
	const ca = await createSshCaContext(caKeys.privateKeyJwk);

	console.log("=== SSH CA ===");
	console.log("Fingerprint:", ca.fingerprint);
	console.log("Public Key:", ca.publicOpenSsh.trim());

	const clientKeyPair = (await crypto.subtle.generateKey(
		{ name: "Ed25519" },
		true,
		["sign", "verify"],
	)) as CryptoKeyPair;
	const clientRawPub = new Uint8Array(
		(await crypto.subtle.exportKey(
			"raw",
			clientKeyPair.publicKey,
		)) as ArrayBuffer,
	);
	const clientOpenSsh = formatOpenSshEd25519PublicKey(
		clientRawPub,
		"developer@laptop",
	);

	console.log("\n=== Client Key ===");
	console.log("Public Key:", clientOpenSsh.trim());

	const issued = await issueUserCertificate(ca, {
		userPublicKey: clientOpenSsh,
		keyId: "hazel@id.hzel.org",
		principals: ["hazel", "ubuntu", "admin", "dev"],
		ttlSeconds: 8 * 3600,
	});

	console.log("\n=== Certificate Details ===");
	console.log("Serial:", issued.serial.toString());
	console.log("Key ID:", issued.keyId);
	console.log("Principals:", issued.principals.join(", "));
	console.log("Valid After:", new Date(issued.validAfter * 1000).toISOString());
	console.log(
		"Valid Before:",
		new Date(issued.validBefore * 1000).toISOString(),
	);
	console.log("Fingerprint:", issued.fingerprint);
	console.log("CA Fingerprint:", issued.caFingerprint);
	console.log("\n=== OpenSSH Certificate File ===");
	console.log(issued.certificate.trim());

	const parsed = parseOpenSshCertificate(issued.certificate);
	console.log("\n=== Parsed Certificate Wire ===");
	console.log("Cert Type:", parsed.certType);
	console.log("Role Type:", parsed.type);
	console.log("Extensions:", Object.keys(parsed.extensions).join(", "));
	console.log("Signature Algorithm:", parsed.caSignature.algorithm);

	console.log("\n=== Native ssh-keygen Verification ===");
	const tempPath = resolve(tmpdir(), `ssh-cert-${Date.now()}.pub`);
	try {
		writeFileSync(tempPath, issued.certificate);
		const inspectOutput = execSync(`ssh-keygen -L -f ${tempPath}`).toString();
		console.log(inspectOutput.trim());
	} catch (err: unknown) {
		console.log(
			"ssh-keygen inspection error:",
			err instanceof Error ? err.message : String(err),
		);
	} finally {
		try {
			unlinkSync(tempPath);
		} catch {}
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
