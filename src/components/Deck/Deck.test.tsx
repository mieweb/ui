import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import * as React from 'react';
import { Deck } from './Deck';
import { SlideFrame } from './SlideFrame';
import { slideRenderers } from './registry';
import { sampleDeck, sampleDeckMeta } from './storyData';
import type { Slide, SlideRendererProps } from './types';

type ObserverCallback = globalThis.IntersectionObserverCallback;

let observed: Array<{ cb: ObserverCallback; els: Element[] }> = [];

beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      entry: { cb: ObserverCallback; els: Element[] };
      constructor(cb: ObserverCallback) {
        this.entry = { cb, els: [] };
        observed.push(this.entry);
      }
      observe(el: Element) {
        this.entry.els.push(el);
      }
      disconnect() {}
      unobserve() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

/** Pretend the deck scrolled slide `i` into view. */
function show(i: number) {
  const deck = observed.find((o) => o.els.length > 1)!;
  const target = deck.els[i];
  act(() =>
    deck.cb(
      [
        {
          isIntersecting: true,
          target,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    )
  );
}

describe('Deck', () => {
  it('has a renderer for every built-in slide type in the sample', () => {
    for (const s of sampleDeck)
      if (s.type !== 'custom') expect(slideRenderers[s.type]).toBeDefined();
  });

  it('renders every sample slide as a labelled group with one h1', () => {
    render(<Deck slides={sampleDeck} meta={sampleDeckMeta} syncHash={false} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('region', { name: sampleDeckMeta.title })
    ).toBeInTheDocument();
    const slides = document.querySelectorAll('[data-slot="deck-slide"]');
    expect(slides).toHaveLength(sampleDeck.length);
    slides.forEach((s) =>
      expect(s).toHaveAttribute('aria-roledescription', 'slide')
    );
  });

  it('reports slide changes and navigates with the keyboard', () => {
    const onSlideChange = vi.fn();
    render(
      <Deck
        slides={sampleDeck}
        meta={sampleDeckMeta}
        syncHash={false}
        onSlideChange={onSlideChange}
      />
    );
    show(3);
    expect(onSlideChange).toHaveBeenLastCalledWith(sampleDeck[3], 3);
    expect(document.querySelector('[data-index="3"]')).toHaveAttribute(
      'data-seen'
    );
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('opens the outline dialog and jumps to a slide', () => {
    render(
      <Deck
        slides={sampleDeck.slice(0, 4)}
        meta={sampleDeckMeta}
        syncHash={false}
      />
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open slide outline' })[0]
    );
    const dialog = screen.getByRole('dialog', { name: 'Slides' });
    fireEvent.click(within(dialog).getAllByRole('button')[3]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders custom slides through `renderers`', () => {
    function Custom({ slide, index }: SlideRendererProps<Slide>) {
      return (
        <SlideFrame slide={slide} index={index} tone="light">
          <p>custom body</p>
        </SlideFrame>
      );
    }
    render(
      <Deck
        slides={[{ type: 'custom', component: 'x', title: 'Custom' }]}
        meta={sampleDeckMeta}
        renderers={{ x: Custom }}
        syncHash={false}
      />
    );
    expect(screen.getByText('custom body')).toBeInTheDocument();
  });

  it('switches tab panels with arrow keys without moving the deck', () => {
    const tabs = sampleDeck.find((s) => s.type === 'tabs')!;
    render(<Deck slides={[tabs]} meta={sampleDeckMeta} syncHash={false} />);
    const [first] = screen.getAllByRole('tab');
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it('inverts tab arrow keys under RTL', () => {
    const tabs = sampleDeck.find((s) => s.type === 'tabs')!;
    render(<Deck slides={[tabs]} meta={sampleDeckMeta} syncHash={false} />);
    const [first] = screen.getAllByRole('tab');
    // jsdom does not cascade dir → direction; set both on the handler element.
    first.setAttribute('dir', 'rtl');
    first.style.direction = 'rtl';
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('advances on ArrowLeft when the deck renders RTL', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Deck
        ref={ref}
        slides={sampleDeck.slice(0, 3)}
        meta={sampleDeckMeta}
        syncHash={false}
      />
    );
    ref.current!.setAttribute('dir', 'rtl');
    ref.current!.style.direction = 'rtl';
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('gives charts a screen-reader table of their values', () => {
    const chart = sampleDeck.find((s) => s.type === 'chart')!;
    render(<Deck slides={[chart]} meta={sampleDeckMeta} syncHash={false} />);
    expect(screen.getByRole('table')).toHaveTextContent('Jun');
  });
});
