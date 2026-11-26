import { describe, expect, it } from 'vitest';
import {
  canBeFillOf,
  findDuplicateCandidates,
  findRepeatFillGroups,
  levenshtein,
  normalizeMedicationName,
  parsePharmacyIdentifier,
  scoreMedicationPair,
  textSimilarity,
  type MatchScore,
} from './scoring';
import { chartHistory, incomingHistory } from './storyData';
import type { MedHistoryRecord } from './types';

function byId(list: MedHistoryRecord[], id: string): MedHistoryRecord {
  const record = list.find((r) => r.id === id);
  if (!record) throw new Error(`no fixture ${id}`);
  return record;
}

/** A fully populated record; override any field per test. */
function record(
  id: string,
  medication: Partial<MedHistoryRecord['medication']> = {},
  extra: Partial<MedHistoryRecord> = {}
): MedHistoryRecord {
  return {
    id,
    medication: {
      id,
      name: 'lisinopril 10 mg tablet',
      strength: '10 mg',
      doseForm: 'tablet',
      quantity: '30',
      quantityUnit: 'tablet',
      startDate: '2026-01-10',
      patientSig: 'Take 1 tablet by mouth once daily',
      ...medication,
    },
    pharmacy: { ncpdpid: '1234567' },
    prescriber: { npi: '1111111111', lastName: 'Ruiz', firstName: 'Elena' },
    ...extra,
  };
}

function field(match: MatchScore, name: string) {
  const result = match.fields.find((f) => f.field === name);
  if (!result) throw new Error(`no field ${name}`);
  return result;
}

describe('levenshtein', () => {
  it('counts insertions, deletions and substitutions', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });

  it('measures Unicode code points, not UTF-16 units', () => {
    expect(levenshtein('a😀b', 'a😃b')).toBe(1);
  });

  it('turns distance into a 0–1 similarity', () => {
    expect(textSimilarity('', '')).toBe(1);
    expect(textSimilarity('abcd', 'abcf')).toBe(0.75);
  });
});

describe('normalizeMedicationName', () => {
  it('drops strength and form words and expands abbreviations', () => {
    expect(normalizeMedicationName('Sprycel 70 mg tablet')).toBe('sprycel');
    expect(normalizeMedicationName('methylPREDNISolone 4 MG DOSEPAK')).toBe(
      'methylprednisolone'
    );
    expect(normalizeMedicationName('Metformin HCl 500 mg tab')).toBe(
      'metformin hydrochloride'
    );
  });

  it('keeps the whole name when only strength and form are left', () => {
    expect(normalizeMedicationName('70 mg tablet')).toBe('70 mg tablet');
  });
});

describe('parsePharmacyIdentifier', () => {
  it.each([
    ['N1235468844', { npi: '1235468844' }],
    ['0422154', { ncpdpid: '0422154' }],
    ['1235468844', { npi: '1235468844' }],
    ['Brooklyn @ Gates', { name: 'Brooklyn @ Gates' }],
  ])('parses %s', (input, expected) => {
    expect(parsePharmacyIdentifier(input)).toEqual(expected);
  });

  it('keeps explicit identifiers and ignores blanks', () => {
    expect(
      parsePharmacyIdentifier({ ncpdpid: ' 4222154 ', npi: '', name: 'X' })
    ).toEqual({ ncpdpid: '4222154', npi: undefined, name: 'X' });
    expect(parsePharmacyIdentifier(undefined)).toEqual({});
  });
});

