/**
 * The media sanitizer's opaque-origin gate (mieweb/ui#749 review).
 *
 * In an opaque-origin host — a file-based WebView (Cordova), a sandboxed
 * iframe — `window.location.origin` serializes as `'null'`, and so does a
 * `data:` URL's origin: naive origin equality would re-admit embedded image
 * bytes. DOMPurify exempts img `data:` URIs from its URI policy, making the
 * sanitizer's own gate the only defense, so it runs in its own jsdom
 * environment whose document URL has an opaque origin (jsdom's `location` is
 * unforgeable and cannot be stubbed in the main suite).
 *
 * @vitest-environment jsdom
 * @vitest-environment-options {"url": "file:///opaque/host/index.html"}
 */
import { describe, expect, it } from 'vitest';
import { sanitizeNarrativeHtml } from './EsheetNarrativeField';

// Some jsdom versions deny localStorage to opaque origins with a throwing
// getter, which would crash the shared setup's hooks (even its `typeof`
// guard invokes the getter). Module scope runs at collection — before any
// beforeAll executes — so probe here and install a plain mock only if needed.
try {
  void window.localStorage;
} catch {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return storage.size;
      },
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
    },
  });
}

const img = (src: string) => `<p>Note</p><img src="${src}" alt="scan">`;

describe('sanitizeNarrativeHtml in an opaque-origin host (mieweb/ui#736)', () => {
  it('runs with a null host origin', () => {
    expect(window.location.origin).toBe('null');
  });

  it('strips data: images — opaque origins never count as same-origin', () => {
    expect(
      sanitizeNarrativeHtml(img('data:image/png;base64,iVBORw0KGgo='), {
        media: true,
      })
    ).toBe('<p>Note</p>');
  });

  it('strips relative URLs, which resolve to the opaque file: host', () => {
    expect(
      sanitizeNarrativeHtml(img('/uploads/scan.png'), { media: true })
    ).toBe('<p>Note</p>');
  });

  it('still keeps https image URLs', () => {
    expect(
      sanitizeNarrativeHtml(img('https://cdn.example/scan.png'), {
        media: true,
      })
    ).toBe('<p>Note</p><img src="https://cdn.example/scan.png" alt="scan">');
  });
});
