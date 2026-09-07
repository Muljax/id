import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

import { Api } from "./alchemy/api.ts";
import { Dashboard } from "./alchemy/dashboard.ts";
import { Database } from "./alchemy/database.ts";
import { ProfileBucket } from "./alchemy/storage.ts";

export default Alchemy.Stack(
	"MuljaxId",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const database = yield* Database;
		const profileBucket = yield* ProfileBucket;
		const api = yield* Api;
		const dashboard = yield* Dashboard;

		return {
			database,
			profileBucket,
			api,
			dashboard,
		};
	}),
);
