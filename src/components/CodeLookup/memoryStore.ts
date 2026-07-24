/**
 * CodeLookup "memory" — per-(user, context) usage counts for picked codes,
 * persisted in IndexedDB, powering the "Frequently used" empty-query picklist.
 *
 * Pattern follows `src/components/AI/voiceprintStore.ts` /
 * `src/components/SuperChat/render/attachmentCache.ts`: promise-wrapped IDB,
 * best-effort (no-IDB environments — SSR, some tests — degrade to no-ops).
 *
 * Optional server sync (full sync):
 *  - `seedFromServer` GETs `{serverUrl}?user=&context=` once per scope per
 *    session and merges counts with `max(count)`.
 *  - `scheduleFlush` debounces a POST of accumulated count deltas
 *    (`{user, context, deltas:[…]}`); a `pagehide` listener flushes any
 *    remaining deltas via `navigator.sendBeacon`.
 */

import type { CodifyResult } from './engine';

// =============================================================================
// Types
// =============================================================================

/** Identifies one memory bucket: counts never leak across users or contexts. */
export interface MemoryScope {
  /** Developer-supplied user id; use 'anonymous' when unknown. */
  userId: string;
  /** Usage context, e.g. 'med-orders' vs 'presenting-meds'. */
  context: string;
}

/** One remembered code with its usage stats (full display fields stored). */
export interface MemoryEntry {
  userId: string;
  context: string;
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
  domain: string;
  /** Total times picked (local + server-seeded). */
  count: number;
  /** Epoch ms of the most recent pick (count-tie ordering). */
  lastUsed: number;
  /** Picks not yet flushed to the server. */
  pendingDelta: number;
}

/** Server seed row (GET response item) / flush delta shape. */
interface ServerCount {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
  domain: string;
  count: number;
}

// =============================================================================
// IndexedDB plumbing
// =============================================================================

const DB_NAME = 'mieweb-codelookup-memory';
const STORE = 'usage';
const DB_VERSION = 1;

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB != null;
  } catch {
    return false;
  }
}

function entryKey(scope: MemoryScope, fullid: string): string {
  return `${scope.userId}|${scope.context}|${fullid}`;
}

/** Key range covering every entry in a scope (keys are `user|context|fullid`). */
function scopeRange(scope: MemoryScope): IDBKeyRange {
  const prefix = `${scope.userId}|${scope.context}|`;
  return IDBKeyRange.bound(prefix, `${prefix}\uffff`);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // A version upgrade blocked by another tab would otherwise hang forever.
    req.onblocked = () =>
      reject(
        new Error('IndexedDB open blocked (another tab holds an upgrade lock)')
      );
  });
}

function idbGet(key: string): Promise<MemoryEntry | undefined> {
  return openDb().then(
    (db) =>
      new Promise<MemoryEntry | undefined>((resolve, reject) => {
        const req = db
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .get(key);
        req.onsuccess = () => {
          resolve(req.result as MemoryEntry | undefined);
          db.close();
        };
        req.onerror = () => {
          reject(req.error);
          db.close();
        };
      })
  );
}

function idbSet(key: string, value: MemoryEntry): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => {
          resolve();
          db.close();
        };
        tx.onerror = () => {
          reject(tx.error);
          db.close();
        };
        tx.onabort = () => {
          reject(tx.error);
          db.close();
        };
      })
  );
}

function idbGetScope(scope: MemoryScope): Promise<MemoryEntry[]> {
  return openDb().then(
    (db) =>
      new Promise<MemoryEntry[]>((resolve, reject) => {
        const req = db
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .getAll(scopeRange(scope));
        req.onsuccess = () => {
          resolve((req.result ?? []) as MemoryEntry[]);
          db.close();
        };
        req.onerror = () => {
          reject(req.error);
          db.close();
        };
      })
  );
}

function idbDeleteScope(scope: MemoryScope): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(scopeRange(scope));
        tx.oncomplete = () => {
          resolve();
          db.close();
        };
        tx.onerror = () => {
          reject(tx.error);
          db.close();
        };
        tx.onabort = () => {
          reject(tx.error);
          db.close();
        };
      })
  );
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Record a pick: increment `count` and `pendingDelta`, refresh `lastUsed`,
 * (re)capture the display fields. Best-effort — resolves even without IDB.
 */
export async function recordUse(
  scope: MemoryScope,
  result: Pick<
    CodifyResult,
    'fullid' | 'label' | 'codetype' | 'fullcode' | 'domain'
  >
): Promise<void> {
  if (!hasIndexedDB()) return;
  try {
    const key = entryKey(scope, result.fullid);
    const prev = await idbGet(key);
    const entry: MemoryEntry = {
      userId: scope.userId,
      context: scope.context,
      fullid: result.fullid,
      label: result.label,
      codetype: result.codetype,
      fullcode: result.fullcode,
      domain: result.domain,
      count: (prev?.count ?? 0) + 1,
      lastUsed: Date.now(),
      pendingDelta: (prev?.pendingDelta ?? 0) + 1,
    };
    await idbSet(key, entry);
  } catch {
    /* best-effort */
  }
}

/**
 * The scope's most-used codes: `count` desc, `lastUsed` desc tiebreak,
 * capped at `limit`. Resolves `[]` without IDB.
 */
export async function getTopCodes(
  scope: MemoryScope,
  limit = 8
): Promise<MemoryEntry[]> {
  if (!hasIndexedDB()) return [];
  try {
    const entries = await idbGetScope(scope);
    entries.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
    return entries.slice(0, limit);
  } catch {
    return [];
  }
}

