import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAnchoredPosition,
  type UseAnchoredPositionOptions,
} from './useAnchoredPosition';

// jsdom viewport defaults used throughout: 1024 x 768.
const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 768;

interface RectInit {
  top: number;
  left: number;
  width: number;
  height: number;
}

function makeRect({ top, left, width, height }: RectInit): globalThis.DOMRect {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as globalThis.DOMRect;
}

interface SetupInput {
  options?: Omit<UseAnchoredPositionOptions, 'open'>;
  anchorRect: RectInit;
  /** Natural content size of the floating element */
  floatingSize?: { width: number; height: number };
}

/**
 * Renders the hook closed, attaches mock anchor/floating elements with
 * stubbed layout measurements, then opens it so `update()` runs.
 */
function setup({
  options = {},
  anchorRect,
  floatingSize = { width: 250, height: 200 },
}: SetupInput) {
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = () => makeRect(anchorRect);

  const floating = document.createElement('div');
  Object.defineProperty(floating, 'scrollHeight', {
    configurable: true,
    get: () => floatingSize.height,
  });
  Object.defineProperty(floating, 'offsetWidth', {
    configurable: true,
    get: () => floatingSize.width,
  });

  const { result, rerender } = renderHook(
    (props: UseAnchoredPositionOptions) => useAnchoredPosition(props),
    { initialProps: { open: false, ...options } }
  );
  result.current.anchorRef.current = anchor;
  result.current.floatingRef.current = floating;
  act(() => rerender({ open: true, ...options }));

  return { result, rerender, anchor, floating, options };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAnchoredPosition', () => {
  it('hides the floating element while closed, without transitions', () => {
    const { result } = renderHook(() => useAnchoredPosition({ open: false }));
    expect(result.current.style).toMatchObject({
      position: 'fixed',
      visibility: 'hidden',
      transition: 'none',
    });
  });

  it('positions below the anchor for bottom-start', () => {
    const { result } = setup({
      anchorRect: { top: 100, left: 200, width: 150, height: 40 },
    });
    expect(result.current.actualSide).toBe('bottom');
    expect(result.current.style).toMatchObject({
      position: 'fixed',
      top: 140 + 4, // anchor bottom + default offset
      left: 200,
      transition: 'none',
    });
    // Available space below: 768 - 140 - 4 (offset) - 8 (padding)
    expect(result.current.style.maxHeight).toBe(616);
  });

  it('flips above the anchor when there is not enough space below', () => {
    const { result } = setup({
      anchorRect: { top: 600, left: 200, width: 150, height: 40 },
      floatingSize: { width: 250, height: 200 },
    });
    expect(result.current.actualSide).toBe('top');
    expect(result.current.style.top).toBeUndefined();
    // Anchored to the anchor's top edge via `bottom`
    expect(result.current.style.bottom).toBe(VIEWPORT_HEIGHT - 600 + 4);
  });

  it('keeps the preferred top placement when space allows', () => {
    const { result } = setup({
      options: { placement: 'top-start' },
      anchorRect: { top: 600, left: 200, width: 150, height: 40 },
    });
    expect(result.current.actualSide).toBe('top');
  });

  it('clamps the left edge to the viewport padding', () => {
    const { result } = setup({
      options: { placement: 'bottom-end' },
      anchorRect: { top: 100, left: 10, width: 50, height: 40 },
      floatingSize: { width: 250, height: 200 },
    });
    // right-aligned would be 60 - 250 = -190 → clamped to padding
    expect(result.current.style.left).toBe(8);
  });

  it('clamps the right edge to the viewport padding', () => {
    const { result } = setup({
      anchorRect: { top: 100, left: 900, width: 100, height: 40 },
      floatingSize: { width: 250, height: 200 },
    });
    // left-aligned would be 900 → clamped to 1024 - 250 - 8
    expect(result.current.style.left).toBe(VIEWPORT_WIDTH - 250 - 8);
  });

  it('matches the anchor width with matchWidth', () => {
    const { result } = setup({
      options: { matchWidth: true },
      anchorRect: { top: 100, left: 200, width: 150, height: 40 },
    });
    expect(result.current.style.width).toBe(150);
  });

  it('uses the anchor width as a minimum with matchMinWidth', () => {
    const { result } = setup({
      options: { matchMinWidth: true },
      anchorRect: { top: 100, left: 800, width: 300, height: 40 },
      floatingSize: { width: 100, height: 200 },
    });
    expect(result.current.style.minWidth).toBe(300);
    // Horizontal clamping accounts for the min width, not offsetWidth
    expect(result.current.style.left).toBe(VIEWPORT_WIDTH - 300 - 8);
  });

  it('caps the height with maxHeight when space allows more', () => {
    const { result } = setup({
      options: { maxHeight: 300 },
      anchorRect: { top: 100, left: 200, width: 150, height: 40 },
      floatingSize: { width: 250, height: 500 },
    });
    expect(result.current.style.maxHeight).toBe(300);
  });

  it('clamps the height to the viewport even without maxHeight', () => {
    const { result } = setup({
      anchorRect: { top: 700, left: 200, width: 150, height: 40 },
      floatingSize: { width: 250, height: 10 },
    });
    // Tiny content prefers bottom; only 768 - 740 - 4 - 8 px available
    expect(result.current.style.maxHeight).toBe(16);
  });

  it('coalesces scroll events into one update per animation frame', () => {
    const rafQueue: globalThis.FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: globalThis.FrameRequestCallback) => {
        rafQueue.push(cb);
        return rafQueue.length;
      }
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const { result, anchor } = setup({
      anchorRect: { top: 100, left: 200, width: 150, height: 40 },
    });
    expect(result.current.style.top).toBe(144);

    // Anchor moves, then several scroll events land in the same frame.
    anchor.getBoundingClientRect = () =>
      makeRect({ top: 50, left: 200, width: 150, height: 40 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });
    expect(rafQueue).toHaveLength(1);
    expect(result.current.style.top).toBe(144); // not yet recomputed

    act(() => rafQueue.forEach((cb) => cb(0)));
    expect(result.current.style.top).toBe(90 + 4);
  });

  it('returns to the hidden style when closed again', () => {
    const { result, rerender } = setup({
      anchorRect: { top: 100, left: 200, width: 150, height: 40 },
    });
    act(() => rerender({ open: false }));
    expect(result.current.style.visibility).toBe('hidden');
  });
});
