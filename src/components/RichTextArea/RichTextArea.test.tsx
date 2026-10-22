import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichTextArea } from './RichTextArea';
import type { MacroGroup } from '../MacroLibrary';

const macros: MacroGroup[] = [
  {
    id: 'library',
    label: 'Exam normals',
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

describe('RichTextArea', () => {
  it('renders an editable textbox without a toolbar', () => {
    renderWithTheme(
      <RichTextArea value="" onChange={() => {}} aria-label="Comment" />
    );
    expect(
      screen.getByRole('textbox', { name: 'Comment' })
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="rich-text-editor-toolbar"]')
    ).toBeNull();
  });

  it('is a chromeless RichTextEditor in Textarea chrome, one row tall', () => {
    renderWithTheme(
      <RichTextArea value="" onChange={() => {}} aria-label="Comment" />
    );
    const wrapper = document.querySelector('[data-slot="rich-text-editor"]')!;
    expect(wrapper).toHaveAttribute('data-chromeless');
    // Textarea's chrome on the wrapper…
    expect(wrapper.className).toContain('border-input');
    expect(wrapper.className).toContain('focus-within:ring-2');
    // …and the editable starts at a single Input-row height, not the
    // document-editor minimum.
    const editor = screen.getByRole('textbox', { name: 'Comment' });
    expect(editor.className).toContain('min-h-[38px]');
    expect(editor.className).not.toContain('min-h-[250px]');
  });

  it('renders the block gutter menu button', () => {
    renderWithTheme(
      <RichTextArea value="" onChange={() => {}} aria-label="Comment" />
    );
    expect(
      screen.getByRole('button', { name: 'Block menu' })
    ).toBeInTheDocument();
  });

  it('can start with the toolbar visible via defaultToolbar', () => {
    renderWithTheme(
      <RichTextArea
        value=""
        onChange={() => {}}
        defaultToolbar="visible"
        aria-label="Comment"
      />
    );
    expect(
      document.querySelector('[data-slot="rich-text-editor-toolbar"]')
    ).not.toBeNull();
  });

  it('renders the placeholder when empty', () => {
    renderWithTheme(
      <RichTextArea
        value=""
        onChange={() => {}}
        placeholder="Add a comment…"
        aria-label="Comment"
      />
    );
    expect(screen.getByText('Add a comment…')).toBeInTheDocument();
  });

  it('disables editing when disabled', () => {
    renderWithTheme(
      <RichTextArea value="<p>Read only</p>" onChange={() => {}} disabled />
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'contenteditable',
      'false'
    );
  });

  describe('typed shortcuts', () => {
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

    it('expands markdown block shortcuts by default', () => {
      renderWithTheme(
        <RichTextArea value="" onChange={() => {}} aria-label="Comment" />
      );
      const editor = screen.getByRole('textbox', { name: 'Comment' });
      const notPrevented = typeAndPressSpace(editor, '##');
      expect(exec).toHaveBeenNthCalledWith(1, 'delete', false);
      expect(exec).toHaveBeenNthCalledWith(2, 'formatBlock', false, 'h2');
      expect(notPrevented).toBe(false);
    });

    it('lets hosts opt out of markdown shortcuts', () => {
      renderWithTheme(
        <RichTextArea
          value=""
          onChange={() => {}}
          markdownShortcuts={false}
          aria-label="Comment"
        />
      );
      const editor = screen.getByRole('textbox', { name: 'Comment' });
      const notPrevented = typeAndPressSpace(editor, '##');
      expect(exec).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    });

    it('expands macro dot phrases when macros are provided', () => {
      renderWithTheme(
        <RichTextArea
          value=""
          onChange={() => {}}
          macros={macros}
          aria-label="Comment"
        />
      );
      const editor = screen.getByRole('textbox', { name: 'Comment' });
      typeAndPressSpace(editor, 'Note .c');
      expect(exec).toHaveBeenCalledWith(
        'insertText',
        false,
        'Regular rate and rhythm.'
      );
    });
  });
});
