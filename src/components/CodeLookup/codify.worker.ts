/**
 * Web Worker for the offline code lookup: fetches .mcdx shards (with OPFS
 * persistence), holds the parsed typed arrays, answers search queries off the
 * UI thread.
 *
 * Messages in:
 *   { type: 'load', baseUrl: string, domains?: string[] }
 *   { type: 'search', id: number, query: string, limit?: number, domains?: string[] }
 * Messages out:
 *   { type: 'progress', domain, loadedBytes, totalBytes }
 *   { type: 'ready', domains: string[], docCount: number, fromCache: boolean }
 *   { type: 'results', id, query, results, tookMs }
 *   { type: 'error', message }
 *
 * OPFS persistence: shards are cached under /codify-cache/<key>/ where <key>
 * encodes the baseUrl (so /codify/en and /codify/es cache independently).
 * The network manifest.json is always fetched first (no-cache); a cached
 * shard is reused only when the manifest's `builtAt` and `bytes` match the
 * manifest that was cached alongside it — any server-side rebuild invalidates
 * and refetches. If the network is down, the cached manifest + shards serve
 * as an offline fallback. Browsers without OPFS just fetch every time.
 *
 * Full pipeline & design docs:
 *   https://github.com/mieweb/ui/blob/main/src/components/CodeLookup/README.md
 *   (local: ./README.md)
 */
/* global FileSystemDirectoryHandle */
import {
  parseShard,
  searchShards,
  findByCodes,
  type CodifyShard,
} from './engine';

const shards = new Map<string, CodifyShard>();
/** CODETYPE|FULLCODE → order references (from order-sets.json, optional) */
let orderSets: Record<string, string[]> | null = null;

interface ManifestShard {
  domain: string;
  file: string;
  bytes: number;
  docCount: number;
}

interface Manifest {
  version?: number;
  locale?: string;
  builtAt?: string;
  shards: ManifestShard[];
}

// =============================================================================
// OPFS cache
// =============================================================================

/** Directory-safe cache key for a baseUrl. */
function cacheKey(baseUrl: string): string {
  return encodeURIComponent(baseUrl.replace(/\/+$/, ''));
}

async function getCacheDir(
  baseUrl: string,
  create: boolean
): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory)
      return null;
    const root = await navigator.storage.getDirectory();
    const cacheRoot = await root.getDirectoryHandle('codify-cache', { create });
    return await cacheRoot.getDirectoryHandle(cacheKey(baseUrl), { create });
  } catch {
    return null; // OPFS unavailable (private mode, permissions, …)
  }
}

