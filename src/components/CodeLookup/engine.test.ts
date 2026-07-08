import { describe, it, expect } from 'vitest';
import {
  normalize,
  familyTerm,
  familyKey,
  billableMask,
  searchShards,
  type CodifyShard,
} from './engine';

/** Minimal shard stub with just the fields billableMask() reads. */
function shardWithCodes(entries: [codetype: string, code: string][]) {
  const codetypes = [...new Set(entries.map(([ct]) => ct))];
  const enc = new TextEncoder();
  const offsets = new Uint32Array(entries.length + 1);
  const parts: Uint8Array[] = [];
  let off = 0;
  for (let i = 0; i < entries.length; i++) {
    const bytes = enc.encode(entries[i][1]);
    parts.push(bytes);
    offsets[i] = off;
    off += bytes.length;
  }
  offsets[entries.length] = off;
  const blob = new Uint8Array(off);
  for (let i = 0; i < entries.length; i++) blob.set(parts[i], offsets[i]);
  return {
    docCount: entries.length,
    codetypes,
    docCodetype: new Uint8Array(entries.map(([ct]) => codetypes.indexOf(ct))),
    codeBlob: blob,
    codeOffsets: offsets,
  } as unknown as CodifyShard;
}

describe('billableMask', () => {
  it('marks leaf ICD-10 codes billable, roots and SNOMED not', () => {
    const s = shardWithCodes([
      ['ICD10', 'E11'], // root — has children
      ['ICD10', 'E11.621'], // leaf
      ['ICD10', 'E11.9'], // leaf
      ['ICD10', 'W21.31'], // has suffix children
      ['ICD10', 'W21.31xA'], // leaf
      ['SNOMED US', '73211009'], // not ICD-10
    ]);
    expect([...billableMask(s)]).toEqual([0, 1, 1, 0, 1, 0]);
  });
});

describe('normalize', () => {
  it('lowercases, strips accents and punctuation', () => {
    expect(normalize('Insuficiencia Cardíaca!')).toBe('insuficiencia cardiaca');
    expect(normalize('L-Dopres-Hydrochlorothiazide')).toBe(
      'l dopres hydrochlorothiazide'
    );
  });
});

describe('familyTerm', () => {
  it('meds group by the leading ingredient/brand word', () => {
    expect(familyTerm('med', 'levothyroxine sodium Oral Tablet')).toBe(
      'levothyroxine'
    );
  });
  it('short first words pull in the next word', () => {
    expect(familyTerm('med', 'L norgest/e.estradiol')).toBe('l norgest');
  });
  it('labs drop the LOINC property bracket', () => {
    expect(familyTerm('lab', 'Glucose [Mass/volume] in Serum or Plasma')).toBe(
      'glucose'
    );
  });
  it('other domains use two words', () => {
    expect(familyTerm('condition', 'Acute bronchitis due to virus')).toBe(
      'acute bronchitis'
    );
  });
});

describe('familyKey', () => {
  it('groups ICD-10 conditions by code root', () => {
    expect(
      familyKey('condition', 'Type 2 diabetes w/ foot ulcer', 'E11.621')
    ).toBe('condition:#E11');
    expect(familyKey('condition', 'Type 2 diabetes mellitus', 'E11')).toBe(
      'condition:#E11'
    );
  });
  it('groups SNOMED synonyms by concept id', () => {
    expect(familyKey('condition', 'Diabetes mellitus', '73211009')).toBe(
      familyKey('condition', 'DM - Diabetes mellitus', '73211009')
    );
  });
  it('keys programs and measures by their code, never merging', () => {
    expect(
      familyKey('occupational', 'Lead surveillance (general)', '1910.1025')
    ).toBe('occupational:#1910.1025');
    expect(
      familyKey('occupational', 'Lead surveillance (construction)', '1926.62')
    ).not.toBe(
      familyKey('occupational', 'Lead surveillance (general)', '1910.1025')
    );
    expect(familyKey('quality', 'Breast cancer screening', 'CMS125')).toBe(
      'quality:#CMS125'
    );
  });
  it('meds fall back to the family term', () => {
    expect(familyKey('med', 'losartan potassium 50 MG', '52175')).toBe(
      'med:losartan'
    );
  });
});

