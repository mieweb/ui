#!/usr/bin/env node
// Cross-platform replacement for `mkdir -p` + `cp` one-liners, which are
// bash-only and fail on Windows where npm/pnpm scripts run under cmd.exe.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const task = process.argv[2];

function copy(srcDir, files, destDir, { optional = false } = {}) {
  mkdirSync(join(root, destDir), { recursive: true });
  for (const file of files) {
    try {
      copyFileSync(join(root, srcDir, file), join(root, destDir, file));
    } catch (err) {
      if (!optional) throw err;
    }
  }
}

switch (task) {
  case 'brand-css': {
    const files = readdirSync(join(root, 'src/brands')).filter((f) => f.endsWith('.css'));
    copy('src/brands', files, 'dist/brands');
    break;
  }
  case 'style-css':
    // Matches the previous `2>/dev/null || true`: missing files are not fatal.
    copy('src/styles', ['init.css', 'effects.css'], 'dist/styles', { optional: true });
    break;
  case 'markdown-css':
    copy('src/components/Markdown', ['styles.css'], 'dist/components/Markdown', {
      optional: true,
    });
    break;
  case 'kerebron-css':
    copy('src/styles', ['kerebron.css'], 'dist');
    break;
  default:
    console.error(`[copy-assets] unknown task: ${task}`);
    process.exit(1);
}
