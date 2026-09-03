import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { attachmentCache } from './attachmentCache';

// `fake-indexeddb/auto` polyfills a real IndexedDB implementation for this file
// only (vitest isolates modules per test file), so the cache exercises its true
// IDB code paths here — eviction included.

function dataUrl(bytes: number): string {
  // base64 of `bytes` zero bytes → "AAAA..." (3 bytes per 4 chars).
  const raw = '\u0000'.repeat(bytes);
  return `data:application/octet-stream;base64,${btoa(raw)}`;
}

describe('attachmentCache (IndexedDB)', () => {
  beforeEach(async () => {
    attachmentCache.configure({ maxBytes: Infinity });
    await attachmentCache.clear();
  });

  it('is available with a backing store', () => {
    expect(attachmentCache.isAvailable()).toBe(true);
  });

  it('stores and reads back a blob by id', async () => {
    const ok = await attachmentCache.put({
      id: 'a1',
      name: 'a.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(30),
    });
    expect(ok).toBe(true);

    const entry = await attachmentCache.get('a1');
    expect(entry?.name).toBe('a.bin');
    expect(entry?.size).toBe(30);
    expect(entry?.blob).toBeDefined();
    expect(await attachmentCache.usage()).toBe(30);
  });

  it('resolves an object URL for a cached entry', async () => {
    await attachmentCache.put({
      id: 'u1',
      name: 'u.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(12),
    });
    const url = await attachmentCache.getObjectURL('u1');
    expect(url).toMatch(/^blob:/);
    expect(await attachmentCache.getObjectURL('missing')).toBeUndefined();
  });

  it('deletes and clears entries', async () => {
    await attachmentCache.put({
      id: 'd1',
      name: 'd.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(9),
    });
    await attachmentCache.delete('d1');
    expect(await attachmentCache.get('d1')).toBeUndefined();
    expect(await attachmentCache.usage()).toBe(0);
  });

  it('evicts least-recently-used entries past the size budget', async () => {
    attachmentCache.configure({ maxBytes: 90 });

    // Three 40-byte entries = 120 bytes; budget is 90, so one must be evicted.
    await attachmentCache.put({
      id: 'old',
      name: 'old.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(40),
    });
    await attachmentCache.put({
      id: 'mid',
      name: 'mid.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(40),
    });

    // Touch `old` so `mid` becomes the least-recently-used.
    await attachmentCache.get('old');

    await attachmentCache.put({
      id: 'new',
      name: 'new.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(40),
    });

    // `mid` (LRU) is evicted; `old` and `new` survive within budget.
    expect(await attachmentCache.get('mid')).toBeUndefined();
    expect(await attachmentCache.get('old')).toBeDefined();
    expect(await attachmentCache.get('new')).toBeDefined();
    expect(await attachmentCache.usage()).toBeLessThanOrEqual(90);
  });

  it('keeps the newest entry even when it alone exceeds the budget', async () => {
    attachmentCache.configure({ maxBytes: 10 });
    await attachmentCache.put({
      id: 'big',
      name: 'big.bin',
      type: 'application/octet-stream',
      dataUrl: dataUrl(60),
    });
    expect(await attachmentCache.get('big')).toBeDefined();
  });
});
