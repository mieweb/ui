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
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const submodule = join(root, 'packages', 'datavis');
const markers = [
  join(submodule, 'dist', 'index.d.ts'),
  join(submodule, 'dist', 'datavis-react.js'),
  // base.css imports @mieweb/datavis/styles.css, so the CSS artifact must exist
  // for the root build even when the JS/types are already present.
  join(submodule, 'dist', 'styles.css'),
];
const stampFile = join(submodule, 'dist', '.build-stamp');

function git(args) {
  return execFileSync('git', ['-C', submodule, ...args], {
    encoding: 'utf8',
  }).trim();
}

// HEAD commit when the submodule is clean; otherwise HEAD plus a content hash of
// the whole working tree — the tracked diff and every untracked source file
// (dist/ and node_modules/ are gitignored, so `--untracked-files=all` never sees
// build artifacts). This gives each distinct local edit a distinct cache key and
// makes brand-new untracked source invalidate the cache too.
function currentRevision() {
  try {
    const head = git(['rev-parse', 'HEAD']);
    const status = git(['status', '--porcelain', '--untracked-files=all']);
    if (!status) return head;
    const hash = createHash('sha1');
    hash.update(head).update('\n').update(status).update('\n');
    hash.update(git(['diff', 'HEAD']));
    for (const line of status.split('\n')) {
      if (!line.startsWith('??')) continue;
      const rel = line.slice(3).replace(/^"|"$/g, '');
      try {
        hash.update('\0').update(rel).update('\0');
        hash.update(readFileSync(join(submodule, rel)));
      } catch {
        // Unreadable/removed path; the status line already contributed.
      }
    }
    return `${head}-dirty.${hash.digest('hex').slice(0, 12)}`;
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
