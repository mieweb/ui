import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  KEYBOARD_INSET_VAR,
  KEYBOARD_OPEN_ATTRIBUTE,
  VISUAL_VIEWPORT_HEIGHT_VAR,
  VISUAL_VIEWPORT_OFFSET_TOP_VAR,
  useKeyboardInset,
} from './useKeyboardInset';

class FakeVisualViewport extends globalThis.EventTarget {
  height = 800;
  offsetTop = 0;
  scale = 1;
}

const root = document.documentElement;

function cssVar(name: string) {
  return root.style.getPropertyValue(name);
}

describe('useKeyboardInset', () => {
  let viewport: FakeVisualViewport;

  beforeEach(() => {
    viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);
    // Run frame callbacks synchronously so each event is measured at once.
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: (time: number) => void) => {
        callback(0);
        return 1;
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function openKeyboard(height: number, offsetTop = 0) {
    viewport.height = 800 - height;
    viewport.offsetTop = offsetTop;
    act(() => {
      viewport.dispatchEvent(new Event('resize'));
    });
  }

  it('reports a closed keyboard initially', () => {
    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toEqual({ keyboardInset: 0, isKeyboardOpen: false });
    expect(cssVar(KEYBOARD_INSET_VAR)).toBe('0px');
    expect(cssVar(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('800px');
    expect(root.hasAttribute(KEYBOARD_OPEN_ATTRIBUTE)).toBe(false);
  });

  it('publishes the keyboard height and visible area when it opens', () => {
    const { result } = renderHook(() => useKeyboardInset());

    // iOS pans the page up by offsetTop; the covered part is what remains.
    openKeyboard(340, 40);

    expect(result.current).toEqual({
      keyboardInset: 300,
      isKeyboardOpen: true,
    });
    expect(cssVar(KEYBOARD_INSET_VAR)).toBe('300px');
    expect(cssVar(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('460px');
    expect(cssVar(VISUAL_VIEWPORT_OFFSET_TOP_VAR)).toBe('40px');
    expect(root.hasAttribute(KEYBOARD_OPEN_ATTRIBUTE)).toBe(true);
  });

  it('ignores pinch-zoom', () => {
    const { result } = renderHook(() => useKeyboardInset());

    viewport.scale = 2;
    openKeyboard(400);

    expect(result.current.isKeyboardOpen).toBe(false);
    expect(cssVar(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('800px');
  });

  it('clears everything on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardInset());
    openKeyboard(300);

    unmount();

    expect(cssVar(KEYBOARD_INSET_VAR)).toBe('');
    expect(cssVar(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('');
    expect(root.hasAttribute(KEYBOARD_OPEN_ATTRIBUTE)).toBe(false);
  });

  it('does nothing when disabled', () => {
    renderHook(() => useKeyboardInset({ enabled: false }));
    expect(cssVar(KEYBOARD_INSET_VAR)).toBe('');
  });
});
