import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const visited = new Set();
async function inspect(path) {
  if (visited.has(path)) return;
  visited.add(path);
  const source = await readFile(path, 'utf8');
  assert(
    !/\b(?:window|document|navigator)\b/.test(source),
    `Browser global found in ${path}`
  );
  const references = [
    ...source.matchAll(/(?:from\s*|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);
  for (const reference of references) {
    assert(
      !/^(?:react(?:-dom)?)(?:\/|$)/.test(reference),
      `React dependency found in ${path}`
    );
    if (reference.startsWith('.'))
      await inspect(resolve(dirname(path), reference));
  }
}
for (const path of ['dist/prescribing.js', 'dist/prescribing.cjs'])
  await inspect(resolve(root, path));
const pure = await import('@mieweb/ui/prescribing');
const require = createRequire(import.meta.url);
const common = require('@mieweb/ui/prescribing');
const api = await import('@mieweb/ui/prescribing/api');
const commonApi = require('@mieweb/ui/prescribing/api');
assert.equal(typeof pure.validatePrescription, 'function');
assert.equal(typeof common.validatePrescription, 'function');
assert.equal(typeof api.createHttpClient, 'function');
assert.equal(typeof commonApi.createHttpClient, 'function');
assert.deepEqual(
  pure.validatePrescription({}, {}),
  common.validatePrescription({}, {})
);
const fixtureSource = await readFile(
  resolve(root, 'src/prescribing/fixtures.ts'),
  'utf8'
);
const fixtureJs = ts.transpileModule(fixtureSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { completeValidationFixture } = await import(
  `data:text/javascript;base64,${Buffer.from(fixtureJs).toString('base64')}`
);
const esmResult = pure.validatePrescription(
  completeValidationFixture,
  pure.demoPrescriptionPolicy
);
assert.equal(esmResult.dataState, 'complete');
assert.deepEqual(
  esmResult,
  common.validatePrescription(
    JSON.parse(JSON.stringify(completeValidationFixture)),
    common.demoPrescriptionPolicy
  )
);
for (const path of [
  'prescribing.d.ts',
  'prescribing.d.cts',
  'prescribing-api.d.ts',
  'prescribing-api.d.cts',
]) {
  const declarations = await readFile(resolve(root, 'dist', path), 'utf8');
  assert(declarations.length > 0, `Missing declarations: ${path}`);
}
// Compile ESM and CommonJS consumers against package exports, rather than source types.
const virtualPath = resolve(root, '.prescribing-entries-check.ts');
const consumer = `
import { validatePrescription, demoPrescriptionPolicy, type PrescriptionValidationInput } from '@mieweb/ui/prescribing';
import { createHttpClient, type PrescribingApi } from '@mieweb/ui/prescribing/api';
const input: PrescriptionValidationInput = ${JSON.stringify(completeValidationFixture)};
const result = validatePrescription(input, demoPrescriptionPolicy);
const client: PrescribingApi = createHttpClient({ baseUrl: 'https://example.invalid/api/prescribing/v1' });
void client.getCapabilities(); void result.issues;
`;
const commonPath = resolve(root, '.prescribing-entries-check.cts');
const commonConsumer = `
import prescribing = require('@mieweb/ui/prescribing');
import api = require('@mieweb/ui/prescribing/api');
const input: prescribing.PrescriptionValidationInput = ${JSON.stringify(completeValidationFixture)};
const result = prescribing.validatePrescription(input, prescribing.demoPrescriptionPolicy);
const client: api.PrescribingApi = api.createHttpClient();
void client.getCapabilities(); void result.issues;
`;
const sources = new Map([
  [virtualPath, consumer],
  [commonPath, commonConsumer],
]);
const options = {
  noEmit: true,
  strict: true,
  skipLibCheck: true,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2022.d.ts'],
  types: ['node'],
};
const host = ts.createCompilerHost(options);
const originalRead = host.readFile.bind(host);
const originalExists = host.fileExists.bind(host);
host.readFile = (path) => sources.get(path) ?? originalRead(path);
host.fileExists = (path) => sources.has(path) || originalExists(path);
const diagnostics = ts.getPreEmitDiagnostics(
  ts.createProgram([...sources.keys()], options, host)
);
assert.equal(
  diagnostics.length,
  0,
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => root,
    getCanonicalFileName: (name) => name,
    getNewLine: () => '\n',
  })
);
console.log(
  `Prescribing ESM/CommonJS/declarations passed; ${visited.size} pure build files contain no React/browser globals.`
);
