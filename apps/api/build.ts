import type { PluginBuilder } from "bun";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const startTime = performance.now();

const wasmPlugin = {
	name: "wasm-external",
	setup(build: PluginBuilder) {
		build.onResolve({ filter: /\.wasm$/ }, (args) => {
			return { path: `./${path.basename(args.path)}`, external: true };
		});
	},
};

const result = await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	format: "esm",
	external: ["cloudflare:workers"],
	plugins: [wasmPlugin],
});

if (!result.success) {
	console.error("API build failed", result.logs);
	process.exit(1);
}

const tscProcess = Bun.spawnSync([
	"bunx",
	"tsc",
	"--declaration",
	"--emitDeclarationOnly",
	"--noEmit",
	"false",
	"--outDir",
	"dist",
]);

if (tscProcess.exitCode !== 0) {
	console.error(
		"API declaration generation failed",
		tscProcess.stderr.toString(),
	);
	process.exit(1);
}

const output = result.outputs[0];

if (!output) {
	console.error("API build produced no output");
	process.exit(1);
}

const argon2Path = fileURLToPath(
	import.meta.resolve("argon2-wasm-edge/wasm/argon2.wasm"),
);
const blake2bPath = fileURLToPath(
	import.meta.resolve("argon2-wasm-edge/wasm/blake2b.wasm"),
);

fs.copyFileSync(argon2Path, "./dist/argon2.wasm");
fs.copyFileSync(blake2bPath, "./dist/blake2b.wasm");

import { stringify } from "yaml";

const { app } = await import("./src/app");
const packageJson = (
	await import("./package.json", {
		with: { type: "json" },
	})
).default;

const openapiDoc = app.getOpenAPIDocument({
	openapi: "3.1.0",
	info: {
		title: "Muljax ID API",
		version: packageJson.version,
		description:
			"Self-hosted identity management, OAuth 2.0, Passkeys, RBAC, and SSH Certificate Authority service.",
	},
});
fs.writeFileSync("./dist/openapi.json", JSON.stringify(openapiDoc, null, 2));
fs.writeFileSync("./dist/openapi.yaml", stringify(openapiDoc));

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const elapsed = Math.round(performance.now() - startTime);
const outputStat = fs.statSync(output.path);
const argon2Stat = fs.statSync("./dist/argon2.wasm");
const blake2bStat = fs.statSync("./dist/blake2b.wasm");

console.log(`\n✓ Built API Worker in ${elapsed}ms:`);
console.log(
	`  * ${path.relative(process.cwd(), output.path)} (${formatBytes(outputStat.size)})`,
);
console.log(`  * dist/argon2.wasm (${formatBytes(argon2Stat.size)})`);
console.log(`  * dist/blake2b.wasm (${formatBytes(blake2bStat.size)})\n`);
