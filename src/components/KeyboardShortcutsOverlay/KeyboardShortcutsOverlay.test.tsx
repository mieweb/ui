import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Kbd, KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

const SHORTCUTS = [
  { keys: ['j', '↓'], description: 'Next record' },
  { keys: '⌘K', description: 'Command palette' },
];

describe('Kbd', () => {
  it('renders a kbd element', () => {
    renderWithTheme(<Kbd>⌘K</Kbd>);
    const kbd = screen.getByText('⌘K');
    expect(kbd.tagName).toBe('KBD');
  });
});

describe('KeyboardShortcutsOverlay', () => {
  it('renders nothing while closed', () => {
    renderWithTheme(
      <KeyboardShortcutsOverlay
        open={false}
        onClose={() => {}}
        shortcuts={SHORTCUTS}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists shortcuts with key chips and alternatives', () => {
    renderWithTheme(
      <KeyboardShortcutsOverlay open onClose={() => {}} shortcuts={SHORTCUTS} />
    );
    expect(
      screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    ).toBeInTheDocument();
    expect(screen.getByText('Next record')).toBeInTheDocument();
    expect(screen.getByText('j')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('splits legacy "a / b" key strings into chips', () => {
    renderWithTheme(
      <KeyboardShortcutsOverlay
        open
        onClose={() => {}}
        shortcuts={[{ keys: 'e / a', description: 'Archive' }]}
      />
    );
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('renders grouped sections with headings', () => {
    renderWithTheme(
      <KeyboardShortcutsOverlay
        open
        onClose={() => {}}
        groups={[
          { title: 'Navigation', shortcuts: [SHORTCUTS[0]] },
          { title: 'Actions', shortcuts: [SHORTCUTS[1]] },
        ]}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Navigation', level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Actions', level: 3 })
    ).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderWithTheme(
      <KeyboardShortcutsOverlay open onClose={onClose} shortcuts={SHORTCUTS} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the default hint and can hide it', () => {
    const { rerender } = renderWithTheme(
      <KeyboardShortcutsOverlay open onClose={() => {}} shortcuts={SHORTCUTS} />
    );
    expect(
      screen.getByText(/anytime to toggle this help/i)
    ).toBeInTheDocument();

    rerender(
      <KeyboardShortcutsOverlay
        open
        onClose={() => {}}
        shortcuts={SHORTCUTS}
        hint={null}
      />
    );
    expect(
      screen.queryByText(/anytime to toggle this help/i)
    ).not.toBeInTheDocument();
  });
});
