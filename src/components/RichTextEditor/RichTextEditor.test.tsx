import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichTextEditor, type RichTextVariableGroup } from './RichTextEditor';
import type { MacroGroup } from '../MacroLibrary';
import {
  processDictation,
  convertAngleBracketsToMustache,
  isHtmlEmpty,
} from './processDictation';

const variableGroups: RichTextVariableGroup[] = [
  {
    label: 'Employee',
    variables: [
      { label: 'Full Name', value: '{{employee.name}}' },
      { label: 'Email', value: '{{employee.email}}' },
    ],
  },
];

describe('processDictation', () => {
  it('converts trailing "period" to a full stop', () => {
    expect(processDictation('hello world period')).toBe('hello world.');
  });

  it('keeps "period" when used as a word', () => {
    expect(processDictation('the waiting period applies')).toContain(
      'waiting period'
    );
  });

  it('converts "comma" to a comma', () => {
    expect(processDictation('one comma two')).toBe('one, two');
  });

  it('maps simple punctuation phrases', () => {
    expect(processDictation('done question mark')).toContain('?');
  });

  it('capitalizes after sentence-ending punctuation', () => {
    expect(processDictation('done full stop hello world')).toContain('. Hello');
  });
});

describe('convertAngleBracketsToMustache', () => {
  it('converts raw angle brackets', () => {
    expect(convertAngleBracketsToMustache('Hi <<employee.name>>')).toBe(
      'Hi {{employee.name}}'
    );
  });

  it('converts HTML-encoded angle brackets', () => {
    expect(
      convertAngleBracketsToMustache('Hi &lt;&lt;employee.name&gt;&gt;')
    ).toBe('Hi {{employee.name}}');
  });
});

describe('isHtmlEmpty', () => {
  it('treats markup-only content as empty', () => {
    expect(isHtmlEmpty('<br>')).toBe(true);
    expect(isHtmlEmpty('<p>&nbsp;</p>')).toBe(true);
  });

  it('detects visible text', () => {
    expect(isHtmlEmpty('<p>hello</p>')).toBe(false);
  });
});

