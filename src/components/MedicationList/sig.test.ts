import { describe, it, expect } from 'vitest';
import {
  calculateQuantity,
  expandSig,
  parseDurationDays,
  parseSig,
  type QuantityCalcInput,
} from './sig';

const qty = (
  sig: string,
  duration: string,
  extra: Partial<QuantityCalcInput> = {}
) =>
  calculateQuantity({
    sig,
    days: parseDurationDays(duration),
    doseForm: 'tablet',
    ...extra,
  });

describe('parseDurationDays', () => {
  it.each([
    ['30', 30],
    ['30d', 30],
    ['30D', 30],
    ['2w', 14],
    ['1m', 30],
    ['1m 2w', 44],
    ['2 weeks', 14],
    ['soon', 0],
  ])('%s → %d days', (text, days) => {
    expect(parseDurationDays(text)).toBe(days);
  });
});

describe('calculateQuantity — spec vectors', () => {
  it.each([
    ['1 tab PO BID', '30d', 60],
    ['2 tabs PO TID', '1w', 42],
    ['1/2 tab PO daily', '30d', 15],
    ['1 1/2 tabs PO BID', '10d', 30],
    ['2 tabs PO BID x 5 days; then 1 tab PO daily', '30d', 45],
    ['Take 1 tablet by mouth twice a day', '1m', 60],
    ['1 tab q6h', '5d', 20],
    ['1 tab PO 3x/day', '10d', 30],
    ['2 tabs/day', '7d', 14],
    ['1 tab PO', '30d', 30],
    // parts without a duration run concurrently for the whole supply
    ['1 tab PO BID; 2 tabs PO QD', '10d', 40],
  ])('%s for %s = %d', (sig, duration, quantity) => {
    expect(qty(sig, duration)).toEqual({ quantity, unit: 'tablet' });
  });

  it('measures oral liquids in mL', () => {
    const liquid = { doseForm: 'oral solution' };
    expect(qty('5 mL PO BID', '10d', liquid)).toEqual({
      quantity: 100,
      unit: 'mL',
    });
    // 98.58 mL rounds up to a whole mL
    expect(qty('1 tsp PO BID', '10d', liquid)).toEqual({
      quantity: 99,
      unit: 'mL',
    });
  });

  it('fails on an empty supply', () => {
    expect(qty('1 tab PO BID', '0d')).toEqual({ reason: 'unparsed' });
  });
});

describe('calculateQuantity — improvements over the current product', () => {
  it('ignores punctuation after a term and uppercase duration units', () => {
    expect(qty('1 tab PO BID, with food', '30D')).toEqual({
      quantity: 60,
      unit: 'tablet',
    });
  });

  it('caps a part duration at the supply', () => {
    expect(qty('2 tabs PO BID x 10 days; then 1 tab PO daily', '5d')).toEqual({
      quantity: 20,
      unit: 'tablet',
    });
  });

  it('rounds partial units up', () => {
    expect(qty('1/2 tab PO daily', '7d')).toEqual({
      quantity: 4,
      unit: 'tablet',
    });
  });

  it('uses the upper bound of ranges', () => {
    // 2 tabs every 4 hours = 12 a day
    expect(qty('1-2 tabs PO q4-6h prn', '10d')).toEqual({
      quantity: 120,
      unit: 'tablet',
    });
  });

  it('adds times of day', () => {
    expect(qty('1 tab at 8am and 8pm', '10d')).toEqual({
      quantity: 20,
      unit: 'tablet',
    });
  });

  it('converts mass doses through the strength', () => {
    expect(qty('500 mg PO BID', '10d', { strength: '250 mg' })).toEqual({
      quantity: 40,
      unit: 'tablet',
    });
    expect(qty('500 mg PO BID', '10d')).toEqual({ reason: 'unparsed' });
  });

  it('refuses unsafe or unknown doses', () => {
    expect(qty('10 mg/kg PO BID', '10d')).toEqual({ reason: 'unparsed' });
    expect(qty('__ ml po bid', '10d', { doseForm: 'oral solution' })).toEqual({
      reason: 'blank',
    });
    // a bare number isn't a dose
    expect(
      qty(
        '1 tablet by mouth weekly; take if weight greater than 149 pounds',
        '30d'
      )
    ).toEqual({ reason: 'unparsed' });
    // the dose unit must match the product
    expect(qty('5 mL PO BID', '10d')).toEqual({ reason: 'unparsed' });
    expect(qty('2 tabs PO BID', '10d', { doseForm: 'capsule' })).toEqual({
      reason: 'unparsed',
    });
  });

  it('only calculates countable forms and oral liquids', () => {
    expect(qty('apply topically bid', '30d', { doseForm: 'cream' })).toEqual({
      reason: 'form',
    });
    expect(
      qty('instill 1 gtt in each eye bid', '30d', {
        doseForm: 'ophthalmic solution',
      })
    ).toEqual({ reason: 'form' });
    expect(qty('1 tab po bid', '30d', { doseForm: undefined })).toEqual({
      reason: 'form',
    });
  });

  it('accepts host dictionary terms', () => {
    expect(
      qty('1 tab po 5xd', '10d', {
        terms: [{ abbrev: '5xd', term: 'five times a day', perDay: 5 }],
      })
    ).toEqual({ quantity: 50, unit: 'tablet' });
  });
});

describe('shared dictionary', () => {
  it('drives expansion and parsing from the same terms', () => {
    const terms = [
      {
        abbrev: 'qac',
        term: 'before each meal',
        perDay: 3,
        frequency: 'Before meals',
      },
    ];
    expect(expandSig('1 tab po qac', terms)).toBe(
      'Take 1 tablet by mouth before each meal.'
    );
    expect(parseSig('1 tab po qac', terms)).toEqual({
      route: 'oral',
      frequency: 'Before meals',
      prn: false,
    });
    expect(qty('1 tab po qac', '10d', { terms })).toEqual({
      quantity: 30,
      unit: 'tablet',
    });
  });

  it('keeps the existing expansion and parsing', () => {
    expect(expandSig('1 tab po qd')).toBe('Take 1 tablet by mouth once a day.');
    expect(expandSig('1-2 tabs po q4-6h prn')).toBe(
      'Take 1-2 tablets by mouth every 4-6 hours as needed.'
    );
    expect(expandSig('instill 1 gtt in __ eye')).toBe(
      'Instill 1 drop in __ eye.'
    );
    expect(parseSig('1 tablet by mouth daily as needed')).toEqual({
      route: 'oral',
      frequency: 'Once daily',
      prn: true,
    });
    expect(parseSig('apply __ in __ eye bid').route).toBe('ophthalmic');
  });
});

describe('ReDoS hardening', () => {
  it('strips trailing punctuation in linear time on adversarial input', () => {
    // Regression test for a high-severity CodeQL finding: the trailing-
    // punctuation strip in `clean()` used an unanchored `[...]+$`, which
    // retries at every position in the string and backtracks polynomially
    // on a long run of a single allowed character (here "!"). A fixed
    // bound keeps each retry O(1), so this completes in milliseconds
    // instead of seconds even on a 50k-character adversarial token.
    const adversarial = '!'.repeat(50_000);
    const start = Date.now();
    expect(() => expandSig(`1 tab po qd ${adversarial}`)).not.toThrow();
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
