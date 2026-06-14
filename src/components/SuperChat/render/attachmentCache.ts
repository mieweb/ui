/**
 * SuperChat attachment cache (opt-in, offline-first).
 *
 * A tiny IndexedDB-backed blob store keyed by **attachment id**. Hosts persist
 * a composer attachment's bytes here once (e.g. on send), embed only the id in
 * the message, and the attachment render plugin resolves a fresh `blob:` URL
 * from the cache at render time — so previously sent media keeps rendering
 * while offline without bloating the stored conversation with base64.
 *
 * Everything degrades gracefully: when IndexedDB is unavailable (SSR, private
 * mode, older browsers) the methods resolve to safe no-op values and callers
 * fall back to any inline `src` they were given.
 */

const DB_NAME = 'mieweb-superchat';
const STORE = 'attachments';
/** Lightweight {id,size,lastAccessed} mirror, read during eviction sweeps. */
const META_STORE = 'attachments_meta';
const DB_VERSION = 2;

/** Default cache budget: evict least-recently-used entries beyond this. */
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024; // 100 MB
let maxBytes = DEFAULT_MAX_BYTES;

/** A blob persisted in the cache, plus its descriptive metadata. */
export interface CachedAttachment {
  /** Stable attachment id (the object-store key). */
  id: string;
  /** Original file name. */
  name: string;
  /** MIME type, e.g. `video/mp4`. */
  type: string;
  /** The raw file bytes. */
  blob: Blob;
  /** Byte length of {@link blob}. */
  size: number;
  /** Epoch ms the entry was written. */
  cachedAt: number;
  /** Epoch ms of the last read (drives LRU eviction). */
  lastAccessed: number;
}

/** Small metadata mirror used to size the cache without loading blobs. */
interface MetaEntry {
  id: string;
  size: number;
  lastAccessed: number;
}

/** Input accepted by {@link AttachmentCache.put}. Provide `blob` or `dataUrl`. */
export interface PutAttachmentInput {
  id: string;
  name: string;
  type: string;
  blob?: Blob;
  /** Base64 (or URL-encoded) `data:` URL; converted to a Blob before storage. */
  dataUrl?: string;
}

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB;
}

