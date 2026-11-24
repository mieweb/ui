import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MentionMenu, type MentionMenuState } from './useMentionAutocomplete';

const suggestions = ['Ann', 'Bo', 'Cy'].map((label) => ({ id: label, label }));

const state = (highlight: number): MentionMenuState => ({
  menuOpen: true,
  suggestions,
  highlight,
  listId: 'list',
  optionId: (i) => `list-option-${i}`,
  floatingRef: { current: null },
  menuStyle: {},
  insert: () => undefined,
  setHighlight: () => undefined,
});

describe('MentionMenu', () => {
  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it('scrolls the highlighted option into view as it moves', () => {
    // jsdom has no layout, so scrollIntoView is absent; record the calls.
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = vi.fn(function (this: Element) {
      scrolled.push(this.id);
    });

    const { rerender } = render(<MentionMenu mention={state(0)} />);
    rerender(<MentionMenu mention={state(2)} />);

    expect(scrolled).toEqual(['list-option-0', 'list-option-2']);
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({
      block: 'nearest',
    });
  });
});
