import { RebacEngine } from "../src/engine";
import { define, is, schema } from "../src/schema";
import { MemoryTupleStore } from "../src/store";
import {
	createDocumentSchema,
	createTestDrizzleStore,
	generateCyclicKnotTuples,
	generateDeepChainTuples,
	generateFanOutTuples,
} from "../test/helpers/fixtures";

interface BenchResult {
	name: string;
	iterations: number;
	elapsedMs: number;
	opsPerSec: number;
	avgLatencyUs: number;
	heapDeltaMb: number;
}

function formatNumber(num: number): string {
	return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

async function runBenchmark(
	name: string,
	iterations: number,
	fn: () => Promise<void>,
): Promise<BenchResult> {
	// Warmup
	for (let i = 0; i < Math.min(iterations, 100); i++) {
		await fn();
	}

	if (globalThis.gc) {
		globalThis.gc();
	}

	const heapBefore = process.memoryUsage().heapUsed;
	const start = performance.now();

	for (let i = 0; i < iterations; i++) {
		await fn();
	}

	const elapsedMs = performance.now() - start;
	const heapAfter = process.memoryUsage().heapUsed;

	const opsPerSec = Math.round(iterations / (elapsedMs / 1000));
	const avgLatencyUs = (elapsedMs / iterations) * 1000;
	const heapDeltaMb = Math.max(0, (heapAfter - heapBefore) / (1024 * 1024));

	return {
		name,
		iterations,
		elapsedMs,
		opsPerSec,
		avgLatencyUs,
		heapDeltaMb,
	};
}

async function main() {
	console.log(
		"\n==========================================================================",
	);
	console.log("⚡ @id/rebac High-Performance Authorization Engine Benchmarks");
	console.log(
		"==========================================================================\n",
	);

	const results: BenchResult[] = [];

	// 1. Direct O(1) Role Hit
	{
		const docSchema = createDocumentSchema();
		const store = new MemoryTupleStore([
			{ object: "document:spec", relation: "owner", subject: "user:alice" },
		]);
		const engine = new RebacEngine({ schema: docSchema, store });

		results.push(
			await runBenchmark("Direct Role Hit (O(1))", 50_000, async () => {
				await engine.check({
					object: "document:spec",
					can: "edit",
					subject: "user:alice",
				});
			}),
		);
	}

	// 2. 30-Hop Deep Inheritance Traversal
	{
		const Node = define("node", (self) => ({
			relations: { parent: self as any },
			roles: ["admin"],
			can: { view: is("admin").or(self.parent("view")) },
		}));
		const chainSchema = schema({ Node });
		const store = new MemoryTupleStore(
			generateDeepChainTuples(30, "user:root-alice"),
		);
		const engine = new RebacEngine({
			schema: chainSchema,
			store,
			maxDepth: 50,
		});

		results.push(
			await runBenchmark(
				"30-Hop Linear Hierarchy Traversal",
				2_000,
				async () => {
					await engine.check({
						object: "node:30",
						can: "view",
						subject: "user:root-alice",
					});
				},
			),
		);
	}

	// 3. High Fan-Out (1,000 Nodes) Graph Traversal
	{
		const Group = define("group", { roles: ["member"] });
		const Document = define("document", (self) => ({
			relations: { sharedWith: Group },
			roles: ["owner"],
			can: { view: is("owner").or(self.sharedWith(Group.member)) },
		}));
		const fanOutSchema = schema({ Group, Document });
		const store = new MemoryTupleStore(
			generateFanOutTuples(100, 10, "user:needle"),
		);
		const engine = new RebacEngine({ schema: fanOutSchema, store });

		results.push(
			await runBenchmark(
				"High Fan-Out (1,000 Groups/Teams)",
				10_000,
				async () => {
					await engine.check({
						object: "document:mega-spec",
						can: "view",
						subject: "user:needle",
					});
				},
			),
		);
	}

	// 4. Dense Cyclic Knot (20 Circular Groups)
	{
		const Group = define("group", (self) => ({
			relations: { linkedGroup: self as any },
			roles: ["direct_member"],
			can: { member: is("direct_member").or(self.linkedGroup("member")) },
		}));
		const cyclicSchema = schema({ Group });
		const store = new MemoryTupleStore(generateCyclicKnotTuples(10));
		const engine = new RebacEngine({ schema: cyclicSchema, store });

		results.push(
			await runBenchmark(
				"Dense Cyclic Multi-Ring Knot (Pruning)",
				5_000,
				async () => {
					await engine.check({
						object: "group:0",
						can: "member",
						subject: "user:unauthorized-stranger",
					});
				},
			),
		);
	}

	// 5. High-Throughput Concurrent Batch (10,000 checks)
	{
		const Org = define("org", { roles: ["admin", "member"] });
		const Repo = define("repo", (self) => ({
			relations: { org: Org },
			roles: ["maintainer", "collaborator", "blocked"],
			can: {
				write: is("maintainer").or(self.org(Org.admin)),
				read: is("collaborator")
					.or("write")
					.or(self.org(Org.member))
					.unless("blocked"),
			},
		}));
		const batchSchema = schema({ Org, Repo });
		const store = new MemoryTupleStore([
			{ object: "org:acme", relation: "admin", subject: "user:alice" },
			{ object: "org:acme", relation: "member", subject: "user:bob" },
			{ object: "repo:engine", relation: "org", subject: "org:acme" },
			{
				object: "repo:engine",
				relation: "collaborator",
				subject: "user:charlie",
			},
			{ object: "repo:engine", relation: "blocked", subject: "user:mallory" },
		]);
		const engine = new RebacEngine({ schema: batchSchema, store });

		results.push(
			await runBenchmark("Concurrent Batch Mixed Checks", 20_000, async () => {
				await engine.check({
					object: "repo:engine",
					can: "read",
					subject: "user:bob",
				});
			}),
		);
	}

	// 6. Drizzle ORM SQLite In-Memory Database Store
	{
		const { store } = createTestDrizzleStore("rebac_bench_tuples");
		const Team = define("team", { roles: ["admin", "member"] });
		const Project = define("project", (self) => ({
			relations: { owningTeam: Team },
			roles: ["maintainer"],
			can: { manage: is("maintainer").or(self.owningTeam(Team.admin)) },
		}));
		const drizzleSchema = schema({ Team, Project });
		const engine = new RebacEngine({ schema: drizzleSchema, store });

		await store.writeTuples([
			{ object: "team:security", relation: "admin", subject: "user:alice" },
			{
				object: "project:core-auth",
				relation: "owningTeam",
				subject: "team:security",
			},
		]);

		results.push(
			await runBenchmark(
				"Drizzle SQLite In-Memory Storage Check",
				5_000,
				async () => {
					await engine.check({
						object: "project:core-auth",
						can: "manage",
						subject: "user:alice",
					});
				},
			),
		);
	}

	// Print Summary Table
	console.log(
		"| Scenario | Iterations | Latency (avg) | Throughput (ops/sec) | Heap Delta |",
	);
	console.log("| :--- | :--- | :--- | :--- | :--- |");
	for (const r of results) {
		console.log(
			`| **${r.name}** | ${formatNumber(r.iterations)} | ${r.avgLatencyUs.toFixed(1)} µs | **${formatNumber(r.opsPerSec)} ops/s** | +${r.heapDeltaMb.toFixed(2)} MB |`,
		);
	}
	console.log(
		"\n==========================================================================\n",
	);
}

main().catch(console.error);
