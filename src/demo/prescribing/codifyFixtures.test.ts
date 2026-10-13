import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseShard, searchShards } from '../../components/CodeLookup/engine';
import { makeProducts } from './fixtures';

function fixtureShard(domain: string) {
  const bytes = readFileSync(
    resolve('.storybook/public/prescribing-codify/en', `${domain}.mcdx`)
  );
  return parseShard(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  );
}

describe('simulator Codify fixture assets', () => {
  it('uses actual MCDX medication search results that resolve to the fake EHR catalog', () => {
    const products = makeProducts('2026-10-03T12:00:00.000Z');
    const shard = fixtureShard('med');
    const results = searchShards([shard], 'SimDrug', 20);
    expect(results.map((result) => result.fullcode).sort()).toEqual([
      'sim-a',
      'sim-b',
    ]);
    for (const result of searchShards([shard], 'tablet', 20)) {
      const product = products.find((entry) => entry.id === result.fullcode);
      expect(product?.coding).toContainEqual(
        expect.objectContaining({
          system: result.codetype,
          code: result.fullcode,
        })
      );
      expect(product?.display).toBe(result.label);
    }
    // A real drug name never maps to invented safety/dosing coverage.
    expect(searchShards([shard], 'Lasix')).toEqual([]);
  });
  it('loads a separate condition-domain index for coded indication concerns', () => {
    const shard = fixtureShard('condition');
    expect(searchShards([shard], 'Synthetic indication')).toEqual([
      expect.objectContaining({
        domain: 'condition',
        codetype: 'urn:mieweb:simulation-condition',
        fullcode: 'sim-condition-1',
        label: 'Synthetic indication',
      }),
    ]);
  });
});
