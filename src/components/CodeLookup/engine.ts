/**
 * Offline MedicalCodify search engine — parses .mcdx shards (built by
 * scripts/codify/build-index.mjs; see that file for the binary layout) and
 * runs multi-word-prefix BM25-ish scoring with alias and typo support.
 *
 * Runs on the main thread or inside a worker (no DOM access).
 */

// =============================================================================
// Types
// =============================================================================

export interface CodifyShard {
  domain: string;
  docCount: number;
  tokenCount: number;
  codetypes: string[];
  tokenBlob: Uint8Array;
  tokenOffsets: Uint32Array;
  postStart: Uint32Array;
  postings: Uint32Array;
  labelBlob: Uint8Array;
  labelOffsets: Uint32Array;
  codeBlob: Uint8Array;
  codeOffsets: Uint32Array;
  fullidBlob: Uint8Array;
  fullidOffsets: Uint32Array;
  docCodetype: Uint8Array;
  docLen: Uint8Array;
  // reusable per-query scratch buffers
  scoreBuf: Float32Array;
  maskBuf: Uint8Array;
  touched: Uint32Array;
}

export interface CodifyResult {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
  domain: string;
  score: number;
  /** true when the match came (partly) from an alias token */
  viaAlias: boolean;
}

// =============================================================================
// Normalization — keep in sync with scripts/codify/build-index.mjs
// =============================================================================

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// =============================================================================
// Shard parsing
// =============================================================================

const MAGIC = 0x4d434458; // 'MCDX'

export function parseShard(buf: ArrayBuffer): CodifyShard {
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== MAGIC) throw new Error('Bad shard magic');
  if (view.getUint32(4, true) !== 1) throw new Error('Unsupported shard version');
  const metaLen = view.getUint32(8, true);
  const meta = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buf, 12, metaLen))
  ) as {
    domain: string;
    docCount: number;
    tokenCount: number;
    codetypes: string[];
    sections: Record<string, [number, number]>;
  };
  const u8 = (name: string) => {
    const [off, len] = meta.sections[name];
    return new Uint8Array(buf, off, len);
  };
  const u32 = (name: string) => {
    const [off, len] = meta.sections[name];
    return new Uint32Array(buf, off, len >>> 2);
  };
  return {
    domain: meta.domain,
    docCount: meta.docCount,
    tokenCount: meta.tokenCount,
    codetypes: meta.codetypes,
    tokenBlob: u8('tokenBlob'),
    tokenOffsets: u32('tokenOffsets'),
    postStart: u32('postStart'),
    postings: u32('postings'),
    labelBlob: u8('labelBlob'),
    labelOffsets: u32('labelOffsets'),
    codeBlob: u8('codeBlob'),
    codeOffsets: u32('codeOffsets'),
    fullidBlob: u8('fullidBlob'),
    fullidOffsets: u32('fullidOffsets'),
    docCodetype: u8('docCodetype'),
    docLen: u8('docLen'),
    scoreBuf: new Float32Array(meta.docCount),
    maskBuf: new Uint8Array(meta.docCount),
    touched: new Uint32Array(meta.docCount),
  };
}

// =============================================================================
// Dictionary access
// =============================================================================

const td = new TextDecoder();

function tokenAt(s: CodifyShard, i: number): string {
  return td.decode(s.tokenBlob.subarray(s.tokenOffsets[i], s.tokenOffsets[i + 1]));
}

/** First token index whose token is >= q (lexicographic). */
function lowerBound(s: CodifyShard, q: string): number {
  let lo = 0;
  let hi = s.tokenCount;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (tokenAt(s, mid) < q) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Token-id range [lo, hi) whose tokens start with `prefix`. */
function prefixRange(s: CodifyShard, prefix: string): [number, number] {
  const lo = lowerBound(s, prefix);
  const hi = lowerBound(s, prefix + '\uffff');
  return [lo, hi];
}

// =============================================================================
// Fuzzy fallback — bounded edit-distance-1 scan (typos like "congestve")
// =============================================================================

/** Damerau-Levenshtein distance <= 1 check (substitution/insert/delete/transpose). */
function within1(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (i === la && i === lb) return true;
  if (la === lb) {
    // substitution or transposition at i
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return (
      i + 1 < la &&
      a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2)
    );
  }
  // insertion/deletion
  const [shorter, longer] = la < lb ? [a, b] : [b, a];
  return shorter.slice(i) === longer.slice(i + 1);
}

/**
 * Find dictionary tokens whose prefix of length q.length is within edit
 * distance 1 of q. Linear scan with cheap filters — a few ms on ~40K tokens.
 */
