#!/usr/bin/env node
// Imports the built @mieweb/ui/templates entry under the `react-server`
// condition, the way a React Server Component bundler resolves it. A named
// import of a client-only hook anywhere in its chunk graph fails to link, and
// a module-scope createContext() throws — either fails this check.
// Usage (after `pnpm build`): pnpm check:templates-rsc
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const entry = join(dirname(fileURLToPath(import.meta.url)), '../dist/templates.js');
if (!existsSync(entry)) {
  console.error('check-templates-rsc: dist/templates.js missing — run `pnpm build` first');
  process.exit(1);
}

const React = await import('react');
if (typeof React.useState === 'function') {
  console.error('check-templates-rsc: run with `node --conditions=react-server`');
  process.exit(1);
}

try {
  const templates = await import(pathToFileURL(entry).href);
  const count = Object.keys(templates).length;
  console.log(`check-templates-rsc: ok — ${count} exports import under react-server`);
} catch (error) {
  console.error('check-templates-rsc: @mieweb/ui/templates is not Server Component safe');
  console.error(error);
  process.exit(1);
}
