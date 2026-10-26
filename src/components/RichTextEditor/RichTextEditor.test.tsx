import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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

  it('moves the caret to the end when a focused editor gets a new value', () => {
    const props = (value: string) => (
      <RichTextEditor value={value} onChange={() => {}} aria-label="Note" />
    );
    const view = renderWithTheme(props('<p>Existing line.</p>'));
    const editor = screen.getByRole('textbox', { name: /note/i });
    editor.focus();
    // Park the caret at the start so the external update has to move it.
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // A host taking over a macro insertion replaces the controlled value.
    view.rerender(props('<p>Existing line.</p><p>Denies fever.</p>'));

    const caret = window.getSelection()!.getRangeAt(0);
    const end = document.createRange();
    end.selectNodeContents(editor);
    end.collapse(false);
    expect(caret.compareBoundaryPoints(Range.START_TO_START, end)).toBe(0);
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

    it('forwards macroLabels to the toggle and the docked panel', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          macros={macros}
          defaultMacrosOpen
          macroLabels={{
            macros: 'Textbausteine',
            hideMacros: 'Textbausteine ausblenden',
            searchPlaceholder: 'Textbausteine suchen…',
          }}
        />
      );
      const toggle = screen.getByRole('button', { name: 'Textbausteine' });
      expect(toggle).toHaveAttribute('title', 'Textbausteine ausblenden');
      expect(
        screen.getByPlaceholderText('Textbausteine suchen…')
      ).toBeInTheDocument();
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

    describe('macrosOnFocus', () => {
      const panel = () => document.querySelector('[data-slot="macro-library"]');

      it('rests closed, opens on focus and closes when focus leaves the field', () => {
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={() => {}}
            macros={macros}
            macrosOnFocus
            aria-label="HPI"
          />
        );
        const editor = screen.getByRole('textbox', { name: 'HPI' });
        expect(panel()).toBeNull();
        fireEvent.focus(editor);
        expect(panel()).not.toBeNull();
        fireEvent.blur(editor, { relatedTarget: document.body });
        expect(panel()).toBeNull();
      });

      it('stays open while focus moves into the panel itself', () => {
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={() => {}}
            macros={macros}
            macrosOnFocus
            aria-label="HPI"
          />
        );
        const editor = screen.getByRole('textbox', { name: 'HPI' });
        fireEvent.focus(editor);
        const row =
          document.querySelector<HTMLButtonElement>('[data-macro-row]')!;
        fireEvent.blur(editor, { relatedTarget: row });
        expect(panel()).not.toBeNull();
        fireEvent.blur(row, { relatedTarget: document.body });
        expect(panel()).toBeNull();
      });

      it('rests closed even with defaultMacrosOpen', () => {
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={() => {}}
            macros={macros}
            macrosOnFocus
            defaultMacrosOpen
          />
        );
        expect(panel()).toBeNull();
      });
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

      it('removes the typed token, then defers to onMacroInsert when it takes over', () => {
        const onChange = vi.fn();
        const onMacroInsert = vi.fn().mockReturnValue(true);
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={onChange}
            macros={macros}
            onMacroInsert={onMacroInsert}
            aria-label="Body"
          />
        );
        const editor = screen.getByRole('textbox', { name: 'Body' });
        typeAndPressSpace(editor, '.c');
        // The token removal is published before the host is consulted, so a
        // host that takes over computes from a token-free value.
        expect(exec).toHaveBeenCalledWith('delete', false);
        expect(onChange).toHaveBeenCalled();
        expect(onMacroInsert).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'cardio' })
        );
        expect(exec).not.toHaveBeenCalledWith(
          'insertText',
          false,
          'Regular rate and rhythm.'
        );
      });

      it('inserts inline when onMacroInsert declines a typed shortcut', () => {
        const onMacroInsert = vi.fn().mockReturnValue(false);
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={() => {}}
            macros={macros}
            onMacroInsert={onMacroInsert}
            aria-label="Body"
          />
        );
        const editor = screen.getByRole('textbox', { name: 'Body' });
        typeAndPressSpace(editor, '.c');
        expect(exec).toHaveBeenCalledWith('delete', false);
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

      it('does not expand when the word continues in an adjacent inline node', () => {
        const editor = renderEditor();
        // etc<strong>.c</strong> — visibly "etc.c", one word.
        editor.appendChild(document.createTextNode('etc'));
        const strong = document.createElement('strong');
        const shortcutNode = document.createTextNode('.c');
        strong.appendChild(shortcutNode);
        editor.appendChild(strong);
        const range = document.createRange();
        range.setStart(shortcutNode, 2);
        range.collapse(true);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        const notPrevented = fireEvent.keyDown(editor, { key: ' ' });
        expect(exec).not.toHaveBeenCalled();
        expect(notPrevented).toBe(true);
      });

      it('expands a shortcut split across inline nodes by formatting', () => {
        const editor = renderEditor();
        // .<b>c</b> — visibly ".c", bolded mid-shortcut.
        editor.appendChild(document.createTextNode('.'));
        const bold = document.createElement('b');
        const boldText = document.createTextNode('c');
        bold.appendChild(boldText);
        editor.appendChild(bold);
        const range = document.createRange();
        range.setStart(boldText, 1);
        range.collapse(true);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        fireEvent.keyDown(editor, { key: ' ' });
        expect(exec).toHaveBeenCalledWith(
          'insertText',
          false,
          'Regular rate and rhythm.'
        );
        // The replacement selection spans the whole token, not just "c".
        const replaced = window.getSelection()!.getRangeAt(0);
        expect(replaced.toString()).toBe('.c');
      });

      it('expands after a trailing line break inside an inline sibling', () => {
        const editor = renderEditor();
        // <strong>one<br></strong>.c — the <br> ends the word, so ".c" is
        // a standalone token even though the sibling's text ends in "e".
        const strong = document.createElement('strong');
        strong.appendChild(document.createTextNode('one'));
        strong.appendChild(document.createElement('br'));
        editor.appendChild(strong);
        const shortcutNode = document.createTextNode('.c');
        editor.appendChild(shortcutNode);
        const range = document.createRange();
        range.setStart(shortcutNode, 2);
        range.collapse(true);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        fireEvent.keyDown(editor, { key: ' ' });
        expect(exec).toHaveBeenCalledWith(
          'insertText',
          false,
          'Regular rate and rhythm.'
        );
      });

      it('does not expand during IME composition', () => {
        const editor = renderEditor();
        const textNode = document.createTextNode('.c');
        editor.appendChild(textNode);
        const range = document.createRange();
        range.setStart(textNode, 2);
        range.collapse(true);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        const notPrevented = fireEvent.keyDown(editor, {
          key: ' ',
          isComposing: true,
        });
        expect(exec).not.toHaveBeenCalled();
        expect(notPrevented).toBe(true);
      });

      it('does not expand while the editor is disabled', () => {
        renderWithTheme(
          <RichTextEditor
            value=""
            onChange={() => {}}
            macros={macros}
            disabled
            aria-label="Body"
          />
        );
        const editor = screen.getByRole('textbox', { name: 'Body' });
        typeAndPressSpace(editor, '.c');
        expect(exec).not.toHaveBeenCalled();
      });
    });
  });

  describe('toolbar visibility', () => {
    it('removes the toolbar when toolbar="hidden"', () => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          toolbar="hidden"
          aria-label="Body"
        />
      );
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Bold' })).toBeNull();
      // The editable region itself is unaffected.
      expect(screen.getByRole('textbox', { name: 'Body' })).toBeInTheDocument();
    });
  });

  describe('markdown shortcuts', () => {
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

    const renderEditor = (
      props: Partial<Parameters<typeof RichTextEditor>[0]> = {}
    ) => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          markdownShortcuts
          aria-label="Body"
          {...props}
        />
      );
      return screen.getByRole('textbox', { name: 'Body' });
    };

    it.each<[string, string, string | undefined]>([
      ['#', 'formatBlock', 'h1'],
      ['##', 'formatBlock', 'h2'],
      ['###', 'formatBlock', 'h3'],
      ['-', 'insertUnorderedList', undefined],
      ['*', 'insertUnorderedList', undefined],
      ['1.', 'insertOrderedList', undefined],
      ['>', 'formatBlock', 'blockquote'],
    ])('expands "%s" + space at line start', (token, command, value) => {
      const editor = renderEditor();
      const notPrevented = typeAndPressSpace(editor, token);
      // The typed token is removed, then the block command is applied —
      // both through execCommand so the expansion is natively undoable.
      expect(exec).toHaveBeenNthCalledWith(1, 'delete', false);
      expect(exec).toHaveBeenNthCalledWith(2, command, false, value);
      expect(notPrevented).toBe(false);
    });

    it('reports the transformed content to onChange', () => {
      const onChange = vi.fn();
      const editor = renderEditor({ onChange });
      typeAndPressSpace(editor, '##');
      expect(onChange).toHaveBeenCalled();
    });

    it('is off by default', () => {
      renderWithTheme(
        <RichTextEditor value="" onChange={() => {}} aria-label="Body" />
      );
      const editor = screen.getByRole('textbox', { name: 'Body' });
      const notPrevented = typeAndPressSpace(editor, '##');
      expect(exec).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it('ignores tokens that are not at the start of a line', () => {
      const editor = renderEditor();
      const notPrevented = typeAndPressSpace(editor, 'note ##');
      expect(exec).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it.each(['constructor', 'toString', '__proto__'])(
      'leaves inherited object property "%s" unchanged',
      (word) => {
        const editor = renderEditor();
        const notPrevented = typeAndPressSpace(editor, word);
        expect(exec).not.toHaveBeenCalled();
        expect(notPrevented).toBe(true);
        expect(editor.textContent).toBe(word);
      }
    );

    it('ignores a token preceded by text in an adjacent inline node', () => {
      // note <b>##</b> — the line starts with "note", not the token.
      const editor = renderEditor();
      editor.appendChild(document.createTextNode('note '));
      const bold = document.createElement('b');
      const tokenNode = document.createTextNode('##');
      bold.appendChild(tokenNode);
      editor.appendChild(bold);
      const range = document.createRange();
      range.setStart(tokenNode, 2);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      const notPrevented = fireEvent.keyDown(editor, { key: ' ' });
      expect(exec).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it('treats text after a line break as a line start', () => {
      const editor = renderEditor();
      editor.appendChild(document.createTextNode('one'));
      editor.appendChild(document.createElement('br'));
      const tokenNode = document.createTextNode('##');
      editor.appendChild(tokenNode);
      const range = document.createRange();
      range.setStart(tokenNode, 2);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      fireEvent.keyDown(editor, { key: ' ' });
      expect(exec).toHaveBeenNthCalledWith(2, 'formatBlock', false, 'h2');
    });

    it('does not expand during IME composition', () => {
      const editor = renderEditor();
      const textNode = document.createTextNode('##');
      editor.appendChild(textNode);
      const range = document.createRange();
      range.setStart(textNode, 2);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      const notPrevented = fireEvent.keyDown(editor, {
        key: ' ',
        isComposing: true,
      });
      expect(exec).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it('does not expand while the editor is disabled', () => {
      const editor = renderEditor({ disabled: true });
      typeAndPressSpace(editor, '##');
      expect(exec).not.toHaveBeenCalled();
    });

    it('falls back to manual token removal when execCommand fails', () => {
      exec.mockReturnValue(false);
      const editor = renderEditor();
      typeAndPressSpace(editor, '##');
      expect(editor.textContent).toBe('');
    });

    it('coexists with macro shortcut expansion', () => {
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
      const editor = renderEditor({ macros });
      typeAndPressSpace(editor, '.c');
      expect(exec).toHaveBeenCalledWith(
        'insertText',
        false,
        'Regular rate and rhythm.'
      );
    });
  });

  describe('dictation with a hidden toolbar', () => {
    class MockRecognition {
      static instances: MockRecognition[] = [];
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onresult: unknown = null;
      onerror: unknown = null;
      start = vi.fn(() => this.onstart?.());
      stop = vi.fn();
      constructor() {
        MockRecognition.instances.push(this);
      }
    }
    const win = window as unknown as Record<string, unknown>;
    let getUserMedia: ReturnType<typeof vi.fn>;
    beforeEach(() => {
      MockRecognition.instances = [];
      win.SpeechRecognition = MockRecognition;
      getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [] });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia },
        configurable: true,
      });
    });
    afterEach(() => {
      delete win.SpeechRecognition;
    });

    const editorProps = (toolbar?: 'visible' | 'hidden') => (
      <RichTextEditor
        value=""
        onChange={() => {}}
        aria-label="Body"
        toolbar={toolbar}
      />
    );

    it('stops a running dictation when the toolbar is hidden', async () => {
      const view = renderWithTheme(editorProps());
      fireEvent.click(await screen.findByRole('button', { name: /dictate/i }));
      await waitFor(() => expect(MockRecognition.instances).toHaveLength(1));
      const recognition = MockRecognition.instances[0];
      expect(recognition.start).toHaveBeenCalled();
      view.rerender(editorProps('hidden'));
      expect(recognition.stop).toHaveBeenCalled();
    });

    it('cancels a start awaiting microphone permission when the toolbar hides', async () => {
      let grantPermission: (value: { getTracks: () => [] }) => void;
      getUserMedia.mockImplementation(
        () => new Promise((resolve) => (grantPermission = resolve))
      );
      const view = renderWithTheme(editorProps());
      fireEvent.click(await screen.findByRole('button', { name: /dictate/i }));
      view.rerender(editorProps('hidden'));
      grantPermission!({ getTracks: () => [] });
      await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
      // Permission resolved after the toolbar hid — no session may start.
      expect(MockRecognition.instances).toHaveLength(0);
    });

    it('stops a running dictation when the editor becomes readOnly', async () => {
      const view = renderWithTheme(editorProps());
      fireEvent.click(await screen.findByRole('button', { name: /dictate/i }));
      await waitFor(() => expect(MockRecognition.instances).toHaveLength(1));
      const recognition = MockRecognition.instances[0];
      expect(recognition.start).toHaveBeenCalled();
      view.rerender(
        <RichTextEditor
          value=""
          onChange={() => {}}
          aria-label="Body"
          readOnly
        />
      );
      expect(recognition.stop).toHaveBeenCalled();
    });

    it('ignores late recognition results once readOnly', async () => {
      const onChange = vi.fn();
      const props = (readOnly?: boolean) => (
        <RichTextEditor
          value=""
          onChange={onChange}
          aria-label="Body"
          readOnly={readOnly}
        />
      );
      const view = renderWithTheme(props());
      fireEvent.click(await screen.findByRole('button', { name: /dictate/i }));
      await waitFor(() => expect(MockRecognition.instances).toHaveLength(1));
      const recognition = MockRecognition.instances[0];
      view.rerender(props(true));
      // A result that was already in flight when the field became readOnly
      // must not edit the editor or reach the host.
      (recognition.onresult as (event: unknown) => void)?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: 'hello' }, length: 1 }],
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('block gutter menu', () => {
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

    const renderEditor = (
      props: Partial<Parameters<typeof RichTextEditor>[0]> = {}
    ) => {
      renderWithTheme(
        <RichTextEditor
          value=""
          onChange={() => {}}
          blockMenu
          aria-label="Body"
          {...props}
        />
      );
      return screen.getByRole('textbox', { name: 'Body' });
    };

    const openMenu = () =>
      fireEvent.click(screen.getByRole('button', { name: 'Block menu' }));

    // jsdom has no layout, so hover targeting needs hand-mocked rects.
    const rectFor = (top: number, height: number, width = 100) =>
      ({
        top,
        bottom: top + height,
        left: 0,
        right: width,
        width,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as ReturnType<Element['getBoundingClientRect']>;

    const mockRect = (el: HTMLElement, top: number, height: number) => {
      el.getBoundingClientRect = () => rectFor(top, height);
    };

    it('renders no gutter button without blockMenu', () => {
      renderWithTheme(
        <RichTextEditor value="" onChange={() => {}} aria-label="Body" />
      );
      expect(screen.queryByRole('button', { name: 'Block menu' })).toBeNull();
    });

    it('renders no gutter button while disabled', () => {
      renderEditor({ disabled: true });
      expect(screen.queryByRole('button', { name: 'Block menu' })).toBeNull();
    });

    it('lists the block formats and the toolbar toggle', () => {
      renderEditor();
      openMenu();
      for (const label of [
        'Text',
        'Heading 1',
        'Heading 2',
        'Heading 3',
        'Bullet list',
        'Numbered list',
        'Quote',
        'Hide toolbar',
      ]) {
        expect(
          screen.getByRole('menuitem', { name: label })
        ).toBeInTheDocument();
      }
    });

    it.each<[string, string, string | undefined]>([
      ['Text', 'formatBlock', 'p'],
      ['Heading 1', 'formatBlock', 'h1'],
      ['Heading 2', 'formatBlock', 'h2'],
      ['Heading 3', 'formatBlock', 'h3'],
      ['Bullet list', 'insertUnorderedList', undefined],
      ['Numbered list', 'insertOrderedList', undefined],
      ['Quote', 'formatBlock', 'blockquote'],
    ])('applies "%s" to the target block', (label, command, value) => {
      const onChange = vi.fn();
      const editor = renderEditor({ onChange });
      const line = document.createElement('div');
      line.textContent = 'hello';
      editor.appendChild(line);
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: label }));
      expect(exec).toHaveBeenCalledWith(command, false, value);
      expect(onChange).toHaveBeenCalled();
      // The command ran with the selection placed in the target block.
      expect(window.getSelection()!.anchorNode).toBe(line);
    });

    it('targets the hovered block rather than the first', () => {
      const editor = renderEditor();
      const first = document.createElement('p');
      first.textContent = 'one';
      const second = document.createElement('p');
      second.textContent = 'two';
      editor.append(first, second);
      mockRect(first, 10, 20);
      mockRect(second, 40, 20);
      // Bubbles up to the gutter wrapper's mousemove handler.
      fireEvent.mouseMove(editor, { clientY: 45 });
      const gutter = document.querySelector(
        '[data-slot="rich-text-editor-block-gutter"]'
      ) as HTMLElement;
      expect(gutter.style.top).toBe('40px');
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Heading 2' }));
      expect(exec).toHaveBeenCalledWith('formatBlock', false, 'h2');
      expect(window.getSelection()!.anchorNode).toBe(second);
    });

    it('ignores collapsed whitespace between blocks', () => {
      const editor = renderEditor();
      const first = document.createElement('p');
      first.textContent = 'one';
      const second = document.createElement('p');
      second.textContent = 'two';
      // Formatted HTML: whitespace-only text nodes between and after blocks.
      editor.append(
        first,
        document.createTextNode('\n'),
        second,
        document.createTextNode('\n')
      );
      mockRect(first, 10, 20);
      mockRect(second, 40, 20);
      // Collapsed whitespace measures 0×0 at the origin, like in browsers.
      const originalRangeRect = Range.prototype.getBoundingClientRect;
      Range.prototype.getBoundingClientRect = () => rectFor(0, 0, 0);
      try {
        fireEvent.mouseMove(editor, { clientY: 45 });
      } finally {
        Range.prototype.getBoundingClientRect = originalRangeRect;
      }
      // The trailing whitespace node (top 0 ≤ 45, iterated last) must not
      // steal the target or pin the gutter to the top.
      const gutter = document.querySelector(
        '[data-slot="rich-text-editor-block-gutter"]'
      ) as HTMLElement;
      expect(gutter.style.top).toBe('40px');
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Quote' }));
      expect(window.getSelection()!.anchorNode).toBe(second);
    });

    it('moves focus to the first menu item on open', async () => {
      renderEditor();
      openMenu();
      await waitFor(() =>
        expect(screen.getByRole('menuitem', { name: 'Text' })).toHaveFocus()
      );
    });

    it('closes with Escape', async () => {
      renderEditor();
      openMenu();
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    });

    it('restores editor focus and the target caret on Escape', async () => {
      const editor = renderEditor();
      const line = document.createElement('div');
      const textNode = document.createTextNode('hello');
      line.appendChild(textNode);
      editor.appendChild(line);
      const range = document.createRange();
      range.setStart(textNode, 2);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      fireEvent.keyDown(editor, { key: '/', ctrlKey: true });
      // Wait for focus to land in the menu — the case Escape must unwind.
      await waitFor(() =>
        expect(screen.getByRole('menuitem', { name: 'Text' })).toHaveFocus()
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      expect(editor).toHaveFocus();
      const restored = window.getSelection()!;
      expect(restored.anchorNode).toBe(textNode);
      expect(restored.anchorOffset).toBe(2);
    });

    it('opens with Ctrl+/ targeting the caret block', () => {
      const editor = renderEditor();
      const line = document.createElement('div');
      const textNode = document.createTextNode('hello');
      line.appendChild(textNode);
      editor.appendChild(line);
      const range = document.createRange();
      range.setStart(textNode, 2);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      const notPrevented = fireEvent.keyDown(editor, {
        key: '/',
        ctrlKey: true,
      });
      expect(notPrevented).toBe(false);
      fireEvent.click(screen.getByRole('menuitem', { name: 'Heading 2' }));
      // The caret position captured at open time is the command target.
      expect(exec).toHaveBeenCalledWith('formatBlock', false, 'h2');
      expect(window.getSelection()!.anchorNode).toBe(textNode);
    });

    it('opens with Cmd+/', () => {
      const editor = renderEditor();
      fireEvent.keyDown(editor, { key: '/', metaKey: true });
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('offers the macro menu entries only when macros are provided', () => {
      renderEditor();
      openMenu();
      expect(
        screen.queryByRole('menuitem', { name: 'Insert macro' })
      ).toBeNull();
      expect(
        screen.queryByRole('menuitem', { name: 'Show macro library' })
      ).toBeNull();
    });

    it('disables the "Insert macro" submenu when the groups are empty', () => {
      renderEditor({ macros: [{ id: 'g', label: 'Group', macros: [] }] });
      openMenu();
      expect(
        screen.getByRole('menuitem', { name: 'Insert macro' })
      ).toBeDisabled();
      // The library item stays available — its panel owns the empty state.
      expect(
        screen.getByRole('menuitem', { name: 'Show macro library' })
      ).not.toBeDisabled();
    });

    it('opens the macro panel from the menu', () => {
      renderEditor({ macros });
      openMenu();
      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Show macro library' })
      );
      expect(
        document.querySelector('[data-slot="macro-library"]')
      ).not.toBeNull();
    });

    it('inserts a macro directly from the "Insert macro" submenu', () => {
      renderEditor({ macros });
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Insert macro' }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Cardio — WNL/ }));
      expect(exec).toHaveBeenCalledWith(
        'insertText',
        false,
        'Regular rate and rhythm.'
      );
      // No panel was docked — the submenu inserts without the library.
      expect(document.querySelector('[data-slot="macro-library"]')).toBeNull();
    });

    it('inserts the macro at the menu target even after the panel takes focus', () => {
      const editor = renderEditor({ macros });
      const first = document.createElement('p');
      first.textContent = 'one';
      const second = document.createElement('p');
      second.textContent = 'two';
      editor.append(first, second);
      mockRect(first, 10, 20);
      mockRect(second, 40, 20);
      // The caret lives in the FIRST paragraph…
      const caret = document.createRange();
      caret.setStart(first.firstChild!, 1);
      caret.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(caret);
      // …while the gutter menu targets the SECOND.
      fireEvent.mouseMove(editor, { clientY: 45 });
      openMenu();
      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Show macro library' })
      );
      // The panel's search field steals focus; the editor's blur re-saves
      // the live selection — which must already match the menu target, or
      // the bookmark gets clobbered and the macro lands at the old caret.
      fireEvent.blur(editor);
      fireEvent.click(
        Array.from(
          document.querySelectorAll<HTMLButtonElement>('[data-macro-row]')
        ).find((row) => row.textContent?.includes('Cardio — WNL'))!
      );
      expect(exec).toHaveBeenCalledWith(
        'insertText',
        false,
        'Regular rate and rhythm.'
      );
      expect(window.getSelection()!.anchorNode).toBe(second);
    });

    it('hides the toolbar from the menu and reports the change', () => {
      const onToolbarChange = vi.fn();
      renderEditor({ onToolbarChange });
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).not.toBeNull();
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Hide toolbar' }));
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).toBeNull();
      expect(onToolbarChange).toHaveBeenCalledWith('hidden');
    });

    it('shows a toolbar hidden via defaultToolbar', () => {
      renderEditor({ defaultToolbar: 'hidden' });
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).toBeNull();
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Show toolbar' }));
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).not.toBeNull();
    });

    it('leaves a controlled toolbar to the host', () => {
      const onToolbarChange = vi.fn();
      renderEditor({ toolbar: 'visible', onToolbarChange });
      openMenu();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Hide toolbar' }));
      // Controlled: visibility only changes when the host updates the prop.
      expect(
        document.querySelector('[data-slot="rich-text-editor-toolbar"]')
      ).not.toBeNull();
      expect(onToolbarChange).toHaveBeenCalledWith('hidden');
    });

    it('externalizes the menu labels', () => {
      renderEditor({
        blockMenuLabels: {
          blockMenu: 'Blockmenü',
          heading1: 'Überschrift 1',
          hideToolbar: 'Werkzeugleiste ausblenden',
        },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Blockmenü' }));
      expect(
        screen.getByRole('menuitem', { name: 'Überschrift 1' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Werkzeugleiste ausblenden' })
      ).toBeInTheDocument();
    });
  });
});
