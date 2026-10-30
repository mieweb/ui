import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFocusTrap } from './useFocusTrap';

function Trap({
  initialFocus,
  extra = false,
}: {
  initialFocus?: boolean;
  extra?: boolean;
}) {
  const ref = useFocusTrap<HTMLDivElement>(true, { initialFocus });
  return (
    <div ref={ref}>
      <button type="button">First</button>
      <button type="button">Second</button>
      {extra && <button type="button">Added</button>}
    </div>
  );
}

function HiddenEnds() {
  const ref = useFocusTrap<HTMLDivElement>(true);
  return (
    <div ref={ref}>
      <header data-css-hidden="">
        <button type="button">Hidden by CSS</button>
      </header>
      <button type="button" disabled>
        Disabled
      </button>
      <button type="button">First</button>
      <input type="file" tabIndex={-1} aria-label="Attach" />
      <div inert>
        <button type="button">Inert</button>
      </div>
      <button type="button">Last</button>
      <button type="button" data-css-hidden="">
        Also hidden
      </button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('focuses the first element when it turns on', () => {
    render(<Trap />);
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('leaves focus alone with initialFocus false', () => {
    render(<Trap initialFocus={false} />);
    expect(document.body).toHaveFocus();
  });

  it('wraps Tab at both ends, including elements added later', () => {
    const { rerender } = render(<Trap />);
    rerender(<Trap extra />);
    const added = screen.getByRole('button', { name: 'Added' });
    added.focus();
    fireEvent.keyDown(added, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'First' }), {
      key: 'Tab',
      shiftKey: true,
    });
    expect(added).toHaveFocus();
  });

  it('wraps between the visible, enabled, tabbable ends', () => {
    // jsdom has no layout: stand in for CSS hiding.
    HTMLElement.prototype.checkVisibility = vi.fn(function (this: HTMLElement) {
      return !this.closest('[data-css-hidden]');
    });
    try {
      render(<HiddenEnds />);
      const first = screen.getByRole('button', { name: 'First' });
      const last = screen.getByRole('button', { name: 'Last' });
      expect(first).toHaveFocus();
      fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
      expect(last).toHaveFocus();
      fireEvent.keyDown(last, { key: 'Tab' });
      expect(first).toHaveFocus();
    } finally {
      delete (HTMLElement.prototype as { checkVisibility?: unknown })
        .checkVisibility;
    }
  });
});
