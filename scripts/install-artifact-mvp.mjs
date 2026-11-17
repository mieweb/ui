#!/usr/bin/env node
/** Install locally packed upstream MVPs without committing machine-specific paths. */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const archives = process.argv.slice(2).map((file) => resolve(file));
const documents = archives.find((file) =>
  /kerebron-documents-[^/]+\.tgz$/.test(file)
);
if (archives.length !== 4 || !documents) {
  throw new Error(
    'Pass four npm pack archives: Artipod core, Kerebron documents, document-mime, and document-yjs. See lessons/collaborative-artifact-editor.md.'
  );
}
for (const file of archives) {
  if (!file.endsWith('.tgz') || !statSync(file).isFile())
    throw new Error(`Not an npm archive: ${file}`);
}

const files = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'];
const original = new Map(
  files.map((file) => [file, readFileSync(resolve(root, file))])
);
try {
  // MIME depends on the not-yet-published documents package. Resolve that edge
  // to the same packed artifact as the root, keeping one model implementation.
  const workspace = original.get('pnpm-workspace.yaml').toString('utf8');
  if (!/^overrides:\s*$/m.test(workspace))
    throw new Error('Expected repository pnpm overrides');
  writeFileSync(
    resolve(root, 'pnpm-workspace.yaml'),
    workspace.replace(
      /^overrides:\s*$/m,
      `overrides:\n  "@kerebron/documents": ${JSON.stringify('file:' + documents)}`
    )
  );
  const result = spawnSync(
    'pnpm',
    ['add', '--ignore-scripts', '--save-dev', ...archives],
    {
      cwd: root,
      stdio: 'inherit',
      shell: false,
    }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  // node_modules keeps the tested local artifacts; tracked manifests keep their
  // portable public contract and are ready for the eventual published versions.
  for (const [file, contents] of original)
    writeFileSync(resolve(root, file), contents);
}
