import * as React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { useStickToBottom } from './useStickToBottom';

// Controllable ResizeObserver: tests trigger callbacks explicitly to simulate
// content growth (streaming tokens — no thread-length change) and container
// resizes, both while pinned and while scrolled up.
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  targets: Element[] = [];
  constructor(
    private callback: (entries: unknown[], observer: unknown) => void
  ) {
    MockResizeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  unobserve(target: Element) {
    this.targets = this.targets.filter((t) => t !== target);
  }
  disconnect() {
    this.targets = [];
  }
  static trigger() {
    for (const instance of MockResizeObserver.instances) {
      if (instance.targets.length > 0) {
        instance.callback([], instance);
      }
    }
  }
}

function Harness({
  disabled = false,
  containerKey = 'a',
  initialMetrics,
}: {
  disabled?: boolean;
  containerKey?: string;
  /** Applied via callback ref so the node has geometry before effects run. */
  initialMetrics?: { scrollHeight?: number; clientHeight?: number };
}) {
  const { containerRef, contentRef, isAtBottom, scrollToBottom } =
    useStickToBottom({ disabled });
  const attachContainer = (node: HTMLDivElement | null) => {
    if (node && initialMetrics) mockMetrics(node, initialMetrics);
    containerRef.current = node;
  };
  return (
    <div>
      {/* `key` swaps the container DOM node without remounting the hook —
          the same shape as SuperChat toggling its virtualized thread. */}
      <div key={containerKey} data-testid="container" ref={attachContainer}>
        <div ref={contentRef} />
      </div>
      <output data-testid="at-bottom">{String(isAtBottom)}</output>
      <button onClick={() => scrollToBottom()}>jump</button>
    </div>
  );
}

function mockMetrics(
  el: HTMLElement,
  { scrollHeight = 1000, clientHeight = 400 } = {}
) {
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  });
}

describe('useStickToBottom', () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('re-pins on content growth while at the bottom (streaming, no append)', () => {
    render(<Harness />);
    const container = screen.getByTestId('container');
    mockMetrics(container);
    container.scrollTop = 600; // 1000 - 600 - 400 = 0 → at the bottom
    fireEvent.scroll(container);

    mockMetrics(container, { scrollHeight: 1400 }); // stream grew the content
    act(() => MockResizeObserver.trigger());

    expect(container.scrollTop).toBe(1400);
    expect(screen.getByTestId('at-bottom').textContent).toBe('true');
  });

  it('re-pins on container shrink while at the bottom (keyboard / composer growth)', () => {
    render(<Harness />);
    const container = screen.getByTestId('container');
    mockMetrics(container);
    container.scrollTop = 600;
    fireEvent.scroll(container);

    mockMetrics(container, { clientHeight: 250 }); // viewport shrank
    act(() => MockResizeObserver.trigger());

    expect(container.scrollTop).toBe(container.scrollHeight);
  });

  it('leaves the scroll position alone on growth while scrolled up', () => {
    render(<Harness />);
    const container = screen.getByTestId('container');
    mockMetrics(container);
    container.scrollTop = 100; // reading older messages
    fireEvent.scroll(container);
    expect(screen.getByTestId('at-bottom').textContent).toBe('false');

    mockMetrics(container, { scrollHeight: 1400 });
    act(() => MockResizeObserver.trigger());

    expect(container.scrollTop).toBe(100);
    expect(screen.getByTestId('at-bottom').textContent).toBe('false');
  });

  it('scrollToBottom pins immediately so a concurrent stream keeps following', () => {
    render(<Harness />);
    const container = screen.getByTestId('container');
    mockMetrics(container);
    container.scrollTop = 100;
    fireEvent.scroll(container);

    fireEvent.click(screen.getByText('jump'));
    expect(container.scrollTop).toBe(container.scrollHeight);
    expect(screen.getByTestId('at-bottom').textContent).toBe('true');

    // Growth right after the jump follows again without a scroll event.
    mockMetrics(container, { scrollHeight: 1600 });
    act(() => MockResizeObserver.trigger());
    expect(container.scrollTop).toBe(1600);
  });

  it('re-binds when the container node is swapped (e.g. virtualized toggle)', () => {
    const { rerender } = render(<Harness containerKey="plain" />);
    const first = screen.getByTestId('container');
    mockMetrics(first);
    first.scrollTop = 600;
    fireEvent.scroll(first);

    rerender(<Harness containerKey="virtualized" />);
    const second = screen.getByTestId('container');
    expect(second).not.toBe(first);

    // The scroll listener follows the new node…
    mockMetrics(second);
    second.scrollTop = 100;
    fireEvent.scroll(second);
    expect(screen.getByTestId('at-bottom').textContent).toBe('false');

    // …and so does the observer: growth while re-pinned targets the new node.
    second.scrollTop = 600;
    fireEvent.scroll(second);
    mockMetrics(second, { scrollHeight: 1400 });
    act(() => MockResizeObserver.trigger());
    expect(second.scrollTop).toBe(1400);
  });

  it('keeps a pinned reader at the bottom across a node swap', () => {
    const metrics = { scrollHeight: 1000, clientHeight: 400 };
    const { rerender } = render(
      <Harness containerKey="plain" initialMetrics={metrics} />
    );
    const first = screen.getByTestId('container');
    first.scrollTop = 600;
    fireEvent.scroll(first); // pinned at the bottom

    rerender(<Harness containerKey="virtualized" initialMetrics={metrics} />);
    const second = screen.getByTestId('container');
    expect(second).not.toBe(first);

    // The fresh node starts at scrollTop 0 — the hook must re-anchor it to the
    // bottom instead of demoting the reader to "scrolled up".
    expect(second.scrollTop).toBe(1000);
    expect(screen.getByTestId('at-bottom').textContent).toBe('true');
  });

  it('does not move a scrolled-up reader to the bottom across a node swap', () => {
    const metrics = { scrollHeight: 1000, clientHeight: 400 };
    const { rerender } = render(
      <Harness containerKey="plain" initialMetrics={metrics} />
    );
    const first = screen.getByTestId('container');
    first.scrollTop = 100;
    fireEvent.scroll(first); // reading older messages

    rerender(<Harness containerKey="virtualized" initialMetrics={metrics} />);
    const second = screen.getByTestId('container');

    expect(second.scrollTop).toBe(0); // not yanked to the bottom
    expect(screen.getByTestId('at-bottom').textContent).toBe('false');
  });

  it('does nothing while disabled', () => {
    render(<Harness disabled />);
    const container = screen.getByTestId('container');
    mockMetrics(container);
    container.scrollTop = 100;
    fireEvent.scroll(container);

    // No listener: isAtBottom never leaves its initial true.
    expect(screen.getByTestId('at-bottom').textContent).toBe('true');

    // No observer: growth does not move the scroll position.
    mockMetrics(container, { scrollHeight: 1400 });
    act(() => MockResizeObserver.trigger());
    expect(container.scrollTop).toBe(100);
  });
});
