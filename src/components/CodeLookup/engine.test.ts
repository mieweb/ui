import { describe, it, expect } from 'vitest';
import {
  normalize,
  familyTerm,
  familyKey,
  billableMask,
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
    docCodetype: new Uint8Array(
      entries.map(([ct]) => codetypes.indexOf(ct))
    ),
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
    expect(familyKey('condition', 'Type 2 diabetes w/ foot ulcer', 'E11.621')).toBe(
      'condition:#E11'
    );
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
    expect(familyKey('occupational', 'Lead surveillance (general)', '1910.1025')).toBe(
      'occupational:#1910.1025'
    );
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
