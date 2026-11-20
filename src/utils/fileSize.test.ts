import { describe, expect, it } from 'vitest';
import { formatFileSize } from './fileSize';

describe('formatFileSize', () => {
  it('reads as it always has in English', () => {
    expect(formatFileSize(512, 'en-US')).toBe('512 B');
    expect(formatFileSize(1023, 'en-US')).toBe('1023 B');
    expect(formatFileSize(1536, 'en-US')).toBe('1.5 KB');
    expect(formatFileSize(2.1 * 1024 ** 2, 'en-US')).toBe('2.1 MB');
    expect(formatFileSize(2 * 1024 ** 2, 'en-US')).toBe('2.0 MB');
    expect(formatFileSize(1.2 * 1024 ** 3, 'en-US')).toBe('1.2 GB');
    expect(formatFileSize(2048 * 1024 ** 3, 'en-US')).toBe('2048.0 GB');
  });

  it("writes the number for the locale it's given", () => {
    expect(formatFileSize(1536, 'de-DE')).toBe('1,5 KB');
  });
});