// =============================================================================
// searchShards — synthetic in-memory shard (mirrors the .mcdx layout that
// parseShard() produces, without the binary encoding)
// =============================================================================

interface TestDoc {
  label: string;
  code: string;
  codetype: string;
  aliases?: string[];
  /** log-quantized usage prior 0-255 (default 0) */
  prior?: number;
}

function makeShard(domain: string, docs: TestDoc[]): CodifyShard {
  const enc = new TextEncoder();
  const codetypes = [...new Set(docs.map((d) => d.codetype))];

  // token → postings (docId<<1 | aliasBit), label tokens win over aliases
  const post = new Map<string, Map<number, number>>();
  const docTokens: string[][] = [];
  docs.forEach((doc, d) => {
    const labelToks = normalize(doc.label).split(' ').filter(Boolean);
    docTokens.push(labelToks);
    for (const t of labelToks) {
      if (!post.has(t)) post.set(t, new Map());
      post.get(t)!.set(d, 0);
    }
    for (const a of doc.aliases ?? []) {
      for (const t of normalize(a).split(' ').filter(Boolean)) {
        if (!post.has(t)) post.set(t, new Map());
        if (!post.get(t)!.has(d)) post.get(t)!.set(d, 1);
      }
    }
  });
  const tokens = [...post.keys()].sort();
  const tokenId = new Map(tokens.map((t, i) => [t, i]));

  const blob = (parts: string[]) => {
    const bytes = parts.map((p) => enc.encode(p));
    const offsets = new Uint32Array(parts.length + 1);
    let off = 0;
    bytes.forEach((b, i) => {
      offsets[i] = off;
      off += b.length;
    });
    offsets[parts.length] = off;
    const out = new Uint8Array(off);
    bytes.forEach((b, i) => out.set(b, offsets[i]));
    return { blob: out, offsets };
  };

  const postStart = new Uint32Array(tokens.length + 1);
  const flat: number[] = [];
  tokens.forEach((t, i) => {
    postStart[i] = flat.length;
    for (const [d, alias] of post.get(t)!) flat.push((d << 1) | alias);
  });
  postStart[tokens.length] = flat.length;
  const postings = new Uint32Array(flat);

  const docPrior = new Uint8Array(docs.map((d) => d.prior ?? 0));
  const tokenPrior = new Uint8Array(tokens.length);
  tokens.forEach((t, i) => {
    let m = 0;
    for (const [d] of post.get(t)!) m = Math.max(m, docPrior[d]);
    tokenPrior[i] = m;
  });
  const docFirstTok = new Uint32Array(
    docs.map((_, d) => tokenId.get(docTokens[d][0]) ?? 0xffffffff)
  );

  const tok = blob(tokens);
  const label = blob(docs.map((d) => d.label));
  const code = blob(docs.map((d) => d.code));
  const fullid = blob(docs.map((d, i) => `${d.codetype}:${i}`));

  return {
    domain,
    locale: 'en',
    docCount: docs.length,
    tokenCount: tokens.length,
    codetypes,
    tokenBlob: tok.blob,
    tokenOffsets: tok.offsets,
    postStart,
    postings,
    labelBlob: label.blob,
    labelOffsets: label.offsets,
    codeBlob: code.blob,
    codeOffsets: code.offsets,
    fullidBlob: fullid.blob,
    fullidOffsets: fullid.offsets,
    docCodetype: new Uint8Array(docs.map((d) => codetypes.indexOf(d.codetype))),
    docLen: new Uint8Array(docTokens.map((t) => Math.min(255, t.length))),
    docPrior,
    tokenPrior,
    docFirstTok,
    scoreBuf: new Float32Array(docs.length),
    maskBuf: new Uint8Array(docs.length),
    aliasBuf: new Uint8Array(docs.length),
    fuzzyBuf: new Uint8Array(docs.length),
    touched: new Uint32Array(docs.length),
  };
}