describe('scoreMedicationPair — should flag', () => {
  it('scores an identical product 100%', () => {
    const a = record('a', {}, { codes: [{ system: 'FDB', code: '1' }] });
    const b = record('b', {}, { codes: [{ system: 'FDB', code: '1' }] });
    const match = scoreMedicationPair(a, b);
    expect(match.score).toBe(1);
    expect(match.coverage).toBe(1);
    expect(match.isPotentialDuplicate).toBe(true);
    expect(field(match, 'identity').reason).toBe('same-product');
  });

  it('matches NDCs regardless of formatting', () => {
    const a = record(
      'a',
      { name: 'x' },
      { codes: [{ system: 'NDC', code: '00003-0524-11' }] }
    );
    const b = record(
      'b',
      { name: 'y' },
      { codes: [{ system: 'ndc', code: '00003052411' }] }
    );
    expect(field(scoreMedicationPair(a, b), 'identity').reason).toBe(
      'same-product'
    );
  });

  it('gives brand ↔ generic 90% of the identity points (96.5%)', () => {
    const match = scoreMedicationPair(
      record(
        'a',
        { name: 'Sprycel 70 mg tablet', strength: '70 mg' },
        { drugId: 'd' }
      ),
      record(
        'b',
        { name: 'dasatinib 70 mg tablet', strength: '70 mg' },
        { drugId: 'd' }
      )
    );
    expect(match.score).toBeCloseTo(0.965, 3);
    expect(field(match, 'identity')).toMatchObject({
      reason: 'brand-generic',
      similarity: 0.9,
    });
  });

  it('treats a host alias group like a shared drug id', () => {
    const match = scoreMedicationPair(
      record('a', { name: 'Sprycel 70 mg tablet' }),
      record('b', { name: 'dasatinib 70 mg tablet' }),
      { aliases: [['Sprycel', 'Dasatinib']] }
    );
    expect(field(match, 'identity').reason).toBe('brand-generic');
    expect(match.isPotentialDuplicate).toBe(true);
  });

  it('honors a custom brandGenericCredit', () => {
    const match = scoreMedicationPair(
      record('a', { name: 'Sprycel' }, { drugId: 'd' }),
      record('b', { name: 'dasatinib' }, { drugId: 'd' }),
      { brandGenericCredit: 0.5 }
    );
    expect(field(match, 'identity').similarity).toBe(0.5);
    expect(match.score).toBeCloseTo((17.5 + 65) / 100, 3);
  });

  it('flags a spelling variation of an uncoded chart record', () => {
    const match = scoreMedicationPair(
      byId(incomingHistory, 'rxh-methylpred'),
      byId(chartHistory, 'chart-methylpred')
    );
    expect(match.isPotentialDuplicate).toBe(true);
    expect(field(match, 'sig').outcome).toBe('missing');
  });

  it('flags a name-only chart record and reports low coverage', () => {
    const match = scoreMedicationPair(byId(incomingHistory, 'rxh-sprycel'), {
      id: 'c',
      medication: { id: 'c', name: 'Sprycel 70 mg tablet' },
    });
    expect(match.score).toBe(1);
    expect(match.coverage).toBeCloseTo(0.55, 3);
    expect(match.isPotentialDuplicate).toBe(true);
  });
});

describe('scoreMedicationPair — same drug, different strength (flagged)', () => {
  it('scores brand ↔ generic at another strength 86.5%', () => {
    const match = scoreMedicationPair(
      record(
        'a',
        { name: 'Sprycel 70 mg tablet', strength: '70 mg' },
        { drugId: 'd' }
      ),
      record(
        'b',
        { name: 'dasatinib 100 mg tablet', strength: '100 mg' },
        { drugId: 'd' }
      )
    );
    expect(match.score).toBeCloseTo(0.865, 3);
    expect(match.isPotentialDuplicate).toBe(true);
    expect(field(match, 'strengthForm')).toMatchObject({
      outcome: 'partial',
      reason: 'different-strength',
    });
  });

  it('scores lisinopril 20 mg against 10 mg 90%', () => {
    const match = scoreMedicationPair(
      record('a', { name: 'lisinopril 20 mg tablet', strength: '20 mg' }),
      record('b')
    );
    expect(match.score).toBeCloseTo(0.9, 3);
    expect(match.isPotentialDuplicate).toBe(true);
  });
});

