/**
 * IndexedDB store for on-device voiceprints (enrollment vectors), replacing localStorage for this data.
 *
 * Why IndexedDB and not localStorage: it's asynchronous (off the main thread), stores `Float32Array`
 * natively via structured clone (no JSON-stringifying embeddings into bloated number arrays), and isn't
 * capped at ~5 MB. Why not OPFS: these are small *structured records* keyed by id, not large files —
 * IndexedDB is the right tool; OPFS is for the big model files.
 *
 * One object store, keyed by a string id; values are any structured-cloneable object, so `Float32Array`s
 * survive the round-trip intact. On first read of a key it migrates a legacy localStorage value (if a
 * parser is supplied) and then clears it.
 */

const DB_NAME = 'ozwell-voice';
const STORE = 'voiceprints';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(key: string): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => { resolve(req.result as T | undefined); db.close(); };
        req.onerror = () => { reject(req.error); db.close(); };
      }),
  );
}

function idbSet(key: string, value: unknown): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => { resolve(); db.close(); };
        tx.onerror = () => { reject(tx.error); db.close(); };
      }),
  );
}

function idbDel(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => { resolve(); db.close(); };
        tx.onerror = () => { reject(tx.error); db.close(); };
      }),
  );
}

/**
 * Read a voiceprint record. If IndexedDB has nothing for `key` but localStorage does, migrate it via
 * `migrateLegacy` (parse the old JSON string → the new shape), persist it to IndexedDB, and clear the
 * localStorage copy. Returns `undefined` if neither has it. Never throws (best-effort storage).
 */
export async function getVoiceprints<T>(key: string, migrateLegacy?: (raw: string) => T): Promise<T | undefined> {
  try {
    const existing = await idbGet<T>(key);
    if (existing !== undefined) return existing;
    if (migrateLegacy) {
      let raw: string | null = null;
      try { raw = localStorage.getItem(key); } catch { /* ignore */ }
      if (raw != null) {
        let migrated: T;
        try {
          migrated = migrateLegacy(raw);
        } catch {
          // Corrupt legacy value — drop it so we don't retry the failing migration on every load.
          try { localStorage.removeItem(key); } catch { /* ignore */ }
          return undefined;
        }
        try { await idbSet(key, migrated); } catch { /* persist is best-effort; still return the migrated value */ }
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        return migrated;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** Persist a voiceprint record (Float32Arrays stored natively). Best-effort — resolves even on failure. */
export async function setVoiceprints(key: string, value: unknown): Promise<void> {
  try { await idbSet(key, value); } catch { /* best-effort */ }
}

/** Remove a voiceprint record (and any stale localStorage copy). */
export async function clearVoiceprints(key: string): Promise<void> {
  try { await idbDel(key); } catch { /* ignore */ }
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// --- WHAT phrase-prints: per-phrase wake-embedding templates (the WHAT gate). Previously each story kept
// its own copy of these load/save helpers against localStorage; centralized here on IndexedDB. ---
const WHAT_KEY = 'ozwellWhatPrints';

// Legacy localStorage format: JSON `{ phrase: number[][] }`. New IndexedDB format stores Float32Array[]
// natively, so migration just rehydrates the number arrays once.
function parseLegacyWhat(raw: string): Record<string, Float32Array[]> {
  let o: Record<string, number[][]>;
  try { o = (JSON.parse(raw || '{}') || {}) as Record<string, number[][]>; } catch { return {}; }
  const out: Record<string, Float32Array[]> = {};
  for (const k in o) out[k] = (o[k] || []).map((a) => Float32Array.from(a));
  return out;
}

export function loadWhatPrints(): Promise<Record<string, Float32Array[]>> {
  return getVoiceprints<Record<string, Float32Array[]>>(WHAT_KEY, parseLegacyWhat).then((v) => v ?? {});
}

export function saveWhatPrints(map: Record<string, Float32Array[]>): Promise<void> {
  return setVoiceprints(WHAT_KEY, map);
}

export function clearWhatPrints(): Promise<void> {
  return clearVoiceprints(WHAT_KEY);
}