describe('searchShards', () => {
  const conditions = makeShard('condition', [
    { label: 'Congestive heart failure', code: 'I50.9', codetype: 'ICD10' },
    { label: 'Heart transplant status', code: 'Z94.1', codetype: 'ICD10' },
    { label: 'Congenital heart disease', code: 'Q24.9', codetype: 'ICD10' },
  ]);

  it('every token is a word prefix, AND semantics', () => {
    const r = searchShards([conditions], 'con hea fa');
    expect(r).toHaveLength(1);
    expect(r[0].label).toBe('Congestive heart failure');
    expect(r[0].viaAlias).toBe(false);
  });

  it('returns nothing when a token matches nothing', () => {
    expect(searchShards([conditions], 'con hea zz')).toHaveLength(0);
  });

  it('resets scratch buffers after an aborted (no-match) query', () => {
    // regression: an aborted multi-token query used to leave partial token
    // masks in the shard's scratch buffers, corrupting the next search
    searchShards([conditions], 'con hea zz');
    const r = searchShards([conditions], 'con hea fa');
    expect(r).toHaveLength(1);
    expect(r[0].label).toBe('Congestive heart failure');
  });

  it('flags alias matches with viaAlias', () => {
    const meds = makeShard('med', [
      {
        label: 'furosemide 40 MG Oral Tablet',
        code: '310429',
        codetype: 'RxNORM',
        aliases: ['lasix'],
      },
      { label: 'metoprolol tartrate', code: '866514', codetype: 'RxNORM' },
    ]);
    const r = searchShards([meds], 'lasix');
    expect(r).toHaveLength(1);
    expect(r[0].label).toMatch(/furosemide/);
    expect(r[0].viaAlias).toBe(true);
  });

  it('falls back to edit-distance-1 typos and flags viaFuzzy', () => {
    const r = searchShards([conditions], 'congestve');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].label).toBe('Congestive heart failure');
    expect(r[0].viaFuzzy).toBe(true);
  });

  it('ranks frequently-used docs above rare ones with equal text relevance', () => {
    const meds = makeShard('med', [
      { label: 'metoprolol tartrate', code: '866514', codetype: 'RxNORM' },
      {
        label: 'metformin hydrochloride',
        code: '861007',
        codetype: 'RxNORM',
        prior: 220,
      },
    ]);
    const r = searchShards([meds], 'met');
    expect(r[0].label).toMatch(/metformin/);
  });

  it('collapses family variants to one row, keeping the shortest label', () => {
    const meds = makeShard('med', [
      {
        label: 'lisinopril 10 MG Oral Tablet',
        code: '314076',
        codetype: 'RxNORM',
      },
      {
        label: 'lisinopril 20 MG Oral Tablet [Zestril]',
        code: '104377',
        codetype: 'RxNORM',
      },
      { label: 'losartan potassium 50 MG', code: '979485', codetype: 'RxNORM' },
    ]);
    const collapsed = searchShards([meds], 'lisinopril', 20, true);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].label).toBe('lisinopril 10 MG Oral Tablet');
    const flat = searchShards([meds], 'lisinopril', 20, false);
    expect(flat).toHaveLength(2);
  });

  it('expands ambiguous prefixes toward high-usage docs (> MAX_EXPANSIONS tokens)', () => {
    // 200 single-token docs sharing the prefix "z" — more than the expansion
    // cap — where only one is popular; the prior-driven selection must reach it
    const docs: TestDoc[] = Array.from({ length: 200 }, (_, i) => ({
      label: `z${String(i).padStart(3, '0')}drug`,
      code: String(i),
      codetype: 'RxNORM',
      prior: i === 150 ? 255 : 0,
    }));
    const r = searchShards([makeShard('med', docs)], 'z');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].label).toBe('z150drug');
  });
});
