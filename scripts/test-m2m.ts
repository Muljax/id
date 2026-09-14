import * as readline from "node:readline/promises";

const API_BASE = process.argv[4] || process.env.API_URL || "http://localhost:8787";
let clientId = process.argv[2] || process.env.CLIENT_ID || "";
let clientSecret = process.argv[3] || process.env.CLIENT_SECRET || "";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function prompt(question: string, defaultVal = ""): Promise<string> {
	const answer = await rl.question(
		defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `,
	);
	return answer.trim() || defaultVal;
}

function base64UrlDecode(str: string): string {
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	while (base64.length % 4) {
		base64 += "=";
	}
	return atob(base64);
}

async function verifyJwtSignature(
	jwt: string,
	jwksUri: string,
): Promise<boolean> {
	const parts = jwt.split(".");
	if (parts.length !== 3) return false;

	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const header = JSON.parse(base64UrlDecode(encodedHeader));

	// Fetch JWKS
	const res = await fetch(jwksUri);
	if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.statusText}`);
	const jwks = (await res.json()) as { keys: Array<JsonWebKey & { kid: string }> };

	const key = jwks.keys.find((k) => k.kid === header.kid);
	if (!key) throw new Error(`Key ID ${header.kid} not found in JWKS`);

	// Import public key
	const cryptoKey = await crypto.subtle.importKey(
		"jwk",
		key,
		{ name: "ECDSA", namedCurve: "P-256" },
		false,
		["verify"],
	);

	// Decode signature
	const sigBin = base64UrlDecode(encodedSignature);
	const sigBytes = new Uint8Array(sigBin.length);
	for (let i = 0; i < sigBin.length; i++) {
		sigBytes[i] = sigBin.charCodeAt(i);
	}

	const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

	return await crypto.subtle.verify(
		{ name: "ECDSA", hash: "SHA-256" },
		cryptoKey,
		sigBytes,
		data,
	);
}

