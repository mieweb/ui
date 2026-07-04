/**
 * Web Worker for the offline code lookup: fetches .mcdx shards, holds the
 * parsed typed arrays, answers search queries off the UI thread.
 *
 * Messages in:
 *   { type: 'load', baseUrl: string, domains?: string[] }
 *   { type: 'search', id: number, query: string, limit?: number, domains?: string[] }
 * Messages out:
 *   { type: 'progress', domain, loadedBytes, totalBytes }
 *   { type: 'ready', domains: string[], docCount: number }
 *   { type: 'results', id, query, results, tookMs }
 *   { type: 'error', message }
 */
import { parseShard, searchShards, type CodifyShard } from './engine';

const shards = new Map<string, CodifyShard>();

interface Manifest {
  shards: { domain: string; file: string; bytes: number; docCount: number }[];
}

async function load(baseUrl: string, domains?: string[]) {
  const manifest = (await (await fetch(`${baseUrl}/manifest.json`)).json()) as Manifest;
  const wanted = manifest.shards.filter(
    (sh) => !domains || domains.includes(sh.domain)
  );
  const totalBytes = wanted.reduce((n, sh) => n + sh.bytes, 0);
  let loadedBytes = 0;
  for (const sh of wanted) {
    const res = await fetch(`${baseUrl}/${sh.file}`);
    if (!res.ok) throw new Error(`Failed to fetch ${sh.file}: ${res.status}`);
    const buf = await res.arrayBuffer();
    shards.set(sh.domain, parseShard(buf));
    loadedBytes += sh.bytes;
    self.postMessage({ type: 'progress', domain: sh.domain, loadedBytes, totalBytes });
  }
  self.postMessage({
    type: 'ready',
    domains: [...shards.keys()],
    docCount: [...shards.values()].reduce((n, s) => n + s.docCount, 0),
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
    const results = searchShards(active, msg.query, msg.limit ?? 20);
    self.postMessage({
      type: 'results',
      id: msg.id,
      query: msg.query,
      results,
      tookMs: performance.now() - t0,
    });
  }
};
