import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

const packageJson = JSON.parse(
	readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as {
	version: string;
};

export default defineConfig({
	envDir: "../../",
	envPrefix: ["VITE_", "INSTANCE_"],

	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],

	resolve: {
		tsconfigPaths: true,
	},

	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version),
	},
});
