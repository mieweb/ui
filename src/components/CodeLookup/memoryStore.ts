/**
 * CodeLookup "memory" — per-(user, context) usage counts for picked codes,
 * powering the "Frequently used" empty-query picklist.
 *
 * `serverUrl` is the source of truth; the local store (see `memoryBackend`) is
 * a cache whose durability is the device's call — IndexedDB on a trusted
 * machine, RAM on a kiosk. Two gates must both open before anything is kept:
 * a real `userId` (never a shared 'anonymous' bucket) and a storage mode.
 *
 * Sync:
 *  - `syncFromServer` GETs `{serverUrl}?user=&context=` (at most once per
 *    minute per scope) and takes the server's counts as authoritative.
 *  - `scheduleFlush` debounces a POST of accumulated count deltas
 *    (`{user, context, deltas:[…]}`); a `pagehide` listener flushes any
 *    remaining deltas via `navigator.sendBeacon`.
 *
 * `count` is therefore "the server's total, plus our unflushed picks":
 * `pendingDelta` is the only locally-authoritative field, so a server value
 * can move a count *down* without ever losing a pick that hasn't landed yet.
 *
 * The server must take identity from the session, not from the `user`
 * parameter — see the protocol notes in README.md.
 */

import type { CodifyResult } from './engine';
import { normalize } from './engine';
import {
  memGet,
  memSet,
  memGetAll,
  memDelete,
  memPurgeAll,
  memoryAvailable,
  getMemoryStorage,
} from './memoryBackend';

export {
  setMemoryStorage,
  getMemoryStorage,
  type MemoryStorage,
} from './memoryBackend';

// =============================================================================
// Types
// =============================================================================

