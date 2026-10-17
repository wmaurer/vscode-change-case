// Part of the `repos` feature. Configuration for scripts/repos.js, read from the repo root. Both arrays
// ship empty; the commands
// no-op until you add entries.
//
//   pnpm refs:fetch     references  -> .repos/refs/<name>, refreshed to tip
//   pnpm deps:fetch     dependencies -> .repos/deps/<name>, pinned
//   pnpm deps:check     offline: fail if any dep source drifted

export default {
    // REFERENCE repos: read for patterns and prior art, NOT built against, so
    // tracking the branch tip is what we want — newer is strictly better and
    // "stale" means nothing.
    //
    // Anything you DO build against belongs in `deps` below, where it is pinned
    // to the version you actually have installed. The test is: would reading a
    // newer API here mislead you? If yes, it is a dependency, not a reference.
    //
    //   { name, url, ref? }
    //     ref is optional and may be a branch name, tag, or commit SHA.
    //     When omitted, the remote's default branch is fetched.
    //
    // Examples (delete these and add your own):
    //   { name: "some-lib", url: "https://github.com/acme/some-lib.git" }              // default branch
    //   { name: "some-lib", url: "https://github.com/acme/some-lib.git", ref: "next" } // branch
    //   { name: "some-lib", url: "https://github.com/acme/some-lib.git", ref: "v1.2.3" } // tag
    //   { name: "some-lib", url: "https://github.com/acme/some-lib.git", ref: "abc1234" } // commit SHA
    refs: [],

    // DEPENDENCY source repos: the things this project is built against. Unlike
    // the branch-tip references above, each one is pinned to the exact VERSION
    // you build against, so the source never lies about an API you don't have
    // installed. This matters most for pre-1.0 dependencies, where reading
    // `main` shows you APIs your lockfile doesn't have.
    //
    //   { name, url, probe, tag, seed, force? }
    //
    //   probe  how to discover the version you actually have:
    //     { kind: "npm", pkg }
    //       resolve from the workspace, in order:
    //         1. installed version in node_modules (lockfile-accurate)
    //         2. range declared in package.json (root),
    //            stripped to a bare version
    //         3. the seed below
    //     { kind: "exec", command, args?, pattern? }
    //       run the command and parse a version out of its first output line,
    //       for tools you drive but don't install from npm.
    //       args defaults to ["--version"].
    //       pattern defaults to "[0-9]+\\.[0-9]+\\.[0-9]+([-.][0-9A-Za-z.]+)?"
    //     { kind: "none" }
    //       no probe; seed (or force) only. The one probe kind that REQUIRES a
    //       seed, since nothing else can answer for it.
    //
    //   tag    upstream tag for that version. {v} = bare version, {name} = the
    //          entry's name.
    //          VERIFY THIS PER REPO — schemes genuinely differ. Run
    //          `git ls-remote --tags <url>` before adding an entry. Common ones:
    //            v{v}         most single-package repos
    //            {v}          bare version strings
    //            {name}@{v}   per-package tags in a monorepo
    //          A full commit SHA (40 hex digits) is fetched as that commit, for
    //          a version upstream never tagged. It has no {v}, so it does not
    //          follow the probe: when the installed version moves, move the SHA.
    //
    //   seed   optional. The version to assume until the workspace actually
    //          installs the package. Once the real install lands the probe
    //          answers instead, and you can delete the seed. Required only for
    //          { kind: "none" } with no force, where nothing else can answer.
    //          A seed that disagrees with what the probe found is reported as a
    //          warning; an entry with neither a probe answer nor a seed fails.
    //
    //   force  optional. Pins the source to this version regardless of what the
    //          probe reports — for when upstream's tags can't track the released
    //          version (e.g. a repo that stopped tagging).
    //
    // Examples (delete these and add your own):
    //
    //   { name: "tanstack-router", url: "https://github.com/TanStack/router.git",
    //     probe: { kind: "npm", pkg: "@tanstack/react-router" },
    //     tag: "@tanstack/react-router@{v}" }
    //
    //   { name: "zod", url: "https://github.com/colinhacks/zod.git",
    //     probe: { kind: "npm", pkg: "zod" }, tag: "v{v}", seed: "3.24.1" }
    //     (a seed is still useful before the package is installed — it is what
    //      lets deps:fetch check out matching source in the meantime)
    //
    //   { name: "neovim", url: "https://github.com/neovim/neovim.git",
    //     probe: { kind: "exec", command: "nvim" }, tag: "v{v}" }
    //
    //   { name: "spec", url: "https://github.com/example/spec.git",
    //     probe: { kind: "none" }, tag: "v{v}", seed: "1.4.0" }
    deps: [],
};
