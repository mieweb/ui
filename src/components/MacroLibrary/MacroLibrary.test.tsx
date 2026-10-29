import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('shows only the main line — label and shortcut, no content preview', () => {
    renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
    const row = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-macro-row]')
    ).find((r) => r.textContent?.includes('Back pain — normal'));
    expect(row).toHaveTextContent('.b');
    expect(row).not.toHaveTextContent('No midline tenderness');
    expect(screen.queryByText(/No midline tenderness/)).toBeNull();
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
    // The panel is a named group so multiple docked panels are told apart.
    expect(
      screen.getByRole('group', { name: 'Insert into Review of Systems' })
    ).toBeInTheDocument();
  });

  it('compact drops the header, search and library group headings but keeps previous-value headings', () => {
    renderWithTheme(
      <MacroLibrary
        groups={GROUPS}
        onSelect={() => {}}
        targetLabel="Review of Systems"
        onClose={() => {}}
        compact
      />
    );
    // The accessible group name survives without the visual header.
    expect(
      screen.getByRole('group', { name: 'Insert into Review of Systems' })
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="macro-library-header"]')
    ).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByText('Default library')).toBeNull();
    // Prior answers must stay distinct from library content.
    expect(screen.getByText('Previous values')).toBeInTheDocument();
    expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
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

  it('keeps the editor focused on pointer picks (mousedown default cancelled)', () => {
    // A focus-docked panel must survive multiple picks: if the button took
    // focus the host editor would blur, closing the panel and (on touch)
    // dismissing the keyboard.
    renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
    const row = document.querySelector<HTMLButtonElement>('[data-macro-row]');
    expect(fireEvent.mouseDown(row!)).toBe(false);
  });

  it('lets a group heading take focus when roving focus is inside its group', () => {
    // Collapsing unmounts the focused row; cancelling mousedown here would
    // strand focus on the body and break keyboard navigation. With focus
    // elsewhere (e.g. the editor) the heading must not steal it.
    renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
    const heading = screen.getByRole('button', { name: 'Default library' });
    expect(fireEvent.mouseDown(heading)).toBe(false);
    const row = heading
      .closest('[data-slot="macro-library-group"]')!
      .querySelector<HTMLButtonElement>('[data-macro-row]');
    row!.focus();
    expect(fireEvent.mouseDown(heading)).toBe(true);
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

    it('ranks shortcut hits first across groups', () => {
      renderWithTheme(
        <MacroLibrary
          groups={[
            {
              id: 'previous',
              label: 'Previous values',
              kind: 'previous',
              macros: [
                {
                  id: 'prev-note',
                  label: 'Last plan',
                  content: 'Patient used .c macro previously.',
                },
              ],
            },
            {
              id: 'library',
              label: 'Library',
              macros: [
                {
                  id: 'cardio',
                  label: 'Cardio — WNL',
                  shortcut: '.c',
                  content: 'Regular rate and rhythm.',
                },
              ],
            },
          ]}
          onSelect={() => {}}
        />
      );
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: '.c' },
      });
      // The group with the shortcut hit outranks the earlier group whose
      // match is incidental content, so ArrowDown reaches it first.
      const rows = Array.from(document.querySelectorAll('[data-macro-row]'));
      expect(rows[0]).toHaveTextContent('Cardio — WNL');
      expect(rows[1]).toHaveTextContent('Last plan');
    });

    it('shows a no-results state with a clear action', () => {
      renderWithTheme(<MacroLibrary groups={GROUPS} onSelect={() => {}} />);
      fireEvent.change(screen.getByLabelText('Search macros'), {
        target: { value: 'xyzzy' },
      });
      expect(
        screen.getByText(/No macros match/, { selector: 'p' })
      ).toBeInTheDocument();
      // The persistent polite region announces the failed search.
      expect(screen.getByRole('status')).toHaveTextContent(
        'No macros match “xyzzy”'
      );
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
      expect(screen.getByText('Back pain — normal')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('');
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

    describe('long groups', () => {
      const MANY: MacroGroup[] = [
        {
          id: 'library',
          label: 'Default library',
          macros: Array.from({ length: 7 }, (_, index) => ({
            id: `m${index + 1}`,
            label: `Macro ${index + 1}`,
            content: `Content ${index + 1}`,
          })),
        },
      ];

      it('previews the first four macros behind a show-more row', () => {
        renderWithTheme(<MacroLibrary groups={MANY} onSelect={() => {}} />);
        expect(screen.getByText('Macro 4')).toBeInTheDocument();
        expect(screen.queryByText('Macro 5')).toBeNull();
        expect(
          screen.getByRole('button', { name: 'Show 3 more' })
        ).toBeInTheDocument();
      });

      it('expands the group and focuses the first revealed macro', async () => {
        renderWithTheme(<MacroLibrary groups={MANY} onSelect={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }));
        expect(screen.getByText('Macro 7')).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /Show \d+ more/ })
        ).toBeNull();
        await waitFor(() =>
          expect(document.activeElement).toHaveTextContent('Macro 5')
        );
      });

      it('shows every match while searching', () => {
        renderWithTheme(<MacroLibrary groups={MANY} onSelect={() => {}} />);
        fireEvent.change(screen.getByLabelText('Search macros'), {
          target: { value: 'Content' },
        });
        expect(screen.getByText('Macro 7')).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /Show \d+ more/ })
        ).toBeNull();
      });
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

    it('leaves IME composition keystrokes alone', () => {
      const onClose = vi.fn();
      renderWithTheme(
        <MacroLibrary groups={GROUPS} onSelect={() => {}} onClose={onClose} />
      );
      const search = screen.getByLabelText('Search macros');
      search.focus();
      // ArrowDown navigates conversion candidates; Escape cancels composition.
      fireEvent.keyDown(search, { key: 'ArrowDown', isComposing: true });
      expect(document.activeElement).toBe(search);
      fireEvent.keyDown(search, { key: 'Escape', isComposing: true });
      expect(onClose).not.toHaveBeenCalled();
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