describe('RichTextEditor', () => {
  it('renders the formatting toolbar', () => {
    renderWithTheme(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /numbered list/i })
    ).toBeInTheDocument();
  });

  it('hides the variable menu when no groups are provided', () => {
    renderWithTheme(<RichTextEditor value="" onChange={() => {}} />);
    expect(
      screen.queryByRole('button', { name: /^variables$/i })
    ).not.toBeInTheDocument();
  });

  it('shows the variable menu when groups are provided', () => {
    renderWithTheme(
      <RichTextEditor
        value=""
        onChange={() => {}}
        variableGroups={variableGroups}
      />
    );
    expect(
      screen.getByRole('button', { name: /^variables$/i })
    ).toBeInTheDocument();
  });

  it('renders the placeholder when empty', () => {
    renderWithTheme(
      <RichTextEditor value="" onChange={() => {}} placeholder="Type here…" />
    );
    expect(screen.getByText('Type here…')).toBeInTheDocument();
  });

  it('disables the dictation button when speech is unsupported', () => {
    renderWithTheme(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /dictate/i })).toBeDisabled();
  });

  it('exposes an editable textbox', () => {
    renderWithTheme(
      <RichTextEditor value="" onChange={() => {}} aria-label="Note body" />
    );
    expect(
      screen.getByRole('textbox', { name: /note body/i })
    ).toBeInTheDocument();
  });

  describe('paste sanitisation', () => {
    // jsdom has no execCommand; the component inserts pasted HTML through it.
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec;
    afterEach(() => exec.mockClear());

    const paste = (html: string) =>
      fireEvent.paste(screen.getByRole('textbox', { name: 'Body' }), {
        clipboardData: {
          getData: (type: string) => (type === 'text/html' ? html : ''),
        },
      });

    it('runs pasted HTML through sanitizeHtml before it reaches the DOM', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={onChange}
          aria-label="Body"
          sanitizeHtml={(html) =>
            html.replaceAll('<script>alert(1)</script>', '')
          }
        />
      );
      paste('<b>hi</b><script>alert(1)</script>');
      expect(exec).toHaveBeenCalledWith('insertHTML', false, '<b>hi</b>');
      expect(onChange).toHaveBeenCalled();
    });

    it('leaves plain-text pastes to the browser', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          aria-label="Body"
          sanitizeHtml={(html) => html}
        />
      );
      paste('');
      expect(exec).not.toHaveBeenCalled();
    });

    it('keeps default paste behaviour without sanitizeHtml', () => {
      renderWithTheme(
        <RichTextEditor value="" onChange={() => {}} aria-label="Body" />
      );
      paste('<b>hi</b>');
      expect(exec).not.toHaveBeenCalled();
    });
  });

  describe('macro addon', () => {
    let exec: ReturnType<typeof vi.fn>;
    let previousExec: typeof document.execCommand;
    beforeEach(() => {
      previousExec = document.execCommand;
      exec = vi.fn().mockReturnValue(true);
      document.execCommand = exec as unknown as typeof document.execCommand;
    });
    afterEach(() => {
      document.execCommand = previousExec;
    });

    const macros: MacroGroup[] = [
      {
        id: 'library',
        label: 'Default library',
        macros: [
          {
            id: 'cardio',
            label: 'Cardio — WNL',
            content: 'Regular rate and rhythm.',
            shortcut: '.c',
          },
        ],
      },
    ];

    const clickMacroRow = (label: string, container: Element = document.body) =>
      fireEvent.click(
        Array.from(
          container.querySelectorAll<HTMLButtonElement>('[data-macro-row]')
        ).find((row) => row.textContent?.includes(label))!
      );

    it('renders no macro UI without the macros prop', () => {
      renderWithTheme(<RichTextEditor value="" onChange={() => {}} />);
      expect(screen.queryByRole('button', { name: /macros/i })).toBeNull();
      expect(document.querySelector('[data-slot="macro-library"]')).toBeNull();
    });

    it('toggles the docked panel from the toolbar', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          macros={macros}
          aria-label="Review of Systems"
        />
      );
      const toggle = screen.getByRole('button', { name: /macros/i });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(document.querySelector('[data-slot="macro-library"]')).toBeNull();
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(
        document.querySelector('[data-slot="macro-library"]')
      ).not.toBeNull();
      // Panel names its insertion target after the editor's label.
      expect(screen.getByText('Review of Systems')).toBeInTheDocument();
    });

    it('opens initially with defaultMacrosOpen', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          macros={macros}
          defaultMacrosOpen
        />
      );
      expect(
        document.querySelector('[data-slot="macro-library"]')
      ).not.toBeNull();
    });

    it('inserts the macro content through the undo-aware command', () => {
      const onChange = vi.fn();
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={onChange}
          macros={macros}
          defaultMacrosOpen
          aria-label="Body"
        />
      );
      clickMacroRow('Cardio — WNL');
      expect(exec).toHaveBeenCalledWith(
        'insertText',
        false,
        'Regular rate and rhythm.'
      );
      expect(onChange).toHaveBeenCalled();
    });

    it('inserts only into its own editor when multiple instances exist', () => {
      const onChangeA = vi.fn();
      const onChangeB = vi.fn();
      renderWithTheme(
        <>
          <RichTextEditor
            value=""
            onChange={onChangeA}
            macros={macros}
            defaultMacrosOpen
            aria-label="Editor A"
          />
          <RichTextEditor
            value=""
            onChange={onChangeB}
            macros={macros}
            defaultMacrosOpen
            aria-label="Editor B"
          />
        </>
      );
      const editorB = screen.getByRole('textbox', { name: 'Editor B' });
      const wrapperB = editorB.closest('[data-slot="rich-text-editor"]')!;
      clickMacroRow('Cardio — WNL', wrapperB);
      expect(onChangeB).toHaveBeenCalled();
      expect(onChangeA).not.toHaveBeenCalled();
      // Insertion focused the associated editor, not the other instance.
      expect(document.activeElement).toBe(editorB);
    });

    it('closing the panel returns focus to the editor', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          macros={macros}
          defaultMacrosOpen
          aria-label="Body"
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Close macros' }));
      expect(document.querySelector('[data-slot="macro-library"]')).toBeNull();
      expect(document.activeElement).toBe(
        screen.getByRole('textbox', { name: 'Body' })
      );
    });

    describe('typed shortcut expansion', () => {
      /** Place `text` in the editor with the caret at its end, then press space. */
      const typeAndPressSpace = (editor: HTMLElement, text: string) => {
        const textNode = document.createTextNode(text);
        editor.appendChild(textNode);
        const range = document.createRange();
        range.setStart(textNode, text.length);
        range.collapse(true);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        return fireEvent.keyDown(editor, { key: ' ' });
      };

      const renderEditor = (onChange = vi.fn()) => {
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={onChange}
            macros={macros}
            aria-label="Body"
          />
        );
        return screen.getByRole('textbox', { name: 'Body' });
      };

      it('expands a shortcut followed by space, consuming the space', () => {
        const onChange = vi.fn();
        const editor = renderEditor(onChange);
        const notPrevented = typeAndPressSpace(editor, 'Note .c');
        expect(exec).toHaveBeenCalledWith(
          'insertText',
          false,
          'Regular rate and rhythm.'
        );
        // The triggering space is consumed (default prevented) and the
        // replacement range covers exactly the typed shortcut.
        expect(notPrevented).toBe(false);
        expect(window.getSelection()?.toString()).toBe('.c');
        expect(onChange).toHaveBeenCalled();
      });

      it('matches shortcuts case-insensitively', () => {
        const editor = renderEditor();
        typeAndPressSpace(editor, '.C');
        expect(exec).toHaveBeenCalledWith(
          'insertText',
          false,
          'Regular rate and rhythm.'
        );
      });

      it('leaves unknown tokens alone', () => {
        const editor = renderEditor();
        const notPrevented = typeAndPressSpace(editor, 'Note .zz');
        expect(exec).not.toHaveBeenCalled();
        expect(notPrevented).toBe(true);
      });

      it('does not expand mid-word shortcut text', () => {
        const editor = renderEditor();
        // ".c" is a suffix of a longer token, not a standalone shortcut.
        typeAndPressSpace(editor, 'etc.c');
        expect(exec).not.toHaveBeenCalled();
      });
    });
  });
});
