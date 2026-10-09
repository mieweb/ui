#!/usr/bin/env node
// Cross-platform replacement for a `sh`-only `if [ -f ... ]` one-liner, which
// fails on Windows where npm/pnpm scripts run under cmd.exe.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCmd } from './run-cmd.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const submodule = join(root, 'packages', 'esheet');
const markers = [
  join(submodule, 'packages', 'core', 'dist', 'index.d.ts'),
  join(submodule, 'packages', 'renderer', 'src', 'index.output.css'),
  join(submodule, 'packages', 'builder', 'src', 'index.output.css'),
];

if (markers.every(existsSync)) {
  console.log('[build:esheet] up to date, skipping');
  process.exit(0);
}

console.log('[build:esheet] rebuilding: output missing');
runCmd('pnpm', ['install', '--frozen-lockfile'], { cwd: submodule, stdio: 'inherit' });
runCmd(
  'pnpm',
  ['--filter', '@esheet/builder...', '--filter', '@esheet/renderer...', 'build'],
  { cwd: submodule, stdio: 'inherit' },
);