/** Scopes already seeded this session (`user|context|serverUrl`). */
const seededScopes = new Set<string>();

/**
 * Seed the scope from the server once per session:
 * `GET {serverUrl}?user=…&context=…` → `ServerCount[]`, merged with
 * `max(localCount, serverCount)`; unknown codes are added. Best-effort.
 */
export async function seedFromServer(
  scope: MemoryScope,
  serverUrl: string
): Promise<void> {
  if (!hasIndexedDB()) return;
  const seedKey = `${scope.userId}|${scope.context}|${serverUrl}`;
  if (seededScopes.has(seedKey)) return;
  seededScopes.add(seedKey);
  try {
    const url = `${serverUrl}?user=${encodeURIComponent(scope.userId)}&context=${encodeURIComponent(scope.context)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`seed fetch failed: ${res.status}`);
    const rows = (await res.json()) as ServerCount[];
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
      if (!row || typeof row.fullid !== 'string') continue;
      const key = entryKey(scope, row.fullid);
      const prev = await idbGet(key);
      const serverCount = typeof row.count === 'number' ? row.count : 0;
      await idbSet(key, {
        userId: scope.userId,
        context: scope.context,
        fullid: row.fullid,
        label: prev?.label ?? row.label ?? '',
        codetype: prev?.codetype ?? row.codetype ?? '',
        fullcode: prev?.fullcode ?? row.fullcode ?? '',
        domain: prev?.domain ?? row.domain ?? '',
        count: Math.max(prev?.count ?? 0, serverCount),
        lastUsed: prev?.lastUsed ?? 0,
        pendingDelta: prev?.pendingDelta ?? 0,
      });
    }
  } catch {
    // Failed seeds may retry next session; keep the local counts as-is.
  }
}

/** Collect the scope's pending deltas as a flush payload (or null if none). */
async function pendingPayload(scope: MemoryScope): Promise<{
  body: string;
  flushed: Map<string, number>;
} | null> {
  const entries = await idbGetScope(scope);
  const deltas: (ServerCount & { delta: number })[] = [];
  const flushed = new Map<string, number>();
  for (const e of entries) {
    if (e.pendingDelta > 0) {
      deltas.push({
        fullid: e.fullid,
        label: e.label,
        codetype: e.codetype,
        fullcode: e.fullcode,
        domain: e.domain,
        count: e.count,
        delta: e.pendingDelta,
      });
      flushed.set(e.fullid, e.pendingDelta);
    }
  }
  if (deltas.length === 0) return null;
  const body = JSON.stringify({
    user: scope.userId,
    context: scope.context,
    deltas: deltas.map(({ count: _count, ...d }) => d),
  });
  return { body, flushed };
}

/** After a successful flush, subtract the flushed amounts (new picks may
 * have landed while the POST was in flight — never blindly zero). */
async function settleFlushed(
  scope: MemoryScope,
  flushed: Map<string, number>
): Promise<void> {
  for (const [fullid, delta] of flushed) {
    const key = entryKey(scope, fullid);
    const entry = await idbGet(key);
    if (!entry) continue;
    await idbSet(key, {
      ...entry,
      pendingDelta: Math.max(0, entry.pendingDelta - delta),
    });
  }
}

async function flushNow(scope: MemoryScope, serverUrl: string): Promise<void> {
  try {
    const payload = await pendingPayload(scope);
    if (!payload) return;
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload.body,
    });
    if (!res.ok) return; // deltas stay pending; retried on the next flush
    await settleFlushed(scope, payload.flushed);
  } catch {
    /* deltas stay pending */
  }
}

/** Debounce timers + registered scopes for the pagehide beacon. */
const flushTimers = new Map<string, ReturnType<typeof setTimeout>>();
const beaconScopes = new Map<
  string,
  { scope: MemoryScope; serverUrl: string }
>();
let pagehideRegistered = false;

function registerPagehide(): void {
  if (pagehideRegistered || typeof window === 'undefined') return;
  pagehideRegistered = true;
  window.addEventListener('pagehide', () => {
    for (const { scope, serverUrl } of beaconScopes.values()) {
      // sendBeacon needs a synchronous body; kick off the async read and
      // beacon inside — pagehide usually gives IDB microtasks time to run,
      // and failures just leave deltas pending for the next session.
      void pendingPayload(scope)
        .then((payload) => {
          if (payload && typeof navigator.sendBeacon === 'function') {
            const ok = navigator.sendBeacon(
              serverUrl,
              new Blob([payload.body], { type: 'application/json' })
            );
            if (ok) return settleFlushed(scope, payload.flushed);
          }
          return undefined;
        })
        .catch(() => {});
    }
  });
}

/**
 * Debounce a POST of the scope's pending deltas to `serverUrl`. Also arms a
 * one-time `pagehide` beacon so deltas survive tab closes. Best-effort.
 */
export function scheduleFlush(
  scope: MemoryScope,
  serverUrl: string,
  debounceMs = 5000
): void {
  if (!hasIndexedDB()) return;
  const key = `${scope.userId}|${scope.context}|${serverUrl}`;
  beaconScopes.set(key, { scope, serverUrl });
  registerPagehide();
  const existing = flushTimers.get(key);
  if (existing) clearTimeout(existing);
  flushTimers.set(
    key,
    setTimeout(() => {
      flushTimers.delete(key);
      void flushNow(scope, serverUrl);
    }, debounceMs)
  );
}

/** Reset one (user, context) bucket entirely. Best-effort. */
export async function clearMemory(scope: MemoryScope): Promise<void> {
  if (!hasIndexedDB()) return;
  try {
    await idbDeleteScope(scope);
  } catch {
    /* ignore */
  }
}
