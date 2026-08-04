import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  setMemoryStorage,
  memoryAvailable,
  memSet,
  memGetAll,
} from './memoryBackend';
import type { MemoryEntry } from './memoryStore';

const entry: MemoryEntry = {
  userId: 'alice',
  context: 'ctx',
  fullid: 'a',
  label: 'a',
  codetype: 'ICD10',
  fullcode: 'A',
  domain: 'condition',
  count: 1,
  lastUsed: 1000,
  pendingDelta: 1,
};

describe('memoryBackend session SSR guard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setMemoryStorage('session');
  });

  it('session memory is available in a browser context', () => {
    setMemoryStorage('session');
    expect(memoryAvailable()).toBe(true);
  });

  it('session memory fails closed without a browser (SSR/Node)', async () => {
    setMemoryStorage('session');
    vi.stubGlobal('window', undefined);

    expect(memoryAvailable()).toBe(false);
    await memSet('k', entry); // must be a no-op
    vi.unstubAllGlobals();
    expect(await memGetAll()).toEqual([]);
  });
});
