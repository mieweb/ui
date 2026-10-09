#!/usr/bin/env node
/**
 * Builds the .d.ts / .d.cts declarations in sequential batches (#496).
 *
 * tsup bundles declarations for every entry in a single rollup-plugin-dts
 * pass, and with ~85 entries that pass no longer fits in an 8 GB heap, even
 * though any single entry is cheap (`index`, which re-exports nearly
 * everything, needs ~1 GB). tsup runs the configs of an array config
 * concurrently, so batching has to happen here: one tsup process per batch,
 * one after another, so each batch's memory is released before the next.
 *
 * Batches:
 * - `datavis` alone — the only entry that inlines dependency types
 *   (`dts.resolve`), see tsup.config.ts.
 * - `index` alone — the largest declaration graph.
 * - Everything else in chunks of MIEWEB_DTS_BATCH_SIZE (default 20).
 *
 * Expects the JS build (plain `tsup`) to have run first; it owns `clean`.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entries } from '../tsup.entries.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tsupCli = join(root, 'node_modules', 'tsup', 'dist', 'cli-default.js');
const DEFAULT_BATCH_SIZE = 20;
const rawBatchSize = process.env.MIEWEB_DTS_BATCH_SIZE;
const batchSize =
  rawBatchSize === undefined || rawBatchSize === ''
    ? DEFAULT_BATCH_SIZE
    : Number(rawBatchSize);
if (!Number.isInteger(batchSize) || batchSize < 1) {
  console.error(
    `MIEWEB_DTS_BATCH_SIZE must be a positive integer (got "${rawBatchSize}").`
  );
  process.exit(1);
}

const SOLO = ['datavis', 'index'];
const rest = Object.keys(entries).filter((name) => !SOLO.includes(name));

const batches = SOLO.map((name) => [name]);
for (let start = 0; start < rest.length; start += batchSize) {
  batches.push(rest.slice(start, start + batchSize));
}

const started = Date.now();
batches.forEach((batch, index) => {
  const label = `[dts ${index + 1}/${batches.length}] ${batch.length} entr${batch.length === 1 ? 'y' : 'ies'}`;
  console.log(`${label}: ${batch.join(', ')}`);
  const batchStarted = Date.now();
  execFileSync(
    process.execPath,
    ['--max-old-space-size=8192', tsupCli, '--silent'],
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, MIEWEB_DTS_ENTRIES: batch.join(',') },
    }
  );
  console.log(
    `${label} done in ${((Date.now() - batchStarted) / 1000).toFixed(1)}s`
  );
});
console.log(
  `[dts] ${batches.length} batches in ${((Date.now() - started) / 1000).toFixed(1)}s`
);
