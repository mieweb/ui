/** @module opfs
 *
 * OPFS-backed cache for the wake-word ONNX model files.
 *
 * Per the storage architecture (horner's breakdown): MODEL FILES live in OPFS — app-private, offline,
 * versioned — not the service-worker Cache API (which is for runtime/app assets). We control these models'
 * fetch (onnxruntime-web accepts raw bytes), so OPFS slots cleanly in front of the network:
 *
 *   serve from OPFS if present → else fetch once, store in OPFS, return the bytes.
 *
 * The file key is derived from the full URL, so a hosting move (different base URL) yields a new key and a
 * fresh download — implicit versioning. Falls back to a plain network fetch if OPFS is unavailable.
 */

const DIR = 'ozwell-models';

// Stable, filesystem-safe name from a URL: basename (readable) + a short hash of the FULL url (so two hosts
// sharing a basename don't collide, and a URL change busts the cache).
function fileNameFor(url) {
  const base = (url.split('?')[0].split('/').pop() || 'model').replace(/[^a-zA-Z0-9._-]/g, '_');
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(h, 31) + url.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(36)}-${base}`;
}

function opfsAvailable() {
  return typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.getDirectory === 'function';
}

async function modelsDir() {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(DIR, { create: true });
}

async function fetchBytes(url) {
  const resp = await fetch(url);
  if (!resp || !resp.ok) throw new Error(`[opfs] fetch ${url} → ${resp ? resp.status : 'no response'}`);
  return resp.arrayBuffer();
}

/**
 * Return the model bytes (Uint8Array). OPFS-first; on a miss, fetch once and persist. Any OPFS failure
 * falls back to the network so the detector still loads.
 * @param {string} url - The model URL.
 * @returns {Promise<Uint8Array>}
 */
export async function getModelBytes(url) {
  if (!opfsAvailable()) return new Uint8Array(await fetchBytes(url));

  const name = fileNameFor(url);
  try {
    const dir = await modelsDir();

    // hit?
    try {
      const fh = await dir.getFileHandle(name); // rejects if absent
      const file = await fh.getFile();
      return new Uint8Array(await file.arrayBuffer());
    } catch {
      // miss → fetch + store
    }

    const buf = await fetchBytes(url);
    try {
      const fh = await dir.getFileHandle(name, { create: true });
      const writable = await fh.createWritable();
      await writable.write(buf);
      await writable.close();
      console.log(`[opfs] stored ${name} (${(buf.byteLength / 1e6).toFixed(1)} MB)`);
    } catch (e) {
      console.warn('[opfs] store failed for', name, e); // serve the bytes anyway
    }
    return new Uint8Array(buf);
  } catch (e) {
    console.warn('[opfs] unavailable, falling back to network for', url, e);
    return new Uint8Array(await fetchBytes(url));
  }
}

/** Remove all cached model files (e.g. to force a re-download). Best-effort. */
export async function clearModelCache() {
  if (!opfsAvailable()) return;
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(DIR, { recursive: true });
  } catch (e) {
    console.warn('[opfs] clear failed', e);
  }
}
