# Vendored: dmmulroy/anti-slop

Source: https://github.com/dmmulroy/anti-slop
Commit: 6d53855 ("feat: add opt-in Effect lint rules", 2026-08-18)
Copied from: `src/`, minus upstream's own tests

The upstream package is `private: true` and exports raw `./src/index.ts`, so it
cannot be installed from a registry. Copying `src/` is upstream's own documented
install path.

**Do not edit these files, and do not edit the mirrored copy under
`assets/tools/oxlint/anti-slop/` either** — `build.mjs` overwrites it from this
directory on every build.

To update: `pnpm --dir tools/scripts refs:fetch`, diff
`tools/scripts/.repos/refs/anti-slop/src` against this directory, copy the new
tree in, update the commit recorded above, and rebuild. The upstream is tracked
as a `refs` entry rather than a `deps` one because `deps` entries require an npm
probe, and this package is unpublished.

In a scaffolded project the same rules live at `tools/oxlint/anti-slop/` with no
mirror, and `repos.config.js` ships empty — add the entry to update them:

```js
refs: [{ name: "anti-slop", url: "https://github.com/dmmulroy/anti-slop.git", ref: "main" }];
```

This project omits upstream's `src/effect/` directory, the opt-in Effect rules. It does not use Effect.
