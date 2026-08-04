/**
 * Where CodeLookup memory is cached locally — the device-trust switch.
 *
 * The server is the source of truth; this is only the cache in front of it.
 * Which cache you get is a property of the *machine*, declared once by the app
 * (see `CodeLookupProvider`'s `memory.storage`) and never guessed, because no
 * browser signal tells you a kiosk from a workstation:
 *
 *  - `'local'`   IndexedDB — a per-user machine secured by a browser login.
 *  - `'session'` a Map that dies with the tab — public/shared kiosks. Default,
 *                so forgetting to configure costs a round-trip, not a leak.
 *  - `'none'`    reads are empty, writes are no-ops.
 *
 * Keys are opaque strings; `prefix` scans stand in for IndexedDB key ranges so
 * both backends implement the same five operations.
 */

import type { MemoryEntry } from './memoryStore';

export type MemoryStorage = 'local' | 'session' | 'none';

let storage: MemoryStorage = 'session';

/** Declare the device's trust level (app-wide — one machine, one answer). */
export function setMemoryStorage(mode: MemoryStorage): void {
  storage = mode;
}

export function getMemoryStorage(): MemoryStorage {
  return storage;
}

// =============================================================================
// IndexedDB backend ('local')
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

function prefixRange(prefix: string): IDBKeyRange {
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

function idbGetAll(prefix?: string): Promise<MemoryEntry[]> {
  return openDb().then(
    (db) =>
      new Promise<MemoryEntry[]>((resolve, reject) => {
        const req = db
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .getAll(prefix == null ? undefined : prefixRange(prefix));
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

function idbDelete(prefix?: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        if (prefix == null) store.clear();
        else store.delete(prefixRange(prefix));
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
// Session backend ('session') — never touches the disk
// =============================================================================

const sessionEntries = new Map<string, MemoryEntry>();

// =============================================================================
// Dispatch
// =============================================================================

function idbActive(): boolean {
  return storage === 'local' && hasIndexedDB();
}

/**
 * True only in a real browser tab. Session memory must never run server-side:
 * in SSR/Node the module-level Map outlives the request and would bleed one
 * user's codes into another's render (the 'local' path is already safe because
 * IndexedDB doesn't exist there).
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * False when nothing can be stored: 'none', 'local' without IndexedDB, or
 * 'session' outside a browser (fail closed — see `isBrowser`).
 */
export function memoryAvailable(): boolean {
  return (storage === 'session' && isBrowser()) || idbActive();
}

export async function memGet(key: string): Promise<MemoryEntry | undefined> {
  if (!memoryAvailable()) return undefined;
  return idbActive() ? idbGet(key) : sessionEntries.get(key);
}

export async function memSet(key: string, value: MemoryEntry): Promise<void> {
  if (!memoryAvailable()) return;
  if (idbActive()) await idbSet(key, value);
  else sessionEntries.set(key, value);
}

export async function memGetAll(prefix?: string): Promise<MemoryEntry[]> {
  if (!memoryAvailable()) return [];
  if (idbActive()) return idbGetAll(prefix);
  const all = [...sessionEntries.entries()];
  return (prefix == null ? all : all.filter(([k]) => k.startsWith(prefix))).map(
    ([, v]) => v
  );
}

export async function memDelete(prefix?: string): Promise<void> {
  if (!memoryAvailable()) return;
  if (idbActive()) {
    await idbDelete(prefix);
    return;
  }
  if (prefix == null) sessionEntries.clear();
  else
    for (const key of [...sessionEntries.keys()])
      if (key.startsWith(prefix)) sessionEntries.delete(key);
}

/**
 * Wipe both caches whatever the current mode is — a device downgraded from
 * trusted to public still has to erase what it wrote while it was trusted.
 */
export async function memPurgeAll(): Promise<void> {
  sessionEntries.clear();
  if (hasIndexedDB()) await idbDelete();
}
