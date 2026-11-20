import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { toolbarKeyNav } from './RowActionToolbar';

describe('toolbarKeyNav', () => {
  function renderToolbar() {
    renderWithTheme(
      <div role="toolbar" aria-label="Row actions" onKeyDown={toolbarKeyNav}>
        <button type="button">First</button>
        <button type="button">Second</button>
        <button type="button">Third</button>
      </div>
    );
    return screen.getByRole('toolbar');
  }

  it('moves focus with arrow keys and Home/End', () => {
    const toolbar = renderToolbar();
    screen.getByRole('button', { name: 'Second' }).focus();

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Third' })).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'Home' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'End' });
    expect(screen.getByRole('button', { name: 'Third' })).toHaveFocus();
  });

  it('inverts horizontal arrows under RTL', () => {
    const toolbar = renderToolbar();
    // jsdom does not cascade dir → direction; set both on the handler element.
    toolbar.setAttribute('dir', 'rtl');
    toolbar.style.direction = 'rtl';
    screen.getByRole('button', { name: 'Second' }).focus();

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();

    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });
});
