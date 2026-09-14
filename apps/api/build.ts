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
