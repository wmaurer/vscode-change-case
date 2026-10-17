# Repository guide

A VS Code extension. It was bootstrapped with `yo code` (generator-code), and its lint and format
setup comes from the `project-setup` scaffold, without the Effect parts.

- `src/cases.ts` is the table of commands. `src/plan.ts` is pure: it finds the text to convert and
  works out the edits and the new selections as document offsets. `src/extension.ts` connects the
  two to the VS Code API.
- esbuild bundles `src/extension.ts` to `dist/extension.cjs`, and each `src/test/*.test.ts` to
  `out/test/`. The package is `"type": "module"` for the tooling, so bundles use the `.cjs` extension.
- `tsc` only type-checks. The root `tsconfig.json` is a solution file over `src/` and
  `tsconfig.tools.json`.
- `src/test/change-case-3.1.0.json` is the output of version 1.0.0 of this extension. Do not
  regenerate it from the current code.
- Before you finish a change, run `pnpm fmt:check`, `pnpm lint`, `pnpm typecheck` and `pnpm test`.

## Documentation Language (B2 English)

Write comments and docs in plain B2 English. One idea per sentence; keep sentences under
40 words. No figures of speech, and do not give a thing a mind — describe what the code
does. Prefer the common word to the rare one. Code identifiers stay verbatim: inside
backticks they name a symbol, not prose.

## Documentation Describes the Current State

TSDoc on anything exported says how the code works **now**. Delete the history: no "no
longer", "previously", "used to be", "renamed from". Rationale about the current design
belongs in an internal comment below the docstring, not in the consumer-visible one.
