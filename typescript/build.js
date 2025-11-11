const esbuild = require("esbuild");
const path = require("path");

const isWatch = process.argv.includes("--watch");

const buildOptions = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: "dist/index.js",
	platform: "node",
	target: ["node22"],
	format: "cjs",
	// external: ["pg", "pg-native"],
	sourcemap: false,
	minify: false,
	keepNames: true,
	logLevel: "info",
	tsconfig: "tsconfig.json",
};

async function build() {
	try {
		if (isWatch) {
			console.log("👀 Watching for changes...");
			const ctx = await esbuild.context(buildOptions);
			await ctx.watch();
			console.log("✅ Watch mode enabled");
		} else {
			console.log("🔨 Building...");
			await esbuild.build(buildOptions);
			console.log("✅ Build complete!");
		}
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

build();