function fuzzyCandidates(s: CodifyShard, q: string, max: number): number[] {
  const out: number[] = [];
  const qLen = q.length;
  for (let i = 0; i < s.tokenCount && out.length < max; i++) {
    const tLen = s.tokenOffsets[i + 1] - s.tokenOffsets[i];
    if (tLen < qLen - 1) continue;
    const tok = tokenAt(s, i);
    const pfx = tok.length > qLen + 1 ? tok.slice(0, qLen + 1) : tok;
    if (within1(q, pfx) || within1(q, tok.slice(0, qLen))) out.push(i);
  }
  return out;
}

// =============================================================================
// Search
// =============================================================================

const MAX_EXPANSIONS = 128;
const MAX_QUERY_TOKENS = 8;

export function searchShards(
  shards: CodifyShard[],
  query: string,
  limit = 20
): CodifyResult[] {
  const qTokens = normalize(query).split(' ').filter(Boolean).slice(0, MAX_QUERY_TOKENS);
  if (qTokens.length === 0) return [];
  const results: CodifyResult[] = [];

  for (const s of shards) {
    searchShard(s, qTokens, results, limit);
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function searchShard(
  s: CodifyShard,
  qTokens: string[],
  out: CodifyResult[],
  limit: number
) {
  const { scoreBuf, maskBuf } = s;
  const N = s.docCount;
  const fullMask = (1 << qTokens.length) - 1;
  let touchedCount = 0;
  let aliasSeen = false;

  for (let qi = 0; qi < qTokens.length; qi++) {
    const q = qTokens[qi];
    const bit = 1 << qi;
    let [lo, hi] = prefixRange(s, q);
    let penalty = 1;
    let expansions: number[] | null = null;
    if (lo >= hi && q.length >= 3) {
      expansions = fuzzyCandidates(s, q, 8);
      penalty = 0.6; // typo correction is worth less than a real prefix hit
      if (expansions.length === 0) return; // AND semantics: token matched nothing
    } else if (lo >= hi) {
      return;
    }

    const count = expansions ? expansions.length : Math.min(hi - lo, MAX_EXPANSIONS);
    for (let e = 0; e < count; e++) {
      const t = expansions ? expansions[e] : lo + e;
      const df = s.postStart[t + 1] - s.postStart[t];
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const tLen = s.tokenOffsets[t + 1] - s.tokenOffsets[t];
      const completeness = q.length / tLen; // full-token typed > partial prefix
      const w = idf * (0.5 + 0.5 * Math.min(1, completeness)) * penalty;
      const start = s.postStart[t];
      const end = s.postStart[t + 1];
      for (let p = start; p < end; p++) {
        const v = s.postings[p];
        const d = v >>> 1;
        const alias = v & 1;
        if (maskBuf[d] & bit) continue; // best (shortest) expansion wins
        if (qi > 0 && maskBuf[d] === 0) continue; // can't complete the AND
        if (maskBuf[d] === 0) s.touched[touchedCount++] = d;
        maskBuf[d] |= bit;
        scoreBuf[d] += alias ? w * 0.85 : w;
        if (alias) aliasSeen = true;
      }
    }
  }

  // collect matches, then reset scratch buffers
  for (let i = 0; i < touchedCount; i++) {
    const d = s.touched[i];
    if (maskBuf[d] === fullMask) {
      const lenNorm = 1 / (1 + 0.25 * Math.max(0, s.docLen[d] - 1));
      const score = scoreBuf[d] * (0.6 + 0.4 * lenNorm);
      pushResult(out, s, d, score, aliasSeen, limit * 3);
    }
    maskBuf[d] = 0;
    scoreBuf[d] = 0;
  }
}

function pushResult(
  out: CodifyResult[],
  s: CodifyShard,
  d: number,
  score: number,
  viaAlias: boolean,
  cap: number
) {
  // keep the array bounded: replace the current minimum once at capacity
  if (out.length >= cap) {
    let minI = 0;
    for (let i = 1; i < out.length; i++) {
      if (out[i].score < out[minI].score) minI = i;
    }
    if (out[minI].score >= score) return;
    out.splice(minI, 1);
  }
  out.push({
    fullid: td.decode(s.fullidBlob.subarray(s.fullidOffsets[d], s.fullidOffsets[d + 1])),
    label: td.decode(s.labelBlob.subarray(s.labelOffsets[d], s.labelOffsets[d + 1])),
    codetype: s.codetypes[s.docCodetype[d]],
    fullcode: td.decode(s.codeBlob.subarray(s.codeOffsets[d], s.codeOffsets[d + 1])),
    domain: s.domain,
    score,
    viaAlias,
  });
}