describe('scoreMedicationPair — should not flag', () => {
  it('dismisses records coded as different drugs', () => {
    const match = scoreMedicationPair(
      record(
        'a',
        { name: 'doxycycline hyclate 100 mg capsule' },
        { drugId: 'doxy' }
      ),
      record('b', { name: 'doxazosin 4 mg tablet' }, { drugId: 'doxa' })
    );
    expect(match).toMatchObject({
      score: 0,
      dismissedBy: 'different-drug',
      isPotentialDuplicate: false,
    });
  });

  it('keeps a shared product code ahead of a drug id mismatch', () => {
    const codes = [{ system: 'FDB', code: '9' }];
    const match = scoreMedicationPair(
      record('a', {}, { drugId: 'x', codes }),
      record('b', {}, { drugId: 'y', codes })
    );
    expect(match.dismissedBy).toBeUndefined();
  });

  it('keeps an uncoded look-alike name below the threshold', () => {
    const match = scoreMedicationPair(
      record('a', {
        name: 'doxycycline hyclate 100 mg capsule',
        strength: '100 mg',
        doseForm: 'capsule',
      }),
      record('b', {
        name: 'doxazosin mesylate',
        strength: '4 mg',
        doseForm: 'tablet',
      })
    );
    expect(match.dismissedBy).toBeUndefined();
    expect(field(match, 'identity').reason).toBe('different-name');
    expect(match.isPotentialDuplicate).toBe(false);
  });

  it('keeps the same drug in another form and route below the threshold', () => {
    const match = scoreMedicationPair(
      byId(incomingHistory, 'rxh-dexamethasone'),
      {
        id: 'c',
        medication: {
          id: 'c',
          name: 'dexamethasone 4 mg tablet',
          strength: '4 mg',
          doseForm: 'tablet',
          quantity: '30',
          quantityUnit: 'tablet',
          startDate: '2026-04-12',
          patientSig: 'Take 1 tablet by mouth once daily',
        },
        drugId: 'drug-dexamethasone',
        pharmacy: '4222154',
        prescriber: { npi: '2888888882' },
      }
    );
    expect(field(match, 'strengthForm').reason).toBe('different-strength-form');
    expect(field(match, 'quantity').reason).toBe('different-quantity');
    expect(match.isPotentialDuplicate).toBe(false);
  });

  it('dismisses a supply against a coded drug', () => {
    const syringe = byId(incomingHistory, 'rxh-syringe');
    const match = scoreMedicationPair(
      { ...syringe, medication: { ...syringe.medication, uncodedType: 'SP' } },
      byId(incomingHistory, 'rxh-dexamethasone')
    );
    expect(match.dismissedBy).toBe('supply-vs-drug');
  });

  it('dismisses unrelated names before measuring distance', () => {
    expect(
      scoreMedicationPair(
        record('a', { name: 'Sprycel' }),
        record('b', { name: 'dasatinib' })
      ).dismissedBy
    ).toBe('no-shared-prefix');
    expect(
      scoreMedicationPair(
        record('a', { name: 'abc' }),
        record('b', { name: 'abcdefghij' })
      ).dismissedBy
    ).toBe('name-length');
  });

  it('keeps an older course with another prescriber and pharmacy below 80%', () => {
    const match = scoreMedicationPair(
      byId(incomingHistory, 'rxh-doxycycline'),
      {
        ...byId(chartHistory, 'chart-doxycycline-old'),
        prescriber: { npi: '3333333333' },
        pharmacy: '7654321',
      }
    );
    expect(match.score).toBeCloseTo(0.725, 2);
    expect(match.isPotentialDuplicate).toBe(false);
  });
});

