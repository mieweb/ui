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

// Builds a `?worker&inline` import (Vite's syntax, so Storybook and Vitest agree) into a self-contained
// module worker started from a blob URL, like the Whisper worker, so hosts need no worker file or loader.
const INLINE_WORKER = /\?worker&inline$/;
const inlineWorker: Plugin = {
  name: 'inline-worker',
  setup(build) {
    build.onResolve({ filter: INLINE_WORKER }, (args) => ({
      path: join(args.resolveDir, args.path.replace(INLINE_WORKER, '')),
      namespace: 'inline-worker',
    }));
    build.onLoad({ filter: /.*/, namespace: 'inline-worker' }, async (args) => {
      const { outputFiles } = await build.esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        format: 'esm',
        target: 'es2022',
        minify: true,
        write: false,
      });
      return {
        loader: 'js',
        contents: `const source = ${JSON.stringify(outputFiles[0].text)};
export default function InlineWorker() {
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    return new Worker(url, { type: 'module' });
  } finally {
    URL.revokeObjectURL(url);
  }
}`,
      };
    });
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
    '@xyflow/react',
    'elkjs',
    'leaflet',
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
  esbuildPlugins: [useSyncExternalStoreEsmShim, inlineWorker],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
