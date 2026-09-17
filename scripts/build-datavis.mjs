#!/usr/bin/env node
/**
 * Builds the DataVis submodule (`packages/datavis`) only when its output is
 * missing or its checked-out revision changed since the last successful build.
 *
 * The previous inline guard only checked whether two `dist` files existed, so a
 * `git submodule update` to a new commit (or local edits inside the submodule)
 * kept serving stale artifacts. This keys the cache on the submodule's git
 * revision (HEAD + tracked-dirty state) recorded in a stamp file under its
 * gitignored `dist/`.
 *
 * When git metadata is unavailable (e.g. a published tarball with no `.git`),
 * it falls back to the existence-only check, preserving CI/consumer behaviour.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const submodule = join(root, 'packages', 'datavis');
const markers = [
  join(submodule, 'dist', 'index.d.ts'),
  join(submodule, 'dist', 'datavis-react.js'),
];
const stampFile = join(submodule, 'dist', '.build-stamp');

function git(args) {
  return execFileSync('git', ['-C', submodule, ...args], {
    encoding: 'utf8',
  }).trim();
}

// HEAD commit plus a `-dirty` suffix when tracked files differ. `-uno` ignores
// untracked paths (dist/, node_modules/) so build artifacts never look dirty.
function currentRevision() {
  try {
    const head = git(['rev-parse', 'HEAD']);
    const dirty = git(['status', '--porcelain', '-uno']);
    return dirty ? `${head}-dirty` : head;
  } catch {
    return null;
  }
}

function readStamp() {
  try {
    return readFileSync(stampFile, 'utf8').trim();
  } catch {
    return null;
  }
}

const markersPresent = markers.every(existsSync);
const rev = currentRevision();
const stamp = readStamp();

let reason = null;
if (!markersPresent) reason = 'output missing';
else if (rev && stamp !== rev)
  reason = `revision changed (${stamp ?? 'none'} \u2192 ${rev})`;

if (!reason) {
  console.log('[build:datavis] up to date, skipping');
  process.exit(0);
}

console.log(`[build:datavis] rebuilding: ${reason}`);
execFileSync('npm', ['ci'], { cwd: submodule, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { cwd: submodule, stdio: 'inherit' });

if (rev) {
  writeFileSync(stampFile, `${rev}\n`);
  console.log(`[build:datavis] stamped ${rev}`);
}
