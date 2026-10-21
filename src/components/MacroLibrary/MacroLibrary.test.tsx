import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MacroLibrary, type MacroGroup } from './MacroLibrary';

const GROUPS: MacroGroup[] = [
  {
    id: 'previous',
    label: 'Previous values',
    kind: 'previous',
    macros: [
      {
        id: 'prev-1',
        label: 'Last visit — ROS',
        content: 'Constitutional negative. Cardiovascular negative.',
      },
    ],
  },
  {
    id: 'library',
    label: 'Default library',
    macros: [
      {
        id: 'back',
        label: 'Back pain — normal',
        content: 'No midline tenderness.\nFull range of motion.',
        shortcut: '.b',
        keywords: ['spine'],
      },
      {
        id: 'cardio',
        label: 'Cardio — WNL',
        content: 'Regular rate and rhythm, no murmurs.',
        shortcut: '.c',
      },
    ],
  },
];

describe('MacroLibrary', () => {
  it('renders groups with their macros and marks previous-value groups', () => {
    renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
    expect(screen.getByText('Previous values')).toBeInTheDocument();
    expect(screen.getByText('Default library')).toBeInTheDocument();
    expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
    const previousGroup = document.querySelector('[data-kind="previous"]');
    expect(previousGroup).not.toBeNull();
    expect(previousGroup).toHaveTextContent('Last visit — ROS');
  });

  it('shows the insertion target in the header', () => {
    renderWithTheme(
      <MacroLibrary
        groups={GROUPS}
        onSelect={() => {}}
        targetLabel="Review of Systems"
      />
    );
    expect(screen.getByText('Review of Systems')).toBeInTheDocument();
    expect(screen.getByText(/Insert into/)).toBeInTheDocument();
  });

  it('calls onSelect with the chosen macro', () => {
    const onSelect = vi.fn();
    renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={onSelect} />);
    const row = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-macro-row]')
    ).find((r) => r.textContent?.includes('Cardio — WNL'));
    fireEvent.click(row!);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cardio' })
    );
  });

  describe('search', () => {
    it('filters by label', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: 'cardio — wnl' },
      });
      expect(screen.getByText('Cardio — WNL')).toBeInTheDocument();
      expect(screen.queryByText('Back pain — normal')).toBeNull();
    });

    it('filters by keyword and content', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      const search = screen.getByLabelText('Search macros');
      fireEvent.change(search, { target: { value: 'spine' } });
      expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
      fireEvent.change(search, { target: { value: 'murmurs' } });
      expect(screen.getByText('Cardio — WNL')).toBeInTheDocument();
      expect(screen.queryByText('Back pain — normal')).toBeNull();
    });

    it('ranks shortcut-prefix matches first', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      // ".c" matches the cardio shortcut and also "Constitutional…" content.
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: '.c' },
      });
      const rows = Array.from(document.querySelectorAll('[data-macro-row]'));
      expect(rows[0]).toHaveTextContent('Cardio — WNL');
    });

    it('shows a no-results state with a clear action', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: 'xyzzy' },
      });
      expect(screen.getByText(/No macros match/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
    });
  });

  describe('groups', () => {
    it('collapses and expands a group', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      const header = screen.getByRole('button', { name: /Default library/ });
      expect(header).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Back pain — normal')).toBeNull();
      fireEvent.click(header);
      expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
    });

    it('ignores collapse while searching so matches stay visible', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: /Default library/ }));
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: 'cardio' },
      });
      expect(screen.getByText('Cardio — WNL')).toBeInTheDocument();
    });
  });

  describe('peek', () => {
    const heights: Record<string, PropertyDescriptor | undefined> = {};
    beforeEach(() => {
      // jsdom has no layout; pretend every preview is clamped so the
      // "more" toggle renders.
      for (const prop of ['scrollHeight', 'clientHeight'] as const) {
        heights[prop] = Object.getOwnPropertyDescriptor(
          Element.prototype,
          prop
        );
      }
      Object.defineProperty(Element.prototype, 'scrollHeight', {
        configurable: true,
        get: () => 40,
      });
      Object.defineProperty(Element.prototype, 'clientHeight', {
        configurable: true,
        get: () => 20,
      });
    });
    afterEach(() => {
      for (const prop of ['scrollHeight', 'clientHeight'] as const) {
        const original = heights[prop];
        if (original) Object.defineProperty(Element.prototype, prop, original);
      }
    });

    it('reveals the full content before insertion', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      const more = screen.getByRole('button', {
        name: /Show full content: Back pain — normal/,
      });
      expect(more).toHaveTextContent('more');
      fireEvent.click(more);
      const full = document.querySelector('[data-slot="macro-library-peek"]');
      expect(full).toHaveTextContent('Full range of motion.');
      const less = screen.getByRole('button', {
        name: /Hide full content: Back pain — normal/,
      });
      expect(less).toHaveAttribute('aria-expanded', 'true');
      expect(less).toHaveTextContent('less');
    });

    it('moves focus to the replacement toggle so Escape keeps working', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      const more = screen.getByRole('button', {
        name: /Show full content: Back pain — normal/,
      });
      fireEvent.click(more);
      const less = screen.getByRole('button', {
        name: /Hide full content: Back pain — normal/,
      });
      expect(document.activeElement).toBe(less);
      fireEvent.click(less);
      // The "more" chip is hidden until hover/focus, so collapse focuses the
      // row button instead.
      const active = document.activeElement as HTMLElement;
      expect(active).toHaveAttribute('data-macro-row');
      expect(active).toHaveTextContent('Back pain — normal');
    });
  });

  describe('truncation', () => {
    it('hides the more toggle when the preview is not clamped', () => {
      // jsdom's zero heights mean nothing measures as truncated.
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      expect(
        screen.queryByRole('button', { name: /Show full content/ })
      ).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('moves focus from search into the list and back with arrow keys', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      const search = screen.getByLabelText('Search macros');
      search.focus();
      fireEvent.keyDown(search, { key: 'ArrowDown' });
      const rows = Array.from(
        document.querySelectorAll<HTMLButtonElement>('[data-macro-row]')
      );
      expect(document.activeElement).toBe(rows[0]);
      fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(rows[1]);
      fireEvent.keyDown(rows[1], { key: 'ArrowUp' });
      expect(document.activeElement).toBe(rows[0]);
      fireEvent.keyDown(rows[0], { key: 'ArrowUp' });
      expect(document.activeElement).toBe(search);
    });

    it('closes on Escape when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithTheme(
        <MacroLibrary groups={GROUPS} onSelect={() => {}} onClose={onClose} />
      );
      fireEvent.keyDown(screen.getByLabelText('Search macros'), {
        key: 'Escape',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('optional affordances', () => {
    it('renders the empty state when no macros are provided', () => {
      renderWithTheme(<MacroLibrary groups={[]} onSelect={() => {}} />);
      expect(screen.getByText('No macros available')).toBeInTheDocument();
      expect(screen.queryByLabelText('Search macros')).toBeNull();
    });

    it('shows "Save as macro" only when onCreateMacro is provided', () => {
      const onCreateMacro = vi.fn();
      const { rerender } = renderWithTheme(
        <MacroLibrary groups={GROUPS} onSelect={() => {}} />
      );
      expect(screen.queryByText('Save as macro')).toBeNull();
      rerender(
        <MacroLibrary
          groups={GROUPS}
          onSelect={() => {}}
          onCreateMacro={onCreateMacro}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /Save as macro/ }));
      expect(onCreateMacro).toHaveBeenCalled();
    });

    it('shows a close button only when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithTheme(
        <MacroLibrary groups={GROUPS} onSelect={() => {}} onClose={onClose} />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Close macros' }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