describe('field scorers', () => {
  it('leaves missing fields out of the score', () => {
    const a: MedHistoryRecord = {
      id: 'a',
      medication: { id: 'a', name: 'aspirin' },
    };
    const match = scoreMedicationPair(a, { ...a, id: 'b' });
    expect(match.fields.filter((f) => f.outcome === 'missing')).toHaveLength(6);
    expect(match.score).toBe(1);
  });

  it('matches sigs by parsed route and frequency', () => {
    const match = scoreMedicationPair(
      record('a', { patientSig: 'Take 1 tablet by mouth once daily' }),
      record('b', { patientSig: '1 tab po daily' })
    );
    expect(field(match, 'sig').reason).toBe('same-sig');
  });

  it('decays dates linearly after a week', () => {
    const near = scoreMedicationPair(
      record('a'),
      record('b', { startDate: '2026-01-15' })
    );
    const far = scoreMedicationPair(
      record('a'),
      record('b', { startDate: '2027-06-01' })
    );
    expect(field(near, 'date').reason).toBe('same-date');
    expect(field(far, 'date')).toMatchObject({
      similarity: 0,
      reason: 'distant-date',
    });
  });

  it('compares the closest of start and dispensed dates', () => {
    const match = scoreMedicationPair(
      record('a', { startDate: '2025-01-01' }, { dispensedDate: '2026-01-10' }),
      record('b')
    );
    expect(field(match, 'date').similarity).toBe(1);
  });

  it('compares pharmacies by NCPDP ID, then NPI, then name', () => {
    const ncpdp = scoreMedicationPair(
      record('a', {}, { pharmacy: { ncpdpid: '1', npi: '9' } }),
      record('b', {}, { pharmacy: { ncpdpid: '2', npi: '9' } })
    );
    expect(field(ncpdp, 'pharmacy').reason).toBe('different-pharmacy');
    const npi = scoreMedicationPair(
      record('a', {}, { pharmacy: 'N1235468844' }),
      record('b', {}, { pharmacy: { npi: '1235468844', name: 'Other' } })
    );
    expect(field(npi, 'pharmacy').reason).toBe('same-pharmacy');
    const name = scoreMedicationPair(
      record('a', {}, { pharmacy: 'Main Street Pharmacy' }),
      record('b', {}, { pharmacy: 'Pharmacy Main Street' })
    );
    expect(field(name, 'pharmacy').reason).toBe('same-pharmacy');
  });

  it('falls back to medication.pharmacyId and prescriber text', () => {
    const a = record('a', {
      pharmacyId: '4222154',
      prescriber: 'McTavish, Tarquin',
    });
    const b = record('b', {
      pharmacyId: '4222154',
      prescriber: 'Tarquin McTavish',
    });
    delete a.pharmacy;
    delete b.pharmacy;
    delete a.prescriber;
    delete b.prescriber;
    const match = scoreMedicationPair(a, b);
    expect(field(match, 'pharmacy').reason).toBe('same-pharmacy');
    expect(field(match, 'prescriber').reason).toBe('same-prescriber');
  });

  it('scores quantity by value and unit', () => {
    const sameUnit = scoreMedicationPair(
      record('a'),
      record('b', { quantity: '90' })
    );
    expect(field(sameUnit, 'quantity').similarity).toBe(0.5);
    const otherUnit = scoreMedicationPair(
      record('a'),
      record('b', { quantityUnit: 'capsule' })
    );
    expect(field(otherUnit, 'quantity').similarity).toBe(0);
  });
});

describe('options', () => {
  it('flags a score exactly at the threshold', () => {
    const match = scoreMedicationPair(
      record('a', { name: 'lisinopril 20 mg tablet', strength: '20 mg' }),
      record('b'),
      { duplicateThreshold: 0.9 }
    );
    expect(match.score).toBeCloseTo(0.9, 9);
    expect(match.isPotentialDuplicate).toBe(true);
  });

  it('applies custom weights', () => {
    const match = scoreMedicationPair(
      record('a', { name: 'lisinopril 20 mg tablet', strength: '20 mg' }),
      record('b'),
      { weights: { strengthForm: 0 } }
    );
    expect(match.score).toBe(1);
  });

  it('uses a custom field scorer', () => {
    const match = scoreMedicationPair(record('a'), record('b'), {
      scorers: { pharmacy: () => ({ similarity: 0 }), sig: () => null },
    });
    expect(field(match, 'pharmacy')).toMatchObject({
      similarity: 0,
      reason: 'custom',
    });
    expect(field(match, 'sig').outcome).toBe('missing');
  });
});

