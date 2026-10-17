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

if (watch) {
    const context = await esbuild.context(options);
    await context.watch();
} else {
    await esbuild.build(options);
}
