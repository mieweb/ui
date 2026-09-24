import { describe, expect, it } from 'vitest';

import {
  DTS_BATCH_SIZE,
  getDtsEntryBatches,
  tsupEntries,
} from './tsup.shared.js';

describe('getDtsEntryBatches', () => {
  it('preserves entry order while chunking the configured entries', () => {
    const entryKeys = Object.keys(tsupEntries);
    const batches = getDtsEntryBatches();

    expect(batches.flatMap((batch) => Object.keys(batch))).toEqual(entryKeys);
    expect(batches.at(0)).toBeDefined();
    expect(batches.at(-1)).toBeDefined();
    expect(Object.keys(batches[0])).toHaveLength(DTS_BATCH_SIZE);
    expect(Object.keys(batches.at(-1) ?? {})).toHaveLength(
      entryKeys.length % DTS_BATCH_SIZE || DTS_BATCH_SIZE
    );
  });
});