describe('canBeFillOf', () => {
  it('allows the same product', () => {
    const codes = [{ system: 'NDC', code: '99073013001' }];
    const match = scoreMedicationPair(
      record(
        'a',
        { name: 'lancets', strength: undefined, doseForm: undefined },
        { codes }
      ),
      record(
        'b',
        { name: 'lancets', strength: undefined, doseForm: undefined },
        { codes }
      )
    );
    expect(canBeFillOf(match)).toBe(true);
  });

  it('allows brand ↔ generic at the same strength and form', () => {
    const match = scoreMedicationPair(
      record(
        'a',
        { name: 'Sprycel 70 mg tablet', strength: '70 mg' },
        { drugId: 'd' }
      ),
      record(
        'b',
        { name: 'dasatinib 70 mg tablet', strength: '70 mg' },
        { drugId: 'd' }
      )
    );
    expect(canBeFillOf(match)).toBe(true);
  });

  it('refuses another strength, unknown strength and form, or a dismissed pair', () => {
    expect(
      canBeFillOf(
        scoreMedicationPair(
          record('a', { name: 'lisinopril 20 mg tablet', strength: '20 mg' }),
          record('b')
        )
      )
    ).toBe(false);
    expect(
      canBeFillOf(
        scoreMedicationPair(
          record('a', {
            name: 'aspirin',
            strength: undefined,
            doseForm: undefined,
          }),
          record('b', {
            name: 'aspirin',
            strength: undefined,
            doseForm: undefined,
          })
        )
      )
    ).toBe(false);
    expect(
      canBeFillOf(
        scoreMedicationPair(
          record('a', {}, { drugId: 'x' }),
          record('b', {}, { drugId: 'y' })
        )
      )
    ).toBe(false);
  });
});

describe('findDuplicateCandidates', () => {
  const candidates = findDuplicateCandidates(incomingHistory, chartHistory);
  const forIncoming = (id: string) =>
    candidates.filter((c) => c.incomingId === id).map((c) => c.chartId);

  it('finds brand ↔ generic, spelling and older-course matches', () => {
    expect(forIncoming('rxh-sprycel')).toEqual(['chart-dasatinib']);
    expect(forIncoming('rxh-methylpred')).toEqual(['chart-methylpred']);
    expect(forIncoming('rxh-doxycycline')).toEqual(['chart-doxycycline-old']);
  });

  it('leaves unrelated records unmatched', () => {
    expect(forIncoming('rxh-syringe')).toEqual([]);
    expect(forIncoming('rxh-tobradex')).toEqual([]);
    expect(forIncoming('rxh-dexamethasone')).toEqual([]);
  });

  it('lists every chart match best first', () => {
    const current = {
      ...byId(chartHistory, 'chart-doxycycline-old'),
      id: 'now',
    };
    current.medication = {
      ...current.medication,
      id: 'now',
      startDate: '2026-03-02',
    };
    const both = findDuplicateCandidates(
      [byId(incomingHistory, 'rxh-doxycycline')],
      [byId(chartHistory, 'chart-doxycycline-old'), current]
    );
    expect(both.map((c) => c.chartId)).toEqual([
      'now',
      'chart-doxycycline-old',
    ]);
  });
});

describe('findRepeatFillGroups', () => {
  it('groups the three lancet fills', () => {
    expect(findRepeatFillGroups(incomingHistory)).toEqual([
      ['rxh-lancets-3', 'rxh-lancets-2', 'rxh-lancets-1'],
    ]);
  });
});

describe('performance', () => {
  it('scores 100 × 100 records plus incoming pairs within 2 seconds', () => {
    const drugs = Array.from({ length: 100 }, (_, i) => `drug${i}`);
    const make = (prefix: string, i: number): MedHistoryRecord =>
      record(`${prefix}${i}`, {
        name: `${drugs[(i * 7) % 100]}amine ${i % 3 ? 'hydrochloride ' : ''}${(i % 5) * 10 + 10} mg tablet`,
        startDate: `2026-0${(i % 9) + 1}-1${i % 9}`,
      });
    const incoming = Array.from({ length: 100 }, (_, i) => make('in', i));
    const chart = Array.from({ length: 100 }, (_, i) => make('chart', i));
    // Warm up the JIT so the timing reflects steady-state matching.
    findDuplicateCandidates(incoming.slice(0, 10), chart.slice(0, 10));
    const start = performance.now();
    findDuplicateCandidates(incoming, chart);
    findRepeatFillGroups(incoming);
    expect(performance.now() - start).toBeLessThan(2000);
  });
});
