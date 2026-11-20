/**
 * A freshly opened virtualized thread is kept at its end for a moment while
 * its rows are measured ("settling"), until the reader takes over.
 */
import * as React from 'react';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { SuperChat } from './SuperChat';
import type { SuperChatConversation, SuperChatMessage } from './types';

/** Stands in for the browser's: fired by hand, as rows are measured. */
class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  targets: Element[] = [];
  constructor(private callback: () => void) {
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
  /** Every observer watching `target` hears it change size. */
  static resize(target: Element) {
    for (const instance of MockResizeObserver.instances)
      if (instance.targets.includes(target)) instance.callback();
  }
}

/** How long SuperChat settles a fresh virtualized thread (its SETTLE_MS). */
const SETTLE_MS = 1500;
/** The thread's viewport height in these tests. */
const VIEWPORT = 400;
/**
 * The virtualizer's scroll-end debounce (@tanstack/virtual's default
 * isScrollingResetDelay). A scroll event starts it and unmounting doesn't
 * cancel it.
 */
const SCROLL_END_MS = 150;

const message = (
  id: string,
  minute: number,
  extra: Partial<SuperChatMessage> = {}
): SuperChatMessage => ({
  id,
  participantId: 'peer',
  text: `Message ${id}`,
  time: new Date(Date.UTC(2026, 9, 3, 9, minute)).toISOString(),
  ...extra,
});

const conversation: SuperChatConversation = {
  id: 'c1',
  title: 'Photos',
  participants: [
    { id: 'me', kind: 'human', name: 'Me' },
    { id: 'peer', kind: 'human', name: 'Peer' },
  ],
  thread: [message('m1', 0), message('m2', 1)],
};

const streaming = (base: SuperChatConversation): SuperChatConversation => ({
  ...base,
  thread: [
    ...base.thread,
    message('reply', 2, { text: 'Typing…', status: 'streaming' }),
  ],
});

// jsdom has no layout: the thread's height is set by hand as its rows
// "measure".
let threadHeight = 1000;

function thread(container: HTMLElement) {
  return container.querySelector<HTMLDivElement>(
    '[data-slot="superchat-thread"]'
  )!;
}

/**
 * The rows measure taller and the virtualizer's correction leaves the view
 * short of the end, which the scroll hook reads as the reader leaving it.
 */
function growAndFallShort(el: HTMLDivElement) {
  const before = el.scrollTop;
  threadHeight += 1000;
  fireEvent.scroll(el);
  act(() => MockResizeObserver.resize(el.firstElementChild!));
  return before;
}

function renderThread(value: SuperChatConversation = conversation) {
  const view = render(
    <SuperChat conversation={value} currentParticipantId="me" virtualized />
  );
  const el = thread(view.container);
  expect(el.scrollTop).toBe(1000);
  return { ...view, el };
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  threadHeight = 1000;
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.slot === 'superchat-thread' ? threadHeight : 0;
    }
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    function (this: HTMLElement) {
      return this.dataset.slot === 'superchat-thread' ? VIEWPORT : 0;
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// Let the last tests' scroll-end timers fire while the page is still here:
// once the environment is torn down they throw "window is not defined".
afterAll(() => new Promise((done) => setTimeout(done, SCROLL_END_MS * 2)));

describe('settling a freshly opened virtualized thread', () => {
  it('keeps the thread at its end as its rows grow', () => {
    const { el } = renderThread();
    growAndFallShort(el);
    expect(el.scrollTop).toBe(2000);
    // A small correction upward is the virtualizer's, not the reader's.
    el.scrollTop = 2000 - VIEWPORT / 4;
    fireEvent.scroll(el);
    growAndFallShort(el);
    expect(el.scrollTop).toBe(3000);
  });

  it.each(['wheel', 'pointerDown', 'keyDown', 'touchStart'] as const)(
    'stops once the reader takes over (%s)',
    (input) => {
      const { el } = renderThread();
      fireEvent[input](el);
      const before = growAndFallShort(el);
      expect(el.scrollTop).toBe(before);
    }
  );

  it('stops at a jump up of more than half the viewport, as to a linked post', () => {
    const { el } = renderThread();
    el.scrollTop = 1000 - VIEWPORT / 2 - 1;
    fireEvent.scroll(el);
    const before = growAndFallShort(el);
    expect(el.scrollTop).toBe(before);
  });

  it('stops after its settling time', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { el } = renderThread();
    act(() => vi.advanceTimersByTime(SETTLE_MS));
    const before = growAndFallShort(el);
    expect(el.scrollTop).toBe(before);
  });

  it('does not pin a thread that opens on a streaming reply', () => {
    const { el } = renderThread(streaming(conversation));
    threadHeight += 1000;
    act(() => MockResizeObserver.resize(el.firstElementChild!));
    expect(el.scrollTop).toBe(1000);
  });

  it('does not pin over a stream that arrives while it settles', () => {
    const { el, rerender } = renderThread();
    rerender(
      <SuperChat
        conversation={streaming(conversation)}
        currentParticipantId="me"
        virtualized
      />
    );
    // The stream's first line is shown, then the thread holds there.
    expect(el.scrollTop).toBe(1000);
    threadHeight += 1000;
    act(() => MockResizeObserver.resize(el.firstElementChild!));
    expect(el.scrollTop).toBe(1000);
  });
});
