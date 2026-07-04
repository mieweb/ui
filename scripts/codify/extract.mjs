#!/usr/bin/env node
/**
 * Extract MedicalCodify_search rows from the rxdb MariaDB into a TSV.
 *
 * Usage:
 *   RXDB_MYSQL_PASSWORD=... node scripts/codify/extract.mjs \
 *     [--container wclocal-wcdb-1] [--user root] [--password <pw>] \
 *     [--out scripts/codify/data/codify.tsv]
 *
 * Requires the WebChart local docker stack to be running. Produces a
 * tab-separated file: fullid \t codetype \t fullcode \t label
 */
import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};

const container = opt('container', 'wclocal-wcdb-1');
const out = opt('out', 'scripts/codify/data/codify.tsv');
const user = opt('user', 'root');
// Never hardcode credentials: read from --password, RXDB_MYSQL_PASSWORD, or
// MYSQL_PWD, and pass it to mysql via the environment (not argv, which would
// leak through process listings).
const password = opt(
  'password',
  process.env.RXDB_MYSQL_PASSWORD ?? process.env.MYSQL_PWD
);
if (!password) {
  console.error(
    'Missing database password. Set RXDB_MYSQL_PASSWORD (or MYSQL_PWD), or pass --password <pw>.'
  );
  process.exit(1);
}

const CODETYPES = [
  'RxNORM',
  'LOINC',
  'FDB',
  'ICD10',
  'ICD10PCS',
  'LOINC Hierarchy',
  'FDB MEDNAME',
  'HCPCS',
  'SNOMED US',
  'Quest Order',
  'LabCorp Order',
  'CVX',
];

const inList = CODETYPES.map((c) => `'${c}'`).join(',');
// Strip tabs/newlines from labels so the TSV stays rectangular.
const sql = `SELECT fullid, codetype, fullcode,
  REPLACE(REPLACE(REPLACE(label, '\\t', ' '), '\\n', ' '), '\\r', ' ') AS label
  FROM MedicalCodify_search
  WHERE codetype IN (${inList}) AND label != ''`;

mkdirSync(path.dirname(out), { recursive: true });
const file = createWriteStream(out);

const child = spawn(
  'docker',
  [
    'exec',
    '-e',
    'MYSQL_PWD',
    container,
    'mysql',
    `-u${user}`,
    '-D',
    'rxdb_utf8',
    '--batch',
    '--raw',
    '--silent',
    '-e',
    sql,
  ],
  {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, MYSQL_PWD: password },
  }
);

let bytes = 0;
child.stdout.on('data', (chunk) => {
  bytes += chunk.length;
  file.write(chunk);
});
child.on('close', (code) => {
  file.end(() => {
    if (code !== 0) {
      console.error(`mysql exited with code ${code}`);
      process.exit(code ?? 1);
    }
    console.error(`Wrote ${(bytes / 1024 / 1024).toFixed(1)} MB to ${out}`);
  });
});
