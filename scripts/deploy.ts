import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

const requiredEnv = [
	"ADMIN_BOOTSTRAP_SECRET",
	"OIDC_PRIVATE_KEY",
	"CLOUDFLARE_ACCOUNT_ID",
	"CLOUDFLARE_ZONE_ID",
	"API_URL",
	"DASHBOARD_DOMAIN",
	"OIDC_ISSUER",
];

const envFile = Bun.file(resolve(root, ".env"));

if (!(await envFile.exists())) {
	console.error("Missing .env file.");
	console.error("Run: cp .env.example .env");
	process.exit(1);
}

const env = await envFile.text();

for (const line of env.split("\n")) {
	const trimmed = line.trim();

	if (!trimmed || trimmed.startsWith("#")) {
		continue;
	}

	const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

	if (!match) {
		continue;
	}

	const [, key, rawValue] = match;

	let value = rawValue;

	if (
		(value.startsWith("'") && value.endsWith("'")) ||
		(value.startsWith('"') && value.endsWith('"'))
	) {
		value = value.slice(1, -1);
	}

	process.env[key] = value;
}

for (const key of requiredEnv) {
	if (!process.env[key]) {
		console.error(`Missing ${key} in .env`);
		process.exit(1);
	}
}

const terraformEnv: NodeJS.ProcessEnv = {
	...process.env,

	TF_VAR_cloudflare_account_id: process.env.CLOUDFLARE_ACCOUNT_ID,
	TF_VAR_cloudflare_zone_id: process.env.CLOUDFLARE_ZONE_ID,

	TF_VAR_api_url: process.env.API_URL,
	TF_VAR_dashboard_domain: process.env.DASHBOARD_DOMAIN,
	TF_VAR_oidc_issuer: process.env.OIDC_ISSUER,

	TF_VAR_admin_bootstrap_secret: process.env.ADMIN_BOOTSTRAP_SECRET,
	TF_VAR_oidc_private_key: process.env.OIDC_PRIVATE_KEY,
};

function run(args: string[]) {
	const result = spawnSync("terraform", args, {
		cwd: root,
		env: terraformEnv,
		stdio: "inherit",
	});

	if (result.error) {
		if ("code" in result.error && result.error.code === "ENOENT") {
			console.error("Terraform is not installed or is not available in PATH.");
			console.error(
				"Install Terraform: https://developer.hashicorp.com/terraform/install",
			);
		} else {
			console.error(result.error.message);
		}

		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log("Initializing Terraform...");
run(["-chdir=terraform", "init"]);

console.log("Applying infrastructure...");
run(["-chdir=terraform", "apply"]);
