import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, stripUSCountryCode } from './phone';

describe('stripUSCountryCode', () => {
  it('drops a leading 1 from an 11-digit US number', () => {
    expect(stripUSCountryCode('15551234567')).toBe('5551234567');
    expect(stripUSCountryCode('+1 (555) 123-4567')).toBe('5551234567');
    expect(formatPhoneNumber(stripUSCountryCode('+15551234567'))).toBe(
      '(555) 123-4567'
    );
  });

  it('leaves 10-digit, non-US and partial numbers unchanged', () => {
    expect(stripUSCountryCode('(555) 123-4567')).toBe('(555) 123-4567');
    expect(stripUSCountryCode('25551234567')).toBe('25551234567');
    expect(stripUSCountryCode('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(stripUSCountryCode('')).toBe('');
  });
});
