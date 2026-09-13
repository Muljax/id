const result = await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	format: "esm",
	external: ["cloudflare:workers"],
});

if (!result.success) {
	console.error("API build failed");
	process.exit(1);
}

const output = result.outputs[0];

if (!output) {
	console.error("API build produced no output");
	process.exit(1);
}
