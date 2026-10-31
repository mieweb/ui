import * as React from 'react';
import { createPortal } from 'react-dom';
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

/** A trigger whose menu is portaled to the body, as Dropdown does. */
function WithPortaledMenu() {
  const ref = useFocusTrap<HTMLDivElement>(true, { initialFocus: false });
  return (
    <div ref={ref}>
      <button type="button" aria-expanded="true" aria-controls="menu">
        Attach
      </button>
      <button type="button">Send</button>
      {createPortal(
        <div id="menu" role="menu">
          <button type="button" role="menuitem">
            Photo
          </button>
          <button type="button" role="menuitem">
            File
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/** Dropdown's shape: a search field beside the menu, and a submenu. */
function WithSearchAndSubmenu() {
  const ref = useFocusTrap<HTMLDivElement>(true, { initialFocus: false });
  return (
    <div ref={ref}>
      <button type="button" aria-expanded="true" aria-controls="people">
        Mention
      </button>
      <button type="button">Send</button>
      {createPortal(
        <div>
          <input aria-label="Filter" />
          <div id="people" role="menu">
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded="true"
              aria-controls="teams"
            >
              Teams
            </button>
          </div>
        </div>,
        document.body
      )}
      {createPortal(
        <div id="teams" role="menu">
          <button type="button" role="menuitem">
            Design
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

/** A dialog's trap inside a panel's trap, its last control opening a menu. */
function NestedTraps() {
  const outer = useFocusTrap<HTMLDivElement>(true, { initialFocus: false });
  const inner = useFocusTrap<HTMLDivElement>(true, { initialFocus: false });
  return (
    <div ref={outer}>
      <button type="button">Panel</button>
      <div ref={inner}>
        <button type="button">Dialog first</button>
        <button type="button" aria-expanded="true" aria-controls="options">
          Options
        </button>
      </div>
      {createPortal(
        <div id="options" role="menu">
          <button type="button" role="menuitem">
            Option
          </button>
        </div>,
        document.body
      )}
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

  it('takes Tab through a portaled menu opened from inside, after its trigger', () => {
    render(<WithPortaledMenu />);
    const attach = screen.getByRole('button', { name: 'Attach' });
    const send = screen.getByRole('button', { name: 'Send' });
    const photo = screen.getByRole('menuitem', { name: 'Photo' });
    const file = screen.getByRole('menuitem', { name: 'File' });
    attach.focus();
    fireEvent.keyDown(attach, { key: 'Tab' });
    expect(photo).toHaveFocus();
    // Between the menu's own items, the browser's order is kept.
    file.focus();
    fireEvent.keyDown(file, { key: 'Tab' });
    expect(send).toHaveFocus();
    fireEvent.keyDown(send, { key: 'Tab', shiftKey: true });
    expect(file).toHaveFocus();
    send.focus();
    fireEvent.keyDown(send, { key: 'Tab' });
    expect(attach).toHaveFocus();
  });

  it('follows the whole popup: a search field beside the menu, and a submenu', () => {
    render(<WithSearchAndSubmenu />);
    const mention = screen.getByRole('button', { name: 'Mention' });
    const filter = screen.getByRole('textbox', { name: 'Filter' });
    const teams = screen.getByRole('menuitem', { name: 'Teams' });
    const design = screen.getByRole('menuitem', { name: 'Design' });
    mention.focus();
    fireEvent.keyDown(mention, { key: 'Tab' });
    expect(filter).toHaveFocus();
    teams.focus();
    fireEvent.keyDown(teams, { key: 'Tab', shiftKey: true });
    expect(filter).toHaveFocus();
    teams.focus();
    fireEvent.keyDown(teams, { key: 'Tab' });
    expect(design).toHaveFocus();
    fireEvent.keyDown(design, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Send' })).toHaveFocus();
  });

  it('lets the innermost trap take a menu opened inside it', () => {
    render(<NestedTraps />);
    const option = screen.getByRole('menuitem', { name: 'Option' });
    option.focus();
    fireEvent.keyDown(option, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Dialog first' })).toHaveFocus();
  });
});