function openDB(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return Promise.resolve(null);
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

/** Read the (small) metadata mirror for every cached entry. */
function readAllMeta(db: IDBDatabase): Promise<MetaEntry[]> {
  return new Promise((resolve) => {
    try {
      const req = db
        .transaction(META_STORE, 'readonly')
        .objectStore(META_STORE)
        .getAll();
      req.onsuccess = () => resolve((req.result as MetaEntry[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/** Bump an entry's `lastAccessed` time (best-effort, for LRU ordering). */
async function touch(id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const store = db
        .transaction(META_STORE, 'readwrite')
        .objectStore(META_STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const meta = getReq.result as MetaEntry | undefined;
        if (meta) {
          meta.lastAccessed = Date.now();
          store.put(meta);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    } catch {
      resolve();
    } finally {
      db.close();
    }
  });
}

/** Evict least-recently-used entries until total bytes fit within `maxBytes`. */
async function prune(): Promise<void> {
  const db = await openDB();
  if (!db) return;
  try {
    const metas = await readAllMeta(db);
    let total = metas.reduce((sum, m) => sum + (m.size || 0), 0);
    if (total <= maxBytes) return;

    // Oldest first; always keep at least the single newest entry.
    const byAge = metas
      .slice()
      .sort((a, b) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
    const victims: string[] = [];
    for (const meta of byAge) {
      if (total <= maxBytes) break;
      if (metas.length - victims.length <= 1) break;
      victims.push(meta.id);
      total -= meta.size || 0;
    }
    if (!victims.length) return;

    await new Promise<void>((resolve) => {
      try {
        const t = db.transaction([STORE, META_STORE], 'readwrite');
        const blobs = t.objectStore(STORE);
        const meta = t.objectStore(META_STORE);
        for (const id of victims) {
          blobs.delete(id);
          meta.delete(id);
        }
        t.oncomplete = () => resolve();
        t.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } finally {
    db.close();
  }
}

/** Convert a `data:` URL into a Blob, or `null` if it can't be parsed. */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const data = match[3];
  try {
    if (isBase64) {
      const binary = window.atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new window.Blob([bytes], { type: mime });
    }
    return new window.Blob([decodeURIComponent(data)], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Offline blob store for SuperChat attachments. All methods are safe to call in
 * any environment; without IndexedDB they resolve to no-ops / `undefined`.
 */
export const attachmentCache = {
  /** Whether a persistent IndexedDB store is available in this environment. */
  isAvailable: hasIndexedDB,

  /**
   * Tune the cache. `maxBytes` is the eviction budget (default 100 MB); when a
   * `put` pushes the total past it, least-recently-used entries are dropped
   * until it fits. Set `Infinity` to disable eviction.
   */
  configure(options: { maxBytes?: number }): void {
    if (typeof options.maxBytes === 'number' && options.maxBytes >= 0) {
      maxBytes = options.maxBytes;
    }
  },

  /** Total bytes currently held by the cache (0 when unavailable). */
  async usage(): Promise<number> {
    const db = await openDB();
    if (!db) return 0;
    try {
      const metas = await readAllMeta(db);
      return metas.reduce((sum, m) => sum + (m.size || 0), 0);
    } finally {
      db.close();
    }
  },

  /**
   * Persist an attachment's bytes by id. Pass a `blob` or a `dataUrl`. Resolves
   * to `true` when stored, `false` if unavailable or the input was unusable.
   * Writing past the configured `maxBytes` evicts least-recently-used entries.
   */
  async put(input: PutAttachmentInput): Promise<boolean> {
    const blob =
      input.blob ?? (input.dataUrl ? dataUrlToBlob(input.dataUrl) : null);
    if (!blob) return false;
    const db = await openDB();
    if (!db) return false;
    const now = Date.now();
    const entry: CachedAttachment = {
      id: input.id,
      name: input.name,
      type: input.type || blob.type || 'application/octet-stream',
      blob,
      size: blob.size,
      cachedAt: now,
      lastAccessed: now,
    };
    const stored = await new Promise<boolean>((resolve) => {
      try {
        const t = db.transaction([STORE, META_STORE], 'readwrite');
        t.objectStore(STORE).put(entry);
        t.objectStore(META_STORE).put({
          id: entry.id,
          size: entry.size,
          lastAccessed: now,
        } satisfies MetaEntry);
        t.oncomplete = () => resolve(true);
        t.onerror = () => resolve(false);
      } catch {
        resolve(false);
      } finally {
        db.close();
      }
    });
    if (stored) await prune();
    return stored;
  },

  /** Read a cached attachment (blob + metadata) by id, or `undefined`. */
  async get(id: string): Promise<CachedAttachment | undefined> {
    const db = await openDB();
    if (!db) return undefined;
    const entry = await new Promise<CachedAttachment | undefined>((resolve) => {
      try {
        const req = tx(db, 'readonly').get(id);
        req.onsuccess = () =>
          resolve((req.result as CachedAttachment | undefined) ?? undefined);
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      } finally {
        db.close();
      }
    });
    if (entry) void touch(id);
    return entry;
  },

  /**
   * Resolve a fresh `blob:` object URL for a cached attachment, or `undefined`
   * if it isn't cached. **The caller owns the URL** and must
   * `URL.revokeObjectURL` it when done (the {@link useAttachmentUrl} hook does
   * this automatically).
   */
  async getObjectURL(id: string): Promise<string | undefined> {
    const entry = await attachmentCache.get(id);
    if (!entry) return undefined;
    try {
      return window.URL.createObjectURL(entry.blob);
    } catch {
      return undefined;
    }
  },

  /** Remove a cached attachment by id. */
  async delete(id: string): Promise<void> {
    const db = await openDB();
    if (!db) return;
    await new Promise<void>((resolve) => {
      try {
        const t = db.transaction([STORE, META_STORE], 'readwrite');
        t.objectStore(STORE).delete(id);
        t.objectStore(META_STORE).delete(id);
        t.oncomplete = () => resolve();
        t.onerror = () => resolve();
      } catch {
        resolve();
      } finally {
        db.close();
      }
    });
  },

  /** Drop every cached attachment. */
  async clear(): Promise<void> {
    const db = await openDB();
    if (!db) return;
    await new Promise<void>((resolve) => {
      try {
        const t = db.transaction([STORE, META_STORE], 'readwrite');
        t.objectStore(STORE).clear();
        t.objectStore(META_STORE).clear();
        t.oncomplete = () => resolve();
        t.onerror = () => resolve();
      } catch {
        resolve();
      } finally {
        db.close();
      }
    });
  },
};

export type AttachmentCache = typeof attachmentCache;
