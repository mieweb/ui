#!/usr/bin/env node
/**
 * Build the offline code-lookup index shards from the extracted TSV.
 *
 * Usage:
 *   node scripts/codify/build-index.mjs [--in scripts/codify/data/codify.tsv] [--out .storybook/public/codify]
 *
 * Emits one binary shard per clinical domain plus a manifest.json.
 *
 * Shard binary layout (little-endian):
 *   u32 magic 'MCDX' (0x4d434458), u32 version=1, u32 metaLen, meta JSON
 *   then 4-byte-aligned sections at offsets recorded in meta.sections:
 *     tokenBlob    utf8 of all tokens, sorted ascending
 *     tokenOffsets u32[tokenCount+1]
 *     postStart    u32[tokenCount+1]         posting-list start per token
 *     postings     u32[postingsCount]        docId<<1 | aliasFlag
 *     labelBlob    utf8, labelOffsets  u32[docCount+1]
 *     codeBlob     utf8, codeOffsets   u32[docCount+1]
 *     fullidBlob   utf8, fullidOffsets u32[docCount+1]
 *     docCodetype  u8[docCount]              index into meta.codetypes
 *     docLen       u8[docCount]              token count (BM25 length norm)
 *
 * NOTE: normalize() must stay in sync with src/components/CodeLookup/engine.ts
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const inFile = opt('in', 'scripts/codify/data/codify.tsv');
const outDir = opt('out', '.storybook/public/codify');

const DOMAINS = {
  condition: ['ICD10', 'SNOMED US'],
  med: ['RxNORM', 'FDB', 'FDB MEDNAME'],
  lab: ['LOINC', 'LOINC Hierarchy', 'Quest Order', 'LabCorp Order'],
  procedure: ['ICD10PCS', 'HCPCS'],
  vaccine: ['CVX'],
};
const domainOf = {};
for (const [d, types] of Object.entries(DOMAINS)) {
  for (const t of types) domainOf[t] = d;
}

/** Keep in sync with engine.ts */
function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ---- load aliases -----------------------------------------------------------
const aliasCfg = JSON.parse(
  readFileSync(new URL('./aliases.json', import.meta.url), 'utf8')
);
const aliasGroups = aliasCfg.groups.map((group) => {
  const phrases = group.map(normalize);
  return {
    phrases,
    singleTokens: phrases.filter((p) => p && !p.includes(' ')),
  };
});

// ---- read TSV ---------------------------------------------------------------
console.error(`Reading ${inFile}…`);
const tsv = readFileSync(inFile, 'utf8');
const shards = {};
for (const d of Object.keys(DOMAINS)) {
  shards[d] = {
    docs: [], // { fullid, codetype, fullcode, label, norm }
    codetypes: [],
    codetypeIdx: new Map(),
  };
}

let rows = 0;
let start = 0;
while (start < tsv.length) {
  let end = tsv.indexOf('\n', start);
  if (end === -1) end = tsv.length;
  const line = tsv.slice(start, end);
  start = end + 1;
  if (!line) continue;
  const t1 = line.indexOf('\t');
  const t2 = line.indexOf('\t', t1 + 1);
  const t3 = line.indexOf('\t', t2 + 1);
  if (t1 < 0 || t2 < 0 || t3 < 0) continue;
  const fullid = line.slice(0, t1);
  const codetype = line.slice(t1 + 1, t2);
  const fullcode = line.slice(t2 + 1, t3);
  const label = line.slice(t3 + 1);
  const domain = domainOf[codetype];
  if (!domain) continue;
  const shard = shards[domain];
  let ct = shard.codetypeIdx.get(codetype);
  if (ct === undefined) {
    ct = shard.codetypes.length;
    shard.codetypes.push(codetype);
    shard.codetypeIdx.set(codetype, ct);
  }
  shard.docs.push({ fullid, ct, fullcode, label });
  rows++;
}
console.error(`Parsed ${rows} rows`);

// ---- build & write shards ---------------------------------------------------
mkdirSync(outDir, { recursive: true });
const enc = new TextEncoder();
const manifest = { version: 1, builtAt: new Date().toISOString(), shards: [] };

const align4 = (n) => (n + 3) & ~3;

function u32(arr) {
  return Buffer.from(new Uint32Array(arr).buffer);
}

