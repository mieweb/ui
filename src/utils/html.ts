/**
 * Extracts visible text from an HTML string without using regex.
 * Uses a simple character-by-character state machine to skip tags.
 * This avoids CodeQL false-positives associated with regex-based tag stripping.
 */
export function stripHtmlTags(html: string): string {
  let result = '';
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '<') {
      inTag = true;
    } else if (html[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      result += html[i];
    }
  }
  return result;
}

/**
 * Returns true when an HTML string has no visible text content.
 * This is a visibility check, not a sanitizer — do NOT use for XSS prevention.
 */
export function isHtmlEmpty(html: string): boolean {
  return (
    stripHtmlTags(html)
      .replace(/&nbsp;/g, ' ')
      .trim().length === 0
  );
}
