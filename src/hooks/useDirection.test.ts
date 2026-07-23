import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createRef } from 'react';

import { isRtlLocale, useDirection } from './useDirection';

/**
 * jsdom does not implement the UA `[dir="rtl"] { direction: rtl }` cascade,
 * nor inheritance of `direction` — `getComputedStyle` only reflects an inline
 * style on the element itself. So tests set BOTH the `dir` attribute (which
 * drives the hook's MutationObserver) and the inline style (which drives its
 * `getComputedStyle` resolution). In real browsers the attribute alone does
 * both.
 */
function setDir(el: HTMLElement, dir: 'ltr' | 'rtl' | null) {
  if (dir === null) {
    el.removeAttribute('dir');
    el.style.removeProperty('direction');
  } else {
    el.style.direction = dir;
    el.setAttribute('dir', dir);
  }
}

afterEach(() => {
  // Unmount hooks BEFORE resetting dir, so the MutationObserver doesn't fire
  // a state update outside act().
  cleanup();
  setDir(document.documentElement, null);
});

describe('isRtlLocale', () => {
  it('returns true for RTL languages', () => {
    for (const locale of ['ar', 'he', 'fa', 'ur']) {
      expect(isRtlLocale(locale)).toBe(true);
    }
  });

  it('handles region subtags, underscores, and casing', () => {
    expect(isRtlLocale('ar-EG')).toBe(true);
    expect(isRtlLocale('he_IL')).toBe(true);
    expect(isRtlLocale('AR')).toBe(true);
  });

  it('returns false for LTR locales', () => {
    for (const locale of ['en', 'en-US', 'es', 'fr', 'zh-CN']) {
      expect(isRtlLocale(locale)).toBe(false);
    }
  });
});

describe('useDirection', () => {
  it('defaults to ltr', () => {
    const { result } = renderHook(() => useDirection());
    expect(result.current).toBe('ltr');
  });

  it('resolves rtl when the document is rtl before mount', () => {
    setDir(document.documentElement, 'rtl');
    const { result } = renderHook(() => useDirection());
    expect(result.current).toBe('rtl');
  });

  it('resolves from the ref element, respecting a local dir override', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    setDir(container, 'rtl');
    const ref = createRef<HTMLElement | null>();
    ref.current = container;

    const { result } = renderHook(() => useDirection(ref));
    expect(result.current).toBe('rtl');
    // Document itself is still LTR.
    expect(getComputedStyle(document.documentElement).direction).not.toBe(
      'rtl'
    );

    container.remove();
  });

  it('updates when the dir attribute changes after mount', async () => {
    const { result } = renderHook(() => useDirection());
    expect(result.current).toBe('ltr');

    // Flush the MutationObserver microtask inside act().
    await act(async () => {
      setDir(document.documentElement, 'rtl');
      await Promise.resolve();
    });
    expect(result.current).toBe('rtl');

    await act(async () => {
      setDir(document.documentElement, 'ltr');
      await Promise.resolve();
    });
    expect(result.current).toBe('ltr');
  });

  it('updates when dir changes on a nested element it observes via subtree', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const ref = createRef<HTMLElement | null>();
    ref.current = container;

    const { result } = renderHook(() => useDirection(ref));
    expect(result.current).toBe('ltr');

    await act(async () => {
      setDir(container, 'rtl');
      await Promise.resolve();
    });
    expect(result.current).toBe('rtl');

    container.remove();
  });
});