for (const [domain, shard] of Object.entries(shards)) {
  const { docs, codetypes } = shard;
  if (docs.length === 0) continue;
  const t0 = Date.now();

  // token -> postings (docId<<1 | aliasFlag), deduped per doc
  const tokenMap = new Map();
  const docLens = new Uint8Array(docs.length);

  for (let d = 0; d < docs.length; d++) {
    const norm = normalize(docs[d].label);
    const tokens = norm ? norm.split(' ') : [];
    const seen = new Set();
    for (const tok of tokens) {
      if (!tok || seen.has(tok)) continue;
      seen.add(tok);
      let list = tokenMap.get(tok);
      if (!list) tokenMap.set(tok, (list = []));
      list.push(d << 1);
    }
    docLens[d] = Math.min(255, tokens.length);

    // alias expansion
    const padded = ` ${norm} `;
    for (const g of aliasGroups) {
      let hit = false;
      for (const p of g.phrases) {
        if (p.includes(' ') ? padded.includes(` ${p} `) : seen.has(p)) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
      for (const tok of g.singleTokens) {
        if (seen.has(tok)) continue;
        seen.add(tok);
        let list = tokenMap.get(tok);
        if (!list) tokenMap.set(tok, (list = []));
        list.push((d << 1) | 1);
      }
    }
  }

  const tokens = [...tokenMap.keys()].sort();
  const tokenOffsets = new Uint32Array(tokens.length + 1);
  const postStart = new Uint32Array(tokens.length + 1);
  let tokenBytes = 0;
  let postingsCount = 0;
  const tokenEncoded = tokens.map((t) => enc.encode(t));
  for (let i = 0; i < tokens.length; i++) {
    tokenOffsets[i] = tokenBytes;
    tokenBytes += tokenEncoded[i].length;
    postStart[i] = postingsCount;
    postingsCount += tokenMap.get(tokens[i]).length;
  }
  tokenOffsets[tokens.length] = tokenBytes;
  postStart[tokens.length] = postingsCount;

  const tokenBlob = Buffer.concat(tokenEncoded, tokenBytes);
  const postings = new Uint32Array(postingsCount);
  {
    let p = 0;
    for (const t of tokens) {
      const list = tokenMap.get(t);
      for (const v of list) postings[p++] = v;
    }
  }

  const packStrings = (getter) => {
    const encoded = docs.map((doc) => enc.encode(getter(doc)));
    const offsets = new Uint32Array(docs.length + 1);
    let n = 0;
    for (let i = 0; i < docs.length; i++) {
      offsets[i] = n;
      n += encoded[i].length;
    }
    offsets[docs.length] = n;
    return { blob: Buffer.concat(encoded, n), offsets };
  };
  const label = packStrings((d) => d.label);
  const code = packStrings((d) => d.fullcode);
  const fullid = packStrings((d) => d.fullid);
  const docCodetype = Buffer.from(docs.map((d) => d.ct));

  // assemble
  const sectionsSrc = {
    tokenBlob,
    tokenOffsets: u32(tokenOffsets),
    postStart: u32(postStart),
    postings: u32(postings),
    labelBlob: label.blob,
    labelOffsets: u32(label.offsets),
    codeBlob: code.blob,
    codeOffsets: u32(code.offsets),
    fullidBlob: fullid.blob,
    fullidOffsets: u32(fullid.offsets),
    docCodetype,
    docLen: Buffer.from(docLens),
  };

  const meta = {
    domain,
    docCount: docs.length,
    tokenCount: tokens.length,
    postingsCount,
    codetypes,
    sections: {},
  };
  // compute layout: header is 12 bytes + metaLen; the meta JSON length depends
  // on the section offsets it contains, so iterate until the layout is stable.
  let metaJson = '';
  let headerLen = 0;
  let prevHeaderLen = -1;
  while (headerLen !== prevHeaderLen) {
    prevHeaderLen = headerLen;
    let off = headerLen;
    for (const [name, buf] of Object.entries(sectionsSrc)) {
      off = align4(off);
      meta.sections[name] = [off, buf.length];
      off += buf.length;
    }
    metaJson = JSON.stringify(meta);
    headerLen = align4(12 + Buffer.byteLength(metaJson));
  }

  const totalLen =
    Object.values(meta.sections).reduce(
      (m, [off, len]) => Math.max(m, off + len),
      0
    ) || headerLen;
  const out = Buffer.alloc(align4(totalLen));
  out.writeUInt32LE(0x4d434458, 0); // 'MCDX'
  out.writeUInt32LE(1, 4);
  const metaBuf = Buffer.from(metaJson, 'utf8');
  out.writeUInt32LE(metaBuf.length, 8);
  metaBuf.copy(out, 12);
  for (const [name, buf] of Object.entries(sectionsSrc)) {
    buf.copy(out, meta.sections[name][0]);
  }

  const file = `${domain}.mcdx`;
  writeFileSync(path.join(outDir, file), out);
  manifest.shards.push({
    domain,
    file,
    bytes: out.length,
    docCount: docs.length,
    tokenCount: tokens.length,
  });
  console.error(
    `${domain}: ${docs.length} docs, ${tokens.length} tokens, ` +
      `${(out.length / 1024 / 1024).toFixed(1)} MB (${Date.now() - t0} ms)`
  );
}

writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.error(`Wrote ${path.join(outDir, 'manifest.json')}`);
