import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';
import { entries } from './tsup.entries.mjs';

const shimDir = join(dirname(fileURLToPath(import.meta.url)), 'build-shims');

// Redirect the CJS `use-sync-external-store` package (pulled in by recharts,
// react-redux and react-i18next) to native-React ESM shims so its lazy
// `require('react')` doesn't survive bundling and break pure-ESM consumers.
const useSyncExternalStoreEsmShim: Plugin = {
  name: 'use-sync-external-store-esm-shim',
  setup(build) {
    build.onResolve({ filter: /^use-sync-external-store(\/.*)?$/ }, (args) => ({
      path: join(
        shimDir,
        /with-selector/.test(args.path)
          ? 'use-sync-external-store-with-selector.mjs'
          : 'use-sync-external-store.mjs'
      ),
    }));
  },
};

// Declarations are built separately, in batches, by scripts/build-dts.mjs.
// Bundling every entry's .d.ts in one rollup-plugin-dts pass exhausts an 8 GB
// heap (#496), while each batch on its own is small. The script re-runs tsup
// with MIEWEB_DTS_ENTRIES set to one batch of entry names; without it, this
// config builds JS only — including `pnpm dev` (`tsup --watch`), which does
// not refresh declarations. Run `pnpm build:dts` for up-to-date types.
const dtsBatch = process.env.MIEWEB_DTS_ENTRIES?.split(',').filter(Boolean);

function pickEntries(names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => {
      const source = entries[name];
      if (!source) throw new Error(`Unknown tsup entry: ${name}`);
      return [name, source];
    })
  );
}

export default defineConfig({
  entry: dtsBatch ? pickEntries(dtsBatch) : entries,
  format: ['esm', 'cjs'],
  target: 'es2022',
  // Inline @mieweb/datavis's types (it's a bundled submodule, not an installed
  // package) so the datavis entry's .d.ts does not re-export from it. Only the
  // datavis batch resolves: resolving for every entry is far more expensive.
  dts: dtsBatch ? { only: true, resolve: dtsBatch.includes('datavis') } : false,
  tsconfig: 'tsconfig.build.json',
  sourcemap: true,
  // Only the JS build cleans; declaration batches write into the same dist/.
  clean: !dtsBatch,
  external: [
    'react',
    'react-dom',
    'ag-grid-community',
    'ag-grid-react',
    'react-globe.gl',
    'three',
    '@mieweb/ui',
    // @mieweb/datavis is a git submodule (link:), not a published package, so it
    // is bundled into the datavis entry — like its CSS — instead of externalized.
    // Its shared peers (react*, datavis-ace, @dnd-kit/*, lucide-react) stay
    // external below/via root deps; datavis-only libs are baked in.
    '@mieweb/q',
    'datavis-ace',
    'mermaid',
    'motion',
    'motion/react',
    'papaparse',
    'js-yaml',
    'react-markdown',
    'remark-gfm',
    'remark-math',
    'rehype-katex',
    'katex',
    'rehype-sanitize',
    'rehype-highlight',
    /^@kerebron\//,
    /^@mieweb\/ui\//,
    /^@mieweb\/q\//,
    /^datavis\//,
    /^@esheet\//,
  ],
  treeshake: true,
  splitting: true,
  minify: false,
  esbuildPlugins: [useSyncExternalStoreEsmShim],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
