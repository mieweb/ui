import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { recordUse, getTopCodes, clearMemory } from './memoryStore';
import { exportMemoryYaml, importMemoryYaml } from './memoryYaml';

const code = (fullid: string, label = fullid) => ({
  fullid,
  label,
  codetype: 'FDB MEDNAME',
  fullcode: fullid.replace(/\D/g, '') || '1',
  domain: 'med',
});

let n = 0;
const freshScope = (userId = 'alice') => ({
  userId,
  context: `yaml-ctx-${++n}`,
});

describe('memory YAML export/import', () => {
  it('round-trips a bucket through YAML', async () => {
    const scope = freshScope();
    await recordUse(scope, code('med1', 'Lasix'));
    await recordUse(scope, code('med1', 'Lasix'));
    await recordUse(scope, code('med2', 'Tylenol'));

    const yaml = await exportMemoryYaml(scope);
    expect(yaml).toContain('version: 1');
    expect(yaml).toContain(`context: ${scope.context}`);
    expect(yaml).toContain('label: Lasix');

    await clearMemory(scope);
    expect(await getTopCodes(scope)).toEqual([]);

    const result = await importMemoryYaml(yaml);
    expect(result).toMatchObject({ imported: 2, buckets: 1, skipped: 0 });

    const top = await getTopCodes(scope);
    expect(top.map((e) => [e.label, e.count])).toEqual([
      ['Lasix', 2],
      ['Tylenol', 1],
    ]);
    expect(top[0].lastUsed).toBeGreaterThan(0);
  });

  it('exports every bucket when no scope is given', async () => {
    const alice = freshScope('alice');
    const bob = { userId: 'bob', context: alice.context };
    await recordUse(alice, code('a', 'Aspirin'));
    await recordUse(bob, code('b', 'Bactrim'));

    const yaml = await exportMemoryYaml();
    expect(yaml).toContain('user: alice');
    expect(yaml).toContain('user: bob');
  });

  it('keeps the larger count when merging into existing usage', async () => {
    const scope = freshScope();
    await recordUse(scope, code('m', 'Metformin'));
    await recordUse(scope, code('m', 'Metformin'));
    await recordUse(scope, code('m', 'Metformin'));
    const yaml = await exportMemoryYaml(scope); // count 3

    await clearMemory(scope);
    await recordUse(scope, code('m', 'Metformin')); // local count 1
    await importMemoryYaml(yaml);
    expect((await getTopCodes(scope))[0].count).toBe(3);

    // re-importing the same document is idempotent
    await importMemoryYaml(yaml);
    expect((await getTopCodes(scope))[0].count).toBe(3);
  });

  it('retargets buckets into one scope with the scope option', async () => {
    const source = freshScope('curator');
    await recordUse(source, code('s1', 'Starter A'));
    await recordUse(source, code('s2', 'Starter B'));
    const yaml = await exportMemoryYaml(source);

    const target = freshScope('bob');
    const result = await importMemoryYaml(yaml, { scope: target });
    expect(result.imported).toBe(2);
    expect((await getTopCodes(target)).map((e) => e.label).sort()).toEqual([
      'Starter A',
      'Starter B',
    ]);
  });

  it('imports a hand-written starter set', async () => {
    const target = freshScope();
    const result = await importMemoryYaml(
      `version: 1
buckets:
  - user: ${target.userId}
    context: ${target.context}
    codes:
      - fullid: FDBMEDNAME6808
        label: Tylenol
        codetype: FDB MEDNAME
        fullcode: '6808'
        domain: med
        count: 5
`
    );
    expect(result.imported).toBe(1);
    const [entry] = await getTopCodes(target);
    expect(entry).toMatchObject({
      label: 'Tylenol',
      count: 5,
      fullcode: '6808',
    });
  });

  it('skips unusable rows and rejects foreign documents', async () => {
    const target = freshScope();
    const result = await importMemoryYaml(
      `version: 1
buckets:
  - user: ${target.userId}
    context: ${target.context}
    codes:
      - label: no fullid here
      - fullid: ok1
        label: Kept
`
    );
    expect(result).toMatchObject({ imported: 1, skipped: 1 });

    await expect(importMemoryYaml('just: a string')).rejects.toThrow(
      /expected a `buckets` list/
    );
    await expect(importMemoryYaml('version: 99\nbuckets: []')).rejects.toThrow(
      /Unsupported memory export version/
    );
  });
});
