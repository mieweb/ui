import { build } from 'tsup';

import { createTsupConfig, getDtsEntryBatches } from '../tsup.shared.js';

const baseConfig = createTsupConfig();
const dtsConfig = typeof baseConfig.dts === 'object' ? baseConfig.dts : {};

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
      dts: {
        ...dtsConfig,
        only: true,
      },
    })
  );
}
