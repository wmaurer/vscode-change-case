import { fileURLToPath } from "node:url";

import { defineConfig } from "oxlint";

export default defineConfig({
    // `plugins` replaces oxlint's defaults rather than extending them, so `unicorn` and `oxc` are
    // named here to keep their correctness rules.
    plugins: ["typescript", "import", "unicorn", "oxc"],

    // Vendored, see tools/oxlint/anti-slop/PROVENANCE.md. Node >= 22.18 strips types natively, so
    // the .ts entry points load without a build step.
    jsPlugins: [
        {
            name: "anti-slop",
            specifier: fileURLToPath(new URL("./tools/oxlint/anti-slop/index.ts", import.meta.url)),
        },
        {
            name: "prose",
            specifier: fileURLToPath(new URL("./tools/oxlint/prose/index.ts", import.meta.url)),
        },
    ],

    env: {
        node: true,
        es2024: true,
    },

    // Type-aware rules through oxlint-tsgolint, such as `typescript/no-floating-promises`.
    options: {
        typeAware: true,
    },

    rules: {
        "no-unused-vars": "off",
        "typescript/no-unused-vars": "warn",

        "anti-slop/no-chained-type-assertions": "error",
        "anti-slop/no-conditional-empty-object-spread": "error",
        "anti-slop/no-known-value-widening": "error",
        "anti-slop/no-module-mocking": "error",
        "anti-slop/no-object-parameters": "error",
        "anti-slop/no-reflect-apply": "error",
        "anti-slop/no-reflect-get": "error",
        "anti-slop/no-runtime-typeof": "error",
        "anti-slop/no-shape-in-symbol-names": "error",
        "anti-slop/no-unknown-parameters": "error",
        "anti-slop/no-unknown-returns": "error",
        "anti-slop/no-unknown-type-aliases": "error",
        "anti-slop/no-unsafe-dictionary-type": "error",
        "anti-slop/no-widen-then-assert": "error",
        "anti-slop/require-safety-comment-for-type-assertion": "error",

        // The messages point at the two sections of the same name in CLAUDE.md.
        "prose/comment-sentence-structure": "error",
        "prose/no-history-in-public-docs": "error",
        "prose/plain-english-comments": "error",
    },

    ignorePatterns: ["dist", "out", ".vscode-test", "scripts/repos.js", "tools/oxlint", ".repos"],
});
