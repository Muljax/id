import type { PluginBuilder } from "bun";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