/** Identifies one memory bucket: counts never leak across users or contexts. */
export interface MemoryScope {
  /** Signed-in user id. Placeholders like 'anonymous' disable memory. */
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
  /** The server's total plus `pendingDelta` (see the module doc). */
  count: number;
  /** Epoch ms of the most recent pick (count-tie ordering). */
  lastUsed: number;
  /** Picks not yet flushed to the server — the only local truth. */
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
// Keys and gates
// =============================================================================

function entryKey(scope: MemoryScope, fullid: string): string {
  return `${scope.userId}|${scope.context}|${fullid}`;
}

/** Prefix covering every entry in a scope (keys are `user|context|fullid`). */
function scopePrefix(scope: MemoryScope): string {
  return `${scope.userId}|${scope.context}|`;
}

/**
 * Placeholder ids that mean "nobody is signed in". They would otherwise be
 * valid bucket keys, pooling every kiosk visitor into one shared picklist.
 */
const UNIDENTIFIED = new Set(['', 'anonymous', 'guest', 'kiosk', 'unknown']);

function isIdentified(scope: MemoryScope): boolean {
  return (
    !!scope.userId &&
    !!scope.context &&
    !UNIDENTIFIED.has(scope.userId.trim().toLowerCase())
  );
}

/** Both gates: somewhere to store it, and someone to store it for. */
function memoryOn(scope: MemoryScope): boolean {
  return memoryAvailable() && isIdentified(scope);
}

function getScope(scope: MemoryScope): Promise<MemoryEntry[]> {
  return memGetAll(scopePrefix(scope));
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
  if (!memoryOn(scope)) return;
  try {
    const key = entryKey(scope, result.fullid);
    const prev = await memGet(key);
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
    await memSet(key, entry);
  } catch {
    /* best-effort */
  }
}

/**
 * The scope's most-used codes: `count` desc, `lastUsed` desc tiebreak,
 * capped at `limit`. Resolves `[]` when either gate is closed.
 */
export async function getTopCodes(
  scope: MemoryScope,
  limit = 8
): Promise<MemoryEntry[]> {
  if (!memoryOn(scope)) return [];
  try {
    const entries = await getScope(scope);
    entries.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
    return entries.slice(0, limit);
  } catch {
    return [];
  }
}

/** Last server sync per `user|context|serverUrl`, for TTL revalidation. */
const lastSynced = new Map<string, number>();
const REVALIDATE_MS = 60_000;

/**
 * Every stored entry, for one bucket or (no scope) all of them. Resolves `[]`
 * when nothing is stored locally.
 */
export async function getAllEntries(
  scope?: MemoryScope
): Promise<MemoryEntry[]> {
  if (scope ? !memoryOn(scope) : !memoryAvailable()) return [];
  try {
    return scope ? await getScope(scope) : await memGetAll();
  } catch {
    return [];
  }
}

/**
 * Merge entries into the store, preserving local `pendingDelta`. `override`
 * retargets every entry into one bucket (importing a curated set for the
 * current user). `authoritative` marks the entries as the server's truth, so
 * counts may move down; otherwise the larger count wins (YAML import, which
 * must be idempotent). Returns the number merged; best-effort.
 */
export async function mergeEntries(
  entries: readonly MemoryEntry[],
  override?: MemoryScope,
  { authoritative = false }: { authoritative?: boolean } = {}
): Promise<number> {
  if (!memoryAvailable()) return 0;
  let merged = 0;
  for (const e of entries) {
    try {
      const scope = override ?? { userId: e.userId, context: e.context };
      if (!isIdentified(scope)) continue;
      const key = entryKey(scope, e.fullid);
      const prev = await memGet(key);
      const pendingDelta = prev?.pendingDelta ?? 0;
      await memSet(key, {
        ...e,
        userId: scope.userId,
        context: scope.context,
        label: e.label || (prev?.label ?? ''),
        // A flush in flight double-counts until the next sync corrects it.
        count: authoritative
          ? e.count + pendingDelta
          : Math.max(prev?.count ?? 0, e.count),
        lastUsed: Math.max(prev?.lastUsed ?? 0, e.lastUsed),
        pendingDelta,
      });
      merged++;
    } catch {
      /* skip the bad row, keep going */
    }
  }
  return merged;
}

/**
 * Refresh the scope from the server (at most once per `REVALIDATE_MS`):
 * `GET {serverUrl}?user=…&context=…` → `ServerCount[]`, taken as authoritative.
 * Best-effort — a failed sync leaves the cache in place.
 */
export async function syncFromServer(
  scope: MemoryScope,
  serverUrl: string
): Promise<void> {
  if (!memoryOn(scope)) return;
  const key = `${scope.userId}|${scope.context}|${serverUrl}`;
  const last = lastSynced.get(key);
  if (last != null && Date.now() - last < REVALIDATE_MS) return;
  lastSynced.set(key, Date.now());
  try {
    const url = `${serverUrl}?user=${encodeURIComponent(scope.userId)}&context=${encodeURIComponent(scope.context)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`memory sync failed: ${res.status}`);
    const rows = (await res.json()) as ServerCount[];
    if (!Array.isArray(rows)) return;
    await mergeEntries(
      rows
        .filter((row) => row && typeof row.fullid === 'string')
        .map((row) => ({
          userId: scope.userId,
          context: scope.context,
          fullid: row.fullid,
          label: row.label ?? '',
          codetype: row.codetype ?? '',
          fullcode: row.fullcode ?? '',
          domain: row.domain ?? '',
          count: typeof row.count === 'number' ? row.count : 0,
          lastUsed: 0,
          pendingDelta: 0,
        })),
      scope,
      { authoritative: true }
    );
  } catch {
    // Retry on the next mount past the TTL; keep serving the cache.
    lastSynced.delete(key);
  }
}

/** Collect the scope's pending deltas as a flush payload (or null if none). */
async function pendingPayload(scope: MemoryScope): Promise<{
  body: string;
  flushed: Map<string, number>;
} | null> {
  const entries = await getScope(scope);
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
    const entry = await memGet(key);
    if (!entry) continue;
    await memSet(key, {
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
      credentials: 'include',
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
 * one-time `pagehide` beacon so deltas survive tab closes. Session storage
 * flushes fast by default — there is no durable cache to retry from.
 */
export function scheduleFlush(
  scope: MemoryScope,
  serverUrl: string,
  debounceMs = getMemoryStorage() === 'session' ? 500 : 5000
): void {
  if (!memoryOn(scope)) return;
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

/**
 * Remembered entries whose label matches `query` under the same word-prefix
 * rule as the index search ("met for" → *metformin*), preserving the caller's
 * order (`getTopCodes` — count desc). Empty query → no matches.
 */
export function matchMemory(
  entries: MemoryEntry[],
  query: string
): MemoryEntry[] {
  const tokens = normalize(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  return entries.filter((e) => {
    const words = normalize(e.label).split(' ').filter(Boolean);
    return tokens.every((t) => words.some((w) => w.startsWith(t)));
  });
}

/** Reset one (user, context) bucket entirely. Best-effort. */
export async function clearMemory(scope: MemoryScope): Promise<void> {
  try {
    await memDelete(scopePrefix(scope));
  } catch {
    /* ignore */
  }
}

/**
 * Wipe every bucket in this browser — for logout, kiosk session reset, or a
 * device downgraded from trusted to public.
 */
export async function clearAllMemory(): Promise<void> {
  lastSynced.clear();
  try {
    await memPurgeAll();
  } catch {
    /* ignore */
  }
}
