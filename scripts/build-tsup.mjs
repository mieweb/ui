import { copyFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { build } from 'tsup';

import { createTsupConfig, getDtsEntryBatches } from '../tsup.shared.js';

const baseConfig = createTsupConfig();
const dtsConfig = typeof baseConfig.dts === 'object' ? baseConfig.dts : {};
const outDir = baseConfig.outDir ?? 'dist';

async function syncCommonJsDeclarations(directory = outDir) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await syncCommonJsDeclarations(entryPath);
        return;
      }

      if (entry.isFile() && entry.name.endsWith('.d.ts')) {
        await copyFile(entryPath, entryPath.replace(/\.d\.ts$/, '.d.cts'));
      }
    })
  );
}

await build(
  createTsupConfig({
    dts: false,
  })
);

for (const [batchIndex, entry] of getDtsEntryBatches().entries()) {
  await build(
    createTsupConfig({
      name: `dts-batch-${batchIndex + 1}`,
      entry,
      clean: false,
      format: ['esm'],
      splitting: false,
      sourcemap: false,
      dts: {
        ...dtsConfig,
        only: true,
      },
    })
  );

  await syncCommonJsDeclarations();
}
