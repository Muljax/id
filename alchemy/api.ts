import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";

import { Database } from "./database";
import { ProfileBucket } from "./storage";

const ApiUrl = Config.string("VITE_API_URL");
const DashboardDomain = Config.string("DASHBOARD_DOMAIN");

export const Api = Cloudflare.Worker("Api", {
	name: Config.string("INSTANCE_NAME").pipe(
		Config.map((name) => `${name}-api`),
	),

	main: "./apps/api/src/index.ts",

	domain: ApiUrl.pipe(Config.map((url) => new URL(url).hostname)),

	workersDev: false,

	compatibility: {
		date: "2026-07-11",
	},

	env: {
		DB: Database,
		PROFILE_BUCKET: ProfileBucket,

		AUTH_RATE_LIMITER: Cloudflare.RateLimit("AUTH_RATE_LIMITER", {
			namespaceId: 80085,
			simple: {
				limit: 10,
				period: 60,
			},
		}),

		LIFECYCLE_WORKFLOW: Cloudflare.Workflow("LifecycleWorkflow", {
			className: "LifecycleWorkflow",
		}),

		INSTANCE_NAME: Config.string("INSTANCE_NAME"),
		DASHBOARD_DOMAIN: DashboardDomain,

		RP_NAME: "Muljax ID",
		RP_ID: DashboardDomain,
		ORIGIN: ApiUrl,
		OIDC_ISSUER: Config.string("OIDC_ISSUER"),
		LOCALHOST: Config.boolean("LOCALHOST"),
		ADMIN_BOOTSTRAP_SECRET: Config.redacted("ADMIN_BOOTSTRAP_SECRET"),
		OIDC_PRIVATE_KEY: Config.redacted("OIDC_PRIVATE_KEY"),
	},
});

export type ApiEnv = Cloudflare.InferEnv<typeof Api>;
