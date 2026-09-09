import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ReadingProgressBar } from './ReadingProgressBar';

function mockScrollMetrics({
  scrollTop = 0,
  scrollHeight = 2000,
  clientHeight = 1000,
}) {
  Object.defineProperty(document.documentElement, 'scrollTop', {
    configurable: true,
    value: scrollTop,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  });
}

function fill(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="reading-progress-fill"]'
  ) as HTMLElement;
}

describe('ReadingProgressBar', () => {
  beforeEach(() => {
    // rAF fires synchronously so scroll-driven updates apply immediately
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts at 0% at the top of the document', () => {
    mockScrollMetrics({ scrollTop: 0 });
    const { container } = renderWithTheme(<ReadingProgressBar />);
    expect(fill(container).style.width).toBe('0%');
  });

  it('tracks scroll position', () => {
    mockScrollMetrics({ scrollTop: 0 });
    const { container } = renderWithTheme(<ReadingProgressBar />);

    mockScrollMetrics({ scrollTop: 500 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(fill(container).style.width).toBe('50%');

    mockScrollMetrics({ scrollTop: 1000 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(fill(container).style.width).toBe('100%');
  });

  it('clamps to 100% and handles unscrollable documents', () => {
    mockScrollMetrics({ scrollTop: 5000 });
    const { container, rerender } = renderWithTheme(<ReadingProgressBar />);
    expect(fill(container).style.width).toBe('100%');

    mockScrollMetrics({ scrollTop: 0, scrollHeight: 800, clientHeight: 1000 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    rerender(<ReadingProgressBar />);
    expect(fill(container).style.width).toBe('0%');
  });

  it('is hidden from assistive tech and accepts a custom bar class', () => {
    mockScrollMetrics({ scrollTop: 0 });
    const { container } = renderWithTheme(
      <ReadingProgressBar barClassName="bg-warning" />
    );
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(fill(container)).toHaveClass('bg-warning');
  });
});
