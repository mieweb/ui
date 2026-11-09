import { describe, expect, it } from 'vitest';
import {
  formatRegionalDate,
  formatRegionalDateInput,
  parseRegionalDate,
  regionalDatePlaceholder,
} from './date';

describe('regional calendar dates', () => {
  it.each([
    ['en-US', '11/09/2026', 'MM/DD/YYYY'],
    ['en-GB', '09/11/2026', 'DD/MM/YYYY'],
    ['de-DE', '09.11.2026', 'DD.MM.YYYY'],
    ['sv-SE', '2026-11-09', 'YYYY-MM-DD'],
    ['cs-CZ', '09. 11. 2026', 'DD. MM. YYYY'],
    ['ko-KR', '2026. 11. 09.', 'YYYY. MM. DD.'],
    ['bg-BG', '09.11.2026 г.', 'DD.MM.YYYY\u202fг.'],
  ])(
    'round-trips %s without changing the stored date',
    (locale, text, placeholder) => {
      expect(formatRegionalDate('2026-11-09', locale)).toBe(text);
      expect(formatRegionalDate('2026-11-09T00:00:00Z', locale)).toBe(text);
      expect(formatRegionalDate('11/09/2026', locale)).toBe(text);
      expect(parseRegionalDate(text, locale)).toBe('11/09/2026');
      expect(regionalDatePlaceholder(locale)).toBe(placeholder);
    }
  );

  it('round-trips localized numerals and directional marks', () => {
    const text = formatRegionalDate('2026-11-09', 'ar-EG');
    expect(parseRegionalDate(text, 'ar-EG')).toBe('11/09/2026');
  });

  it('uses the Gregorian calendar even where the regional default differs', () => {
    const text = formatRegionalDate('2026-11-09', 'th-TH');
    expect(text).toContain('2026');
    expect(parseRegionalDate(text, 'th-TH')).toBe('11/09/2026');
  });

  it('rejects invalid and incomplete input, including non-leap February 29', () => {
    expect(parseRegionalDate('29/02/2025', 'en-GB')).toBeUndefined();
    expect(parseRegionalDate('31.04.2026', 'de-DE')).toBeUndefined();
    expect(parseRegionalDate('09/11/20', 'en-GB')).toBeUndefined();
    expect(parseRegionalDate('29/02/2024', 'en-GB')).toBe('02/29/2024');
  });

  it.each([
    ['en-US', '11092026', '11/09/2026'],
    ['en-GB', '09112026', '09/11/2026'],
    ['de-DE', '09112026', '09.11.2026'],
    ['sv-SE', '20261109', '2026-11-09'],
    ['cs-CZ', '09112026', '09. 11. 2026'],
    ['ko-KR', '20261109', '2026. 11. 09.'],
    ['bg-BG', '09112026', '09.11.2026\u202fг.'],
  ])(
    'auto-formats numeric keyboard entry for %s',
    (locale, digits, expected) => {
      expect(formatRegionalDateInput(digits, locale)).toBe(expected);
      expect(
        parseRegionalDate(formatRegionalDateInput(digits, locale), locale)
      ).toBe('11/09/2026');
    }
  );

  it('does not append trailing literals to incomplete numeric entry', () => {
    expect(formatRegionalDateInput('', 'ko-KR')).toBe('');
    expect(formatRegionalDateInput('2026110', 'ko-KR')).toBe('2026. 11. 0');
    expect(parseRegionalDate(' 09. 11. 2026 ', 'cs-CZ')).toBe('11/09/2026');
  });

  it('accepts regional whitespace without making punctuation optional', () => {
    expect(parseRegionalDate('2026.11.09.', 'ko-KR')).toBe('11/09/2026');
    expect(parseRegionalDate('2026.\u00a011.\u00a009.', 'ko-KR')).toBe(
      '11/09/2026'
    );
    expect(parseRegionalDate('09.11.2026\u00a0г.', 'bg-BG')).toBe('11/09/2026');
    expect(parseRegionalDate('2026. 11. 09', 'ko-KR')).toBeUndefined();
    expect(parseRegionalDate('09.11.2026', 'bg-BG')).toBeUndefined();
  });

  it.each(['ko-KR', 'bg-BG'])('keeps partial %s entry incomplete', (locale) => {
    expect(formatRegionalDateInput('', locale)).toBe('');
    expect(
      parseRegionalDate(formatRegionalDateInput('2026110', locale), locale)
    ).toBeUndefined();
    expect(formatRegionalDateInput('20', locale)).toBe('20');
  });

  it('preserves empty and unparseable display values', () => {
    expect(formatRegionalDate(undefined)).toBe('');
    expect(formatRegionalDate('')).toBe('');
    expect(formatRegionalDate('not-a-date')).toBe('not-a-date');
    expect(formatRegionalDate('2026-02-31')).toBe('2026-02-31');
  });
});