async function readCachedFile(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<ArrayBuffer | null> {
  try {
    const handle = await dir.getFileHandle(name);
    const file = await handle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

/** Minimal OPFS sync-access typing (lib.dom omits worker-only APIs). */
interface SyncAccessHandle {
  truncate(size: number): void;
  write(buffer: Uint8Array, options?: { at: number }): number;
  flush(): void;
  close(): void;
}

async function writeCachedFile(
  dir: FileSystemDirectoryHandle,
  name: string,
  buf: ArrayBuffer
): Promise<void> {
  try {
    const handle = await dir.getFileHandle(name, { create: true });
    // createSyncAccessHandle is the most widely supported OPFS write path in
    // dedicated workers (Safari included).
    const access = await (
      handle as unknown as {
        createSyncAccessHandle(): Promise<SyncAccessHandle>;
      }
    ).createSyncAccessHandle();
    try {
      access.truncate(0);
      access.write(new Uint8Array(buf), { at: 0 });
      access.flush();
    } finally {
      access.close();
    }
  } catch {
    // best-effort cache; ignore quota/permission failures
  }
}

async function readCachedManifest(
  dir: FileSystemDirectoryHandle
): Promise<Manifest | null> {
  const buf = await readCachedFile(dir, 'manifest.json');
  if (!buf) return null;
  try {
    return JSON.parse(new TextDecoder().decode(buf)) as Manifest;
  } catch {
    return null;
  }
}

/**
 * Shards may be stored gzip-compressed (e.g. to stay under a static host's
 * per-file size limit — Cloudflare Pages caps assets at 25 MiB). Detect the
 * gzip magic (`1f 8b`, which never collides with the `MCDX` header) and
 * transparently inflate before parsing. Cached buffers stay compressed, so the
 * OPFS footprint stays small.
 */
async function maybeGunzip(buf: ArrayBuffer): Promise<ArrayBuffer> {
  if (buf.byteLength < 2) return buf;
  const head = new Uint8Array(buf, 0, 2);
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buf;
  const stream = new Response(buf).body!.pipeThrough(
    new DecompressionStream('gzip')
  );
  return await new Response(stream).arrayBuffer();
}

/** A cached shard is valid iff the cached manifest entry matches the fresh one. */
function shardUnchanged(
  fresh: Manifest,
  cached: Manifest | null,
  sh: ManifestShard
): boolean {
  if (!cached) return false;
  if (fresh.builtAt !== cached.builtAt || fresh.version !== cached.version)
    return false;
  const prev = cached.shards.find((c) => c.domain === sh.domain);
  return !!prev && prev.file === sh.file && prev.bytes === sh.bytes;
}

// =============================================================================
// Loading
// =============================================================================

async function load(baseUrl: string, domains?: string[]) {
  const dir = await getCacheDir(baseUrl, true);
  const cachedManifest = dir ? await readCachedManifest(dir) : null;

  // Network-first manifest so a server-side rebuild is noticed immediately;
  // fall back to the cached manifest for offline use.
  let manifest: Manifest | null = null;
  let offline = false;
  try {
    const res = await fetch(`${baseUrl}/manifest.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`manifest: HTTP ${res.status}`);
    manifest = (await res.json()) as Manifest;
  } catch (err) {
    if (cachedManifest) {
      manifest = cachedManifest;
      offline = true;
    } else {
      throw err;
    }
  }

  const wanted = manifest.shards.filter(
    (sh) => !domains || domains.includes(sh.domain)
  );
  const totalBytes = wanted.reduce((n, sh) => n + sh.bytes, 0);
  let loadedBytes = 0;
  let anyFromNetwork = false;

  for (const sh of wanted) {
    let buf: ArrayBuffer | null = null;
    const cacheable =
      dir && (offline || shardUnchanged(manifest, cachedManifest, sh));
    if (cacheable) buf = await readCachedFile(dir, sh.file);
    if (!buf) {
      if (offline) throw new Error(`Offline and ${sh.file} not cached`);
      const res = await fetch(`${baseUrl}/${sh.file}`);
      if (!res.ok) throw new Error(`Failed to fetch ${sh.file}: ${res.status}`);
      buf = await res.arrayBuffer();
      anyFromNetwork = true;
      if (dir) await writeCachedFile(dir, sh.file, buf);
    }
    shards.set(sh.domain, parseShard(await maybeGunzip(buf)));
    loadedBytes += sh.bytes;
    self.postMessage({
      type: 'progress',
      domain: sh.domain,
      loadedBytes,
      totalBytes,
    });
  }

  // Persist the manifest only after all shards it describes were cached, so a
  // partially updated cache can never masquerade as fresh.
  if (dir && !offline && anyFromNetwork) {
    const bytes = new TextEncoder().encode(JSON.stringify(manifest));
    await writeCachedFile(
      dir,
      'manifest.json',
      bytes.buffer.slice(0, bytes.byteLength) as ArrayBuffer
    );
  }

  // Optional order-sets sidecar (occupational programs → required orders).
  // Network first, OPFS-cached for offline; absence is not an error.
  try {
    let osBuf: ArrayBuffer | null = null;
    if (!offline) {
      const res = await fetch(`${baseUrl}/order-sets.json`, {
        cache: 'no-cache',
      });
      if (res.ok) {
        osBuf = await res.arrayBuffer();
        if (dir) await writeCachedFile(dir, 'order-sets.json', osBuf);
      }
    }
    if (!osBuf && dir) osBuf = await readCachedFile(dir, 'order-sets.json');
    if (osBuf) {
      const parsed = JSON.parse(new TextDecoder().decode(osBuf)) as {
        sets?: Record<string, string[]>;
      };
      orderSets = parsed.sets ?? null;
    }
  } catch {
    orderSets = null;
  }

  self.postMessage({
    type: 'ready',
    domains: [...shards.keys()],
    docCount: [...shards.values()].reduce((n, s) => n + s.docCount, 0),
    fromCache: !anyFromNetwork,
  });
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === 'load') {
    load(msg.baseUrl, msg.domains).catch((err) =>
      self.postMessage({ type: 'error', message: String(err?.message ?? err) })
    );
  } else if (msg.type === 'search') {
    const t0 = performance.now();
    const active = msg.domains
      ? [...shards.values()].filter((s) => msg.domains.includes(s.domain))
      : [...shards.values()];
    const results = searchShards(
      active,
      msg.query,
      msg.limit ?? 20,
      msg.collapse === true
    );
    self.postMessage({
      type: 'results',
      id: msg.id,
      query: msg.query,
      results,
      tookMs: performance.now() - t0,
    });
  } else if (msg.type === 'orders') {
    // Resolve an order set (e.g. an OSHA program's required orders) into
    // labeled results from whichever shards are loaded.
    const t0 = performance.now();
    const keys = orderSets?.[msg.key] ?? [];
    const results = findByCodes([...shards.values()], keys);
    self.postMessage({
      type: 'results',
      id: msg.id,
      query: msg.key,
      results,
      tookMs: performance.now() - t0,
    });
  }
};
