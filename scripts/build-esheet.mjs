#!/usr/bin/env node
/** Keep local eSheet declarations, JS and shared CSS in sync with the submodule. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const submodule = join(
  dirname(fileURLToPath(import.meta.url)),
  '../packages/esheet'
);
const stampFile = join(submodule, 'packages/core/dist/.ui-build-stamp');
const markers = [
  ...['core', 'fields', 'adapters', 'renderer', 'builder'].flatMap((pkg) =>
    ['index.js', 'index.d.ts'].map((file) =>
      join(submodule, 'packages', pkg, 'dist', file)
    )
  ),
  join(submodule, 'packages/styles/src/index.output.css'),
  join(submodule, 'packages/styles/dist/index.js'),
];
let revision = null;
try {
  const git = (args) =>
    execFileSync('git', ['-C', submodule, ...args], { encoding: 'utf8' });
  revision = createHash('sha256')
    .update(git(['rev-parse', 'HEAD']))
    .update(git(['diff', 'HEAD']))
    .digest('hex');
} catch {
  // Source archives can still build without Git metadata.
}
if (
  markers.every(existsSync) &&
  (!revision ||
    (existsSync(stampFile) &&
      readFileSync(stampFile, 'utf8').trim() === revision))
) {
  console.log('[build:esheet] up to date, skipping');
  process.exit(0);
}
execFileSync('pnpm', ['install', '--frozen-lockfile'], {
  cwd: submodule,
  stdio: 'inherit',
});
execFileSync(
  'pnpm',
  [
    '--filter',
    '@esheet/builder...',
    '--filter',
    '@esheet/renderer...',
    'build',
  ],
  { cwd: submodule, stdio: 'inherit' }
);
if (!markers.every(existsSync))
  throw new Error('eSheet build did not produce all required artifacts');
if (revision) writeFileSync(stampFile, `${revision}\n`);
