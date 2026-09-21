import fs from "node:fs";
import path from "node:path";
import { build as viteBuild } from "vite";

const startTime = performance.now();

await viteBuild({ logLevel: "silent" });

const workerResult = await Bun.build({
	entrypoints: ["./worker.ts"],
	outdir: "./dist",
	format: "esm",
	external: ["cloudflare:workers"],
});

if (!workerResult.success) {
	console.error("Worker build failed", workerResult.logs);
	process.exit(1);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const elapsed = Math.round(performance.now() - startTime);

const assetsDir = path.resolve("./dist/assets");
let assetCount = 0;
let totalAssetBytes = 0;

if (fs.existsSync(assetsDir)) {
	const files = fs.readdirSync(assetsDir);
	assetCount = files.length;
	for (const file of files) {
		totalAssetBytes += fs.statSync(path.join(assetsDir, file)).size;
	}
}

const htmlSize = fs.existsSync("./dist/index.html")
	? fs.statSync("./dist/index.html").size
	: 0;

const workerPath = path.resolve("./dist/worker.js");
const workerSize = fs.existsSync(workerPath) ? fs.statSync(workerPath).size : 0;

console.log(`\n✓ Built Docs in ${elapsed}ms:`);
console.log(
	`  * dist/assets/ (${assetCount} assets, ${formatBytes(totalAssetBytes)})`,
);
console.log(`  * dist/index.html (${formatBytes(htmlSize)})`);
console.log(`  * dist/worker.js (${formatBytes(workerSize)})\n`);
