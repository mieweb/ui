import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  recordUse,
  getTopCodes,
  seedFromServer,
  scheduleFlush,
  clearMemory,
  matchMemory,
  type MemoryEntry,
  type MemoryScope,
} from './memoryStore';

// `fake-indexeddb/auto` polyfills a real IndexedDB for this file only (vitest
// isolates modules per test file), so the store exercises its true IDB paths.

const code = (fullid: string, label = fullid) => ({
  fullid,
  label,
  codetype: 'ICD10',
  fullcode: fullid.toUpperCase(),
  domain: 'condition',
});

// Unique contexts per test keep buckets (and the module's session-seed /
// beacon registries) from bleeding between tests without a reset hook.
let n = 0;
const freshScope = (userId = 'alice'): MemoryScope => ({
  userId,
  context: `ctx-${++n}`,
});

describe('memoryStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('records picks and returns them count-desc with lastUsed tiebreak', async () => {
    const scope = freshScope();
    // fake only Date — fake-indexeddb needs real timers to dispatch events
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1000);
    await recordUse(scope, code('a'));
    await recordUse(scope, code('a'));
    await recordUse(scope, code('b'));
    vi.setSystemTime(2000);
    await recordUse(scope, code('c')); // ties b on count, later lastUsed

    const top = await getTopCodes(scope);
    expect(top.map((e) => e.fullid)).toEqual(['a', 'c', 'b']);
    expect(top[0].count).toBe(2);
    expect(top[0].pendingDelta).toBe(2);
  });

  it('honors the limit', async () => {
    const scope = freshScope();
    for (let i = 0; i < 5; i++) await recordUse(scope, code(`x${i}`));
    expect(await getTopCodes(scope, 2)).toHaveLength(2);
  });

  it('isolates users in the same browser/db', async () => {
    const ctx = `ctx-${++n}`;
    const alice: MemoryScope = { userId: 'alice', context: ctx };
    const bob: MemoryScope = { userId: 'bob', context: ctx };
    await recordUse(alice, code('lasix'));
    await recordUse(bob, code('metformin'));

    expect((await getTopCodes(alice)).map((e) => e.fullid)).toEqual(['lasix']);
    expect((await getTopCodes(bob)).map((e) => e.fullid)).toEqual([
      'metformin',
    ]);
  });

  it('isolates contexts for the same user', async () => {
    const orders: MemoryScope = { userId: 'alice', context: `med-${++n}` };
    const presenting: MemoryScope = { userId: 'alice', context: `pres-${n}` };
    await recordUse(orders, code('cbc'));
    await recordUse(presenting, code('chf'));

    expect((await getTopCodes(orders)).map((e) => e.fullid)).toEqual(['cbc']);
    expect((await getTopCodes(presenting)).map((e) => e.fullid)).toEqual([
      'chf',
    ]);
  });

  it('seed merges server counts with max(count) and adds new entries', async () => {
    const scope = freshScope();
    await recordUse(scope, code('a')); // local count 1
    await recordUse(scope, code('b'));
    await recordUse(scope, code('b')); // local count 2

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { ...code('a'), count: 5 }, // server higher → 5
          { ...code('b'), count: 1 }, // local higher → stays 2
          { ...code('srv'), count: 3 }, // new from server
        ])
      )
    );
    await seedFromServer(scope, 'https://api.example/memory');

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example/memory?user=alice&context=${scope.context}`
    );
    const top = await getTopCodes(scope);
    const byId = Object.fromEntries(top.map((e) => [e.fullid, e]));
    expect(byId.a.count).toBe(5);
    expect(byId.b.count).toBe(2);
    expect(byId.srv.count).toBe(3);
    // seeded counts are not pending deltas
    expect(byId.srv.pendingDelta).toBe(0);
    expect(byId.a.pendingDelta).toBe(1);
  });

  it('seeds only once per scope per session', async () => {
    const scope = freshScope();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('[]'));
    await seedFromServer(scope, 'https://api.example/memory');
    await seedFromServer(scope, 'https://api.example/memory');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('flushes pending deltas and resets them on success', async () => {
    const scope = freshScope();
    await recordUse(scope, code('a'));
    await recordUse(scope, code('a'));

    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    scheduleFlush(scope, 'https://api.example/memory', 10);
    await vi.advanceTimersByTimeAsync(20);
    vi.useRealTimers();
    await Promise.resolve(); // let the flush settle

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example/memory');
    const body = JSON.parse(String(init?.body));
    expect(body.user).toBe('alice');
    expect(body.context).toBe(scope.context);
    expect(body.deltas).toEqual([
      expect.objectContaining({ fullid: 'a', delta: 2 }),
    ]);

    const [entry] = await getTopCodes(scope);
    expect(entry.pendingDelta).toBe(0);
    expect(entry.count).toBe(2);
  });

  it('keeps deltas pending when the flush fails', async () => {
    const scope = freshScope();
    await recordUse(scope, code('a'));

    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 })
    );
    scheduleFlush(scope, 'https://api.example/memory', 10);
    await vi.advanceTimersByTimeAsync(20);
    vi.useRealTimers();
    await Promise.resolve();

    const [entry] = await getTopCodes(scope);
    expect(entry.pendingDelta).toBe(1);
  });

  it('debounces repeated scheduleFlush calls into one POST', async () => {
    const scope = freshScope();
    await recordUse(scope, code('a'));

    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}'));
    scheduleFlush(scope, 'https://api.example/memory', 50);
    scheduleFlush(scope, 'https://api.example/memory', 50);
    scheduleFlush(scope, 'https://api.example/memory', 50);
    await vi.advanceTimersByTimeAsync(200);
    vi.useRealTimers();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clearMemory resets only the target bucket', async () => {
    const ctx = `ctx-${++n}`;
    const alice: MemoryScope = { userId: 'alice', context: ctx };
    const bob: MemoryScope = { userId: 'bob', context: ctx };
    await recordUse(alice, code('a'));
    await recordUse(bob, code('b'));

    await clearMemory(alice);
    expect(await getTopCodes(alice)).toEqual([]);
    expect(await getTopCodes(bob)).toHaveLength(1);
  });
});

describe('matchMemory', () => {
  const entry = (label: string): MemoryEntry => ({
    userId: 'alice',
    context: 'c',
    fullid: label,
    label,
    codetype: 'FDB',
    fullcode: '1',
    domain: 'med',
    count: 1,
    lastUsed: 0,
    pendingDelta: 0,
  });
  const entries = [
    entry('Flonase'),
    entry('furosemide'),
    entry('Childrens Tylenol'),
  ];

  it('matches every token as a word prefix', () => {
    expect(matchMemory(entries, 'f').map((e) => e.label)).toEqual([
      'Flonase',
      'furosemide',
    ]);
    expect(matchMemory(entries, 'tyl').map((e) => e.label)).toEqual([
      'Childrens Tylenol',
    ]);
    expect(matchMemory(entries, 'chi tyl').map((e) => e.label)).toEqual([
      'Childrens Tylenol',
    ]);
  });

  it('ignores case, accents and punctuation, and empty queries', () => {
    expect(matchMemory(entries, 'FLO')).toHaveLength(1);
    expect(matchMemory(entries, '   ')).toEqual([]);
    expect(matchMemory(entries, 'zzz')).toEqual([]);
  });
});

describe('memoryStore without IndexedDB', () => {
  let saved: IDBFactory;
  beforeEach(() => {
    saved = globalThis.indexedDB;
    // @ts-expect-error — simulate an environment without IndexedDB
    delete globalThis.indexedDB;
  });
  afterEach(() => {
    globalThis.indexedDB = saved;
  });

  it('all APIs resolve as no-ops', async () => {
    const scope: MemoryScope = { userId: 'u', context: 'no-idb' };
    await expect(recordUse(scope, code('a'))).resolves.toBeUndefined();
    await expect(getTopCodes(scope)).resolves.toEqual([]);
    await expect(
      seedFromServer(scope, 'https://api.example/memory')
    ).resolves.toBeUndefined();
    expect(() =>
      scheduleFlush(scope, 'https://api.example/memory')
    ).not.toThrow();
    await expect(clearMemory(scope)).resolves.toBeUndefined();
  });
});