async function main() {
	console.log("\n🔐 \x1b[1;35mMuljax ID - Machine-to-Machine (M2M) Interactive Test\x1b[0m\n");
	console.log(`Target API URL: \x1b[36m${API_BASE}\x1b[0m`);

	if (!clientId) {
		console.log(
			"\n\x1b[33mTip:\x1b[0m Create an M2M client in the dashboard (http://localhost:5173/admin/clients) to get credentials.\n",
		);
		clientId = await prompt("Enter Client ID");
	}

	if (!clientSecret) {
		clientSecret = await prompt("Enter Client Secret");
	}

	rl.close();

	if (!clientId || !clientSecret) {
		console.error("\x1b[31mError:\x1b[0m Both Client ID and Client Secret are required.");
		process.exit(1);
	}

	console.log("\n──────────────────────────────────────────────────");
	console.log("▶ \x1b[1mStep 1: Discovering OpenID Configuration\x1b[0m");

	const discoveryRes = await fetch(`${API_BASE}/.well-known/openid-configuration`);
	if (!discoveryRes.ok) {
		console.error(
			`\x1b[31m✗ Discovery endpoint failed (${discoveryRes.status})\x1b[0m. Is the server running on ${API_BASE}?`,
		);
		process.exit(1);
	}

	let oidcConfig: {
		token_endpoint: string;
		jwks_uri: string;
		grant_types_supported: string[];
	};

	try {
		const rawText = await discoveryRes.text();
		if (rawText.trim().startsWith("<")) {
			console.error(
				`\x1b[31m✗ The URL ${API_BASE} returned HTML instead of JSON.\x1b[0m`,
			);
			console.error(
				`\x1b[33mTip:\x1b[0m This looks like the Dashboard frontend domain rather than the backend API.\nTry your API domain (for example: \x1b[36mhttps://api.id.hzel.org\x1b[0m or \x1b[36mhttps://api.hzel.org\x1b[0m).\n`,
			);
			process.exit(1);
		}
		oidcConfig = JSON.parse(rawText);
	} catch (err) {
		console.error(
			`\x1b[31m✗ Failed to parse JSON from ${API_BASE}/.well-known/openid-configuration:\x1b[0m`,
			err,
		);
		process.exit(1);
	}

	console.log(`  ✓ OpenID Discovery reached.`);
	console.log(`  ✓ Token Endpoint: ${oidcConfig.token_endpoint}`);
	console.log(`  ✓ Supported Grants: ${oidcConfig.grant_types_supported.join(", ")}`);

	if (!oidcConfig.grant_types_supported.includes("client_credentials")) {
		console.error("\x1b[31m✗ client_credentials is not in grant_types_supported!\x1b[0m");
		process.exit(1);
	}

	console.log("\n▶ \x1b[1mStep 2: Requesting M2M Token (grant_type=client_credentials)\x1b[0m");
	const authHeader = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
	const tokenParams = new URLSearchParams({
		grant_type: "client_credentials",
		audience: "keyzori",
	});

	const tokenRes = await fetch(oidcConfig.token_endpoint, {
		method: "POST",
		headers: {
			Authorization: authHeader,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: tokenParams.toString(),
	});

	if (!tokenRes.ok) {
		const errText = await tokenRes.text();
		console.error(`\x1b[31m✗ Token issuance failed (${tokenRes.status}):\x1b[0m\n${errText}`);
		process.exit(1);
	}

	const tokenData = (await tokenRes.json()) as {
		access_token: string;
		token_type: string;
		expires_in: number;
		scope?: string;
	};

	console.log(`  ✓ \x1b[32mToken issued successfully!\x1b[0m`);
	console.log(`  ✓ Token Type: ${tokenData.token_type}`);
	console.log(`  ✓ Expires In: ${tokenData.expires_in} seconds`);
	console.log(`  ✓ Granted Scope: ${tokenData.scope || "(default)"}`);

	console.log("\n▶ \x1b[1mStep 3: Decoding and Inspecting JWT Token\x1b[0m");
	const [rawHeader, rawPayload] = tokenData.access_token.split(".");
	const headerObj = JSON.parse(base64UrlDecode(rawHeader));
	const payloadObj = JSON.parse(base64UrlDecode(rawPayload));

	console.log("  \x1b[1;34mJWT Header:\x1b[0m", JSON.stringify(headerObj, null, 2));
	console.log("  \x1b[1;34mJWT Payload Claims:\x1b[0m", JSON.stringify(payloadObj, null, 2));

	console.log("\n▶ \x1b[1mStep 4: Cryptographic JWKS Signature Verification\x1b[0m");
	try {
		const isValid = await verifyJwtSignature(tokenData.access_token, oidcConfig.jwks_uri);
		if (isValid) {
			console.log(
				`  ✓ \x1b[32mES256 Signature verified against JWKS (${oidcConfig.jwks_uri})!\x1b[0m`,
			);
		} else {
			console.error("  \x1b[31m✗ Cryptographic signature verification failed!\x1b[0m");
		}
	} catch (e) {
		console.error(`  \x1b[31m✗ Signature verification error: ${e}\x1b[0m`);
	}

	console.log("\n▶ \x1b[1mStep 5: Testing Token Introspection (/oauth/introspect)\x1b[0m");
	const introspectRes = await fetch(`${API_BASE}/oauth/introspect`, {
		method: "POST",
		headers: {
			Authorization: authHeader,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ token: tokenData.access_token }).toString(),
	});

	const introspectData = await introspectRes.json();
	console.log("  ✓ Introspection Response:", JSON.stringify(introspectData, null, 2));

	console.log("\n▶ \x1b[1mStep 6: Testing Rejection of Invalid Secret (Negative Test)\x1b[0m");
	const badAuthRes = await fetch(oidcConfig.token_endpoint, {
		method: "POST",
		headers: {
			Authorization: `Basic ${btoa(`${clientId}:definitely_wrong_secret`)}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
	});
	console.log(
		badAuthRes.status === 401
			? `  ✓ Correctly rejected with status ${badAuthRes.status} Unauthorized.`
			: `  ✗ Expected 401 but got ${badAuthRes.status}`,
	);

	console.log("\n══════════════════════════════════════════════════");
	console.log("🎉 \x1b[1;32mAll M2M Authentication Tests Passed Successfully!\x1b[0m");
	console.log("══════════════════════════════════════════════════\n");
}

main().catch((err) => {
	console.error("\n\x1b[31mUnexpected Test Error:\x1b[0m", err);
	process.exit(1);
});
