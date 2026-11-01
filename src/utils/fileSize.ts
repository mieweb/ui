/**
 * A byte count as people read it: `512 B`, `1.5 KB`, `2.0 MB`, `1.2 GB`. The
 * number is written for `locale` (the browser's when left out), e.g. `1,5 KB`
 * in German; the units stay as they are.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  // One decimal past bytes, and no grouping, so English reads as it always has.
  const number = (value: number, digits: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    }).format(value);
  if (bytes < 1024) return `${number(bytes, 0)} B`;
  if (bytes < 1024 ** 2) return `${number(bytes / 1024, 1)} KB`;
  if (bytes < 1024 ** 3) return `${number(bytes / 1024 ** 2, 1)} MB`;
  return `${number(bytes / 1024 ** 3, 1)} GB`;
}
