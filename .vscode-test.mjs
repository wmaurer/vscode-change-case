import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
    files: "out/test/**/*.test.cjs",
    // A clean profile, so settings and other extensions on this machine cannot change the results.
    launchArgs: ["--disable-extensions"],
});
