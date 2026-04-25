#!/usr/bin/env node
/**
 * Ensures git submodules required for development are initialized.
 *
 * The `@ozwell/react` package and `datavis` package are sourced from git
 * submodules under `packages/`. The `tsconfig.json` `paths` mapping for
 * `@ozwell/react` points at a file inside the submodule, so `tsc --noEmit`
 * fails with TS2307 ("Cannot find module '@ozwell/react'") whenever the
 * submodule is missing.
 *
 * This script is idempotent: if the expected sentinel files already exist,
 * it exits silently; otherwise it runs `git submodule update --init
 * --recursive`. It is safe to invoke from `preinstall` and from any script
 * (e.g. `typecheck`) that depends on submodule sources.
 *
 * Notes:
 * - Uses `existsSync` instead of `[ -d .git ]` so it works for git
 *   worktrees, where `.git` is a file rather than a directory.
 * - Silently no-ops outside a git repository (e.g. when installed as a
 *   tarball dependency) so it never blocks consumer installs.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// If we're not inside a git checkout, there's nothing to do.
if (!existsSync(resolve(repoRoot, '.git'))) {
  process.exit(0);
}

// Sentinel files that prove the submodules are populated.
const sentinels = [
  'packages/ozwell/packages/react/src/index.ts',
  'packages/datavis/package.json',
];

const allPresent = sentinels.every((p) => existsSync(resolve(repoRoot, p)));
if (allPresent) {
  process.exit(0);
}

console.log('Initializing git submodules...');
const result = spawnSync(
  'git',
  ['submodule', 'update', '--init', '--recursive'],
  { cwd: repoRoot, stdio: 'inherit' },
);

// Don't fail the parent script on transient git errors (e.g. offline
// installs); the consumer will see a clearer error from the next step.
process.exit(result.status ?? 0);
