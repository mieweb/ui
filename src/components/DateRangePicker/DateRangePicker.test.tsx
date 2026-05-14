import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateDateRange,
  getDefaultPresets,
  getExtendedPresets,
} from './DateRangePicker';

// Pin "now" to Wed May 14, 2025 14:30:00 local time so calendar math is stable.
const FROZEN_NOW = new Date(2025, 4, 14, 14, 30, 0, 0);

describe('calculateDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null range for unknown preset key', () => {
    expect(calculateDateRange('not-a-real-key')).toEqual({
      start: null,
      end: null,
    });
  });

  it('today spans the current calendar day', () => {
    const r = calculateDateRange('today');
    expect(r.start).toEqual(new Date(2025, 4, 14, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 4, 14, 23, 59, 59, 999));
  });

  it('yesterday spans the previous calendar day', () => {
    const r = calculateDateRange('yesterday');
    expect(r.start).toEqual(new Date(2025, 4, 13, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 4, 13, 23, 59, 59, 999));
  });

  it('this-week starts on Sunday and ends Saturday end-of-day', () => {
    const r = calculateDateRange('this-week');
    expect(r.start).toEqual(new Date(2025, 4, 11, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 4, 17, 23, 59, 59, 999));
  });

  it('last-week is the prior Sunday-Saturday window', () => {
    const r = calculateDateRange('last-week');
    expect(r.start).toEqual(new Date(2025, 4, 4, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 4, 10, 23, 59, 59, 999));
  });

  it('this-month spans the first to last day of the current month', () => {
    const r = calculateDateRange('this-month');
    expect(r.start).toEqual(new Date(2025, 4, 1, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 4, 31, 23, 59, 59, 999));
  });

  it('last-month spans the prior month', () => {
    const r = calculateDateRange('last-month');
    expect(r.start).toEqual(new Date(2025, 3, 1, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 3, 30, 23, 59, 59, 999));
  });

  it('this-quarter covers Q2 (Apr-Jun) when now is in May', () => {
    const r = calculateDateRange('this-quarter');
    expect(r.start).toEqual(new Date(2025, 3, 1, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 5, 30, 23, 59, 59, 999));
  });

  it('last-quarter covers Q1 (Jan-Mar) when now is in May', () => {
    const r = calculateDateRange('last-quarter');
    expect(r.start).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2025, 2, 31, 23, 59, 59, 999));
  });

  it('last-quarter rolls back across year boundary in Q1', () => {
    vi.setSystemTime(new Date(2025, 1, 15, 10, 0, 0, 0));
    const r = calculateDateRange('last-quarter');
    expect(r.start).toEqual(new Date(2024, 9, 1, 0, 0, 0, 0));
    expect(r.end).toEqual(new Date(2024, 11, 31, 23, 59, 59, 999));
  });

  it('this-year and last-year span full calendar years', () => {
    expect(calculateDateRange('this-year').start).toEqual(
      new Date(2025, 0, 1, 0, 0, 0, 0)
    );
    expect(calculateDateRange('this-year').end).toEqual(
      new Date(2025, 11, 31, 23, 59, 59, 999)
    );
    expect(calculateDateRange('last-year').start).toEqual(
      new Date(2024, 0, 1, 0, 0, 0, 0)
    );
    expect(calculateDateRange('last-year').end).toEqual(
      new Date(2024, 11, 31, 23, 59, 59, 999)
    );
  });

  it('rolling-window keys are trailing from now', () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cases: Array<[string, number]> = [
      ['last-24-hours', 1],
      ['last-7-days', 7],
      ['last-30-days', 30],
      ['last-90-days', 90],
      ['last-365-days', 365],
    ];
    for (const [key, days] of cases) {
      const r = calculateDateRange(key);
      expect(r.end).toEqual(FROZEN_NOW);
      expect(r.start).toEqual(new Date(FROZEN_NOW.getTime() - days * oneDayMs));
    }
  });
});

describe('preset list helpers', () => {
  it('getDefaultPresets is stable and excludes extended keys', () => {
    const keys = getDefaultPresets().map((p) => p.key);
    expect(keys).toEqual([
      'today',
      'this-week',
      'this-month',
      'last-month',
      'last-24-hours',
      'last-7-days',
      'last-30-days',
    ]);
  });

  it('getExtendedPresets includes the new keys', () => {
    const keys = new Set(getExtendedPresets().map((p) => p.key));
    for (const k of [
      'yesterday',
      'last-week',
      'this-quarter',
      'last-quarter',
      'this-year',
      'last-year',
      'last-90-days',
      'last-365-days',
    ]) {
      expect(keys.has(k)).toBe(true);
    }
  });

  it('respects custom labels', () => {
    const list = getExtendedPresets({ yesterday: 'Ayer' });
    const yesterday = list.find((p) => p.key === 'yesterday');
    expect(yesterday?.label).toBe('Ayer');
  });
});
