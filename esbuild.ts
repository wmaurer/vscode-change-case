import * as esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
const tests = process.argv.includes("--tests");

// The package is `"type": "module"` for the lint tooling, but the extension host loads
// extensions with `require`, so every bundle is CommonJS with a `.cjs` extension.
const shared: esbuild.BuildOptions = {
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node20",
    external: ["vscode"],
    outExtension: { ".js": ".cjs" },
    logLevel: "info",
};

const options: esbuild.BuildOptions = tests
    ? { ...shared, entryPoints: ["src/test/*.test.ts"], outdir: "out/test", sourcemap: true }
    : {
          ...shared,
          entryPoints: ["src/extension.ts"],
          outdir: "dist",
          minify: production,
          sourcemap: !production,
          sourcesContent: false,
      };

// The `$esbuild-watch` problem matcher in .vscode/tasks.json reads these two lines to know when a
// rebuild starts and ends.
const watchMarkers: esbuild.Plugin = {
    name: "watch-markers",
    setup: (build) => {
        build.onStart(() => console.log("[watch] build started"));
        build.onEnd(() => console.log("[watch] build finished"));
    },
};

if (watch) {
    const context = await esbuild.context({ ...options, plugins: [watchMarkers] });
    await context.watch();
} else {
    await esbuild.build(options);
}
