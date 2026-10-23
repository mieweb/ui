import { describe, it, expect, vi, afterEach } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Textarea, plainToHtml, htmlToPlain } from './Textarea';

afterEach(() => {
  vi.restoreAllMocks();
});

/** Replace the editable's content and fire input, like a user edit. */
const editEditor = (editor: HTMLElement, html: string) => {
  editor.innerHTML = html;
  fireEvent.input(editor);
};

describe('plainToHtml / htmlToPlain', () => {
  it.each([
    ['', ''],
    ['hello', '<p>hello</p>'],
    ['a\nb', '<p>a</p><p>b</p>'],
    ['a\n\nb', '<p>a</p><p><br></p><p>b</p>'],
    ['\na', '<p><br></p><p>a</p>'],
    ['a\n', '<p>a</p><p><br></p>'],
    ['<b> & "quotes"', '<p>&lt;b&gt; &amp; "quotes"</p>'],
  ])('converts %j to %j and back', (plain, html) => {
    expect(plainToHtml(plain)).toBe(html);
    expect(htmlToPlain(html)).toBe(plain);
  });

  it('flattens rich editor HTML to lines', () => {
    expect(htmlToPlain('<h2>Title</h2><p><strong>bold</strong> text</p>')).toBe(
      'Title\nbold text'
    );
    expect(htmlToPlain('<ul><li>one</li><li>two</li></ul>')).toBe('one\ntwo');
    expect(htmlToPlain('<p>a<br>b</p>')).toBe('a\nb');
    // The editor's empty state is one empty paragraph.
    expect(htmlToPlain('<p><br></p>')).toBe('');
  });
});

describe('Textarea (rich compat)', () => {
  it('renders a rich text surface with the label wired up', () => {
    renderWithTheme(<Textarea label="Notes" />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(
      document.querySelector('[data-slot="rich-text-editor"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-slot="textarea-label"]')
    ).toHaveTextContent('Notes');
  });

  it('renders multi-line values as one paragraph per line', () => {
    renderWithTheme(
      <Textarea
        label="Notes"
        value={'line one\nline two'}
        onChange={() => {}}
      />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor.innerHTML).toBe('<p>line one</p><p>line two</p>');
  });

  it('reports plain text through event.target.value with the field name', () => {
    const seen: Array<{ value: string; name: string }> = [];
    const onChange = vi.fn((e: React.ChangeEvent<HTMLTextAreaElement>) =>
      // Consumers read synchronously inside the handler; the target is the
      // live mirror node, so its value follows later re-renders.
      seen.push({ value: e.target.value, name: e.target.name })
    );
    renderWithTheme(
      <Textarea label="Notes" name="notes" value="" onChange={onChange} />
    );
    editEditor(
      screen.getByRole('textbox', { name: 'Notes' }),
      '<p><strong>bold</strong> move</p><p>second</p>'
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(seen[0]).toEqual({ value: 'bold move\nsecond', name: 'notes' });
  });

  it('keeps rich formatting when the controlled value round-trips', () => {
    function Harness() {
      const [value, setValue] = React.useState('');
      return (
        <Textarea
          label="Notes"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
    renderWithTheme(<Harness />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    editEditor(editor, '<p><strong>bold</strong> move</p>');
    // The host echoed 'bold move' back; the on-screen HTML keeps the <strong>.
    expect(editor.innerHTML).toContain('<strong>bold</strong>');
  });

  it('resyncs when the parent changes the value externally', () => {
    const { rerender } = renderWithTheme(
      <Textarea label="Notes" value="first" onChange={() => {}} />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    editEditor(editor, '<p><em>first</em></p>');
    rerender(<Textarea label="Notes" value="replaced" onChange={() => {}} />);
    expect(editor.innerHTML).toBe('<p>replaced</p>');
  });

  it('supports uncontrolled use via defaultValue', () => {
    renderWithTheme(<Textarea label="Notes" defaultValue={'a\nb'} />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor.innerHTML).toBe('<p>a</p><p>b</p>');
  });

  it('mirrors the plain value into a hidden textarea for form posts', () => {
    renderWithTheme(
      <Textarea label="Notes" name="notes" value={'a\nb'} onChange={() => {}} />
    );
    const mirror = document.querySelector<HTMLTextAreaElement>(
      '[data-slot="textarea-mirror"]'
    )!;
    expect(mirror.name).toBe('notes');
    expect(mirror.value).toBe('a\nb');
    expect(mirror).toHaveAttribute('hidden');
  });

  it('exposes the plain value and editor focus through the forwarded ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    renderWithTheme(
      <Textarea ref={ref} label="Notes" value="hello" onChange={() => {}} />
    );
    expect(ref.current?.value).toBe('hello');
    ref.current?.focus();
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Notes' })
    );
  });

  it('wires error, helper and count into aria-describedby', () => {
    renderWithTheme(
      <Textarea
        label="Notes"
        error="Required."
        helperText="Hidden while erroring"
        showCount
        value="abc"
        onChange={() => {}}
      />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Required.');
    expect(screen.queryByText('Hidden while erroring')).toBeNull();
    const count = document.querySelector('[data-slot="textarea-count"]')!;
    expect(count).toHaveTextContent('3');
    const describedBy = editor.getAttribute('aria-describedby')!;
    expect(describedBy).toContain(alert.id);
    expect(describedBy).toContain(count.id);
    expect(editor).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows helper text when there is no error', () => {
    renderWithTheme(<Textarea label="Notes" helperText="Be concise." />);
    expect(screen.getByText('Be concise.')).toBeInTheDocument();
  });

  it('shows the count against maxLength and flags overflow', () => {
    renderWithTheme(
      <Textarea
        label="Notes"
        maxLength={3}
        showCount
        value="abcd"
        onChange={() => {}}
      />
    );
    const count = document.querySelector('[data-slot="textarea-count"]')!;
    expect(count).toHaveTextContent('4/3');
    expect(count.className).toContain('text-destructive');
  });

  it('disables editing when disabled', () => {
    renderWithTheme(
      <Textarea label="Notes" value="locked" onChange={() => {}} disabled />
    );
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute(
      'contenteditable',
      'false'
    );
  });

  it('warns once about dropped native behaviours', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithTheme(
      <Textarea
        label="Notes"
        labelVariant="floating"
        autoResize={false}
        resize="none"
      />
    );
    const messages = warn.mock.calls
      .map(([message]) => String(message))
      .filter((message) => message.startsWith('[mieweb/ui Textarea]'));
    expect(messages.some((m) => m.includes('floating'))).toBe(true);
    expect(messages.some((m) => m.includes('autoResize'))).toBe(true);
    expect(messages.some((m) => m.includes('resize is ignored'))).toBe(true);
    const before = warn.mock.calls.length;
    renderWithTheme(
      <Textarea label="Again" labelVariant="floating" autoResize={false} />
    );
    expect(warn.mock.calls.length).toBe(before);
  });
});
