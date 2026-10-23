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
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor).toHaveAttribute('contenteditable', 'false');
    // Announced like a native disabled textarea (also the axe
    // color-contrast exemption for the dimmed content).
    expect(editor).toHaveAttribute('aria-disabled', 'true');
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

describe('Textarea (native parity hardening)', () => {
  it('normalizes CRLF and lone CR like a native textarea', () => {
    expect(plainToHtml('a\r\nb')).toBe('<p>a</p><p>b</p>');
    expect(plainToHtml('a\rb')).toBe('<p>a</p><p>b</p>');
    renderWithTheme(
      <Textarea label="Notes" value={'a\r\nb'} onChange={() => {}} />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor.innerHTML).toBe('<p>a</p><p>b</p>');
    const mirror = document.querySelector<HTMLTextAreaElement>(
      '[data-slot="textarea-mirror"]'
    )!;
    expect(mirror.value).toBe('a\nb');
  });

  it('keeps line boundaries between inline runs and blocks', () => {
    // Inline text before a block starts its own line…
    expect(htmlToPlain('a<div>b</div>')).toBe('a\nb');
    // …an empty block after inline text is an empty line…
    expect(htmlToPlain('a<div><br></div>')).toBe('a\n');
    // …and nested blocks don't fabricate blank lines.
    expect(htmlToPlain('<blockquote><p>a</p></blockquote><p>b</p>')).toBe(
      'a\nb'
    );
  });

  it('forwards the form attribute to the mirror', () => {
    renderWithTheme(
      <>
        <form id="profile" />
        <Textarea label="Notes" name="notes" form="profile" />
      </>
    );
    const mirror = document.querySelector<HTMLTextAreaElement>(
      '[data-slot="textarea-mirror"]'
    )!;
    expect(mirror).toHaveAttribute('form', 'profile');
    expect(mirror.form?.id).toBe('profile');
  });

  it('announces required on the editable region', () => {
    renderWithTheme(<Textarea label="Notes" required />);
    expect(screen.getByRole('textbox', { name: /Notes/ })).toHaveAttribute(
      'aria-required',
      'true'
    );
  });

  it('readOnly prevents editing but keeps the region focusable', () => {
    renderWithTheme(
      <Textarea label="Notes" value="locked" onChange={() => {}} readOnly />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor).toHaveAttribute('contenteditable', 'false');
    expect(editor).toHaveAttribute('aria-readonly', 'true');
    expect(editor).toHaveAttribute('tabindex', '0');
    // The block gutter menu is editing chrome; it must not render.
    expect(screen.queryByRole('button', { name: 'Block menu' })).toBeNull();
  });

  it('preserves whitespace and maps size and rows onto the editable', () => {
    renderWithTheme(
      <Textarea
        label="Notes"
        size="sm"
        rows={4}
        value="a  b"
        onChange={() => {}}
      />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    expect(editor.className).toContain('whitespace-pre-wrap');
    expect(editor.className).toContain('text-sm');
    expect(editor.className).not.toContain('text-base');
    // 4 rows × 20px sm line height + 14px block padding.
    expect(editor.style.minHeight).toBe('94px');
  });

  it('bridges an external <label htmlFor> to the editable', () => {
    renderWithTheme(
      <>
        <label htmlFor="ord-detail">Instructions</label>
        <Textarea id="ord-detail" />
      </>
    );
    const editor = screen.getByRole('textbox', { name: 'Instructions' });
    expect(editor).toHaveAttribute('id', 'ord-detail');
    const externalLabel = document.querySelector('label[for="ord-detail"]')!;
    expect(editor.getAttribute('aria-labelledby')).toBe(externalLabel.id);
    fireEvent.click(externalLabel);
    expect(document.activeElement).toBe(editor);
  });

  it('composes onKeyDown/onKeyUp with the mirror as the event target', () => {
    const keys: Array<{ key: string; value: string }> = [];
    renderWithTheme(
      <Textarea
        label="Notes"
        value="hi"
        onChange={() => {}}
        onKeyDown={(e) =>
          keys.push({
            key: e.key,
            value:
              e.target instanceof HTMLTextAreaElement ? e.target.value : '?',
          })
        }
      />
    );
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), {
      key: 'Enter',
    });
    expect(keys).toEqual([{ key: 'Enter', value: 'hi' }]);
  });

  it('fires onBlur only when focus leaves the field', () => {
    const onBlur = vi.fn();
    renderWithTheme(
      <Textarea label="Notes" value="" onChange={() => {}} onBlur={onBlur} />
    );
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    // Focus moving to the field's own chrome (the gutter button) is an
    // internal move, like clicking a native textarea's scrollbar.
    const gutter = screen.getByRole('button', { name: 'Block menu' });
    fireEvent.blur(editor, { relatedTarget: gutter });
    expect(onBlur).not.toHaveBeenCalled();
    fireEvent.blur(editor, { relatedTarget: document.body });
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('sanitizes pasted HTML to escaped plain paragraphs', () => {
    const execCommand = vi.fn();
    (document as Document & { execCommand: typeof execCommand }).execCommand =
      execCommand;
    renderWithTheme(<Textarea label="Notes" value="" onChange={() => {}} />);
    fireEvent.paste(screen.getByRole('textbox', { name: 'Notes' }), {
      clipboardData: {
        getData: () =>
          '<div class="host-css" style="position:fixed">x<script>y</script></div>',
      },
    });
    expect(execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      // Flattened to text: markup, styles and classes are gone.
      '<p>x</p>'
    );
  });

  it('resyncs the editor DOM when a controlled parent rejects an edit', () => {
    function Harness() {
      const [value, setValue] = React.useState('abc');
      return (
        <Textarea
          label="Notes"
          value={value}
          onChange={(e) => {
            // Reject anything longer than three characters.
            if (e.target.value.length <= 3) setValue(e.target.value);
          }}
        />
      );
    }
    renderWithTheme(<Harness />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    editEditor(editor, '<p>abcd</p>');
    // The parent kept 'abc'; the visible editor must not keep 'abcd'.
    expect(editor.innerHTML).toBe('<p>abc</p>');
    expect(
      document.querySelector<HTMLTextAreaElement>(
        '[data-slot="textarea-mirror"]'
      )!.value
    ).toBe('abc');
  });

  it('keeps nested list and table boundaries', () => {
    expect(
      htmlToPlain(
        '<ul><li>Parent<ul><li>Child</li></ul></li><li>Sibling</li></ul>'
      )
    ).toBe('Parent\nChild\nSibling');
    expect(
      htmlToPlain(
        '<table><tbody><tr><td>Drug</td><td>Dose</td></tr><tr><td>Aspirin</td><td>81 mg</td></tr></tbody></table>'
      )
    ).toBe('Drug\tDose\nAspirin\t81 mg');
  });

  it('keeps empty table cells in their column', () => {
    // An empty middle cell still owns its column…
    expect(htmlToPlain('<tr><td>Drug</td><td></td><td>Dose</td></tr>')).toBe(
      'Drug\t\tDose'
    );
    // …and so does a leading empty cell.
    expect(htmlToPlain('<tr><td></td><td>Drug</td></tr>')).toBe('\tDrug');
  });

  it('parses untrusted markup with the inert template parser', () => {
    // Table fragments only survive the <template> parsing context — a <div>
    // parser (which can also load resources and run handlers while reading)
    // would silently drop the row/cell tags.
    expect(htmlToPlain('<tr><td>Drug</td><td>Dose</td></tr>')).toBe(
      'Drug\tDose'
    );
  });

  it('lets handlers stop propagation to ancestor React handlers', () => {
    const ancestorKeyDown = vi.fn();
    renderWithTheme(
      <div onKeyDown={ancestorKeyDown} role="presentation">
        <Textarea
          label="Notes"
          value=""
          onChange={() => {}}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
    );
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Notes' }), {
      key: 'Escape',
    });
    // The retargeted event delegates stopPropagation to the original, so
    // React's dispatch loop must not reach the ancestor handler.
    expect(ancestorKeyDown).not.toHaveBeenCalled();
  });
});

describe('Textarea richText={false} (plain opt-out)', () => {
  it('renders the native textarea with no rich editor chrome', () => {
    const { container } = renderWithTheme(
      <Textarea label="Notes" richText={false} defaultValue="plain" />
    );
    const field = screen.getByRole('textbox', { name: 'Notes' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue('plain');
    // No contenteditable surface, no gutter trigger.
    expect(container.querySelector('[contenteditable]')).toBeNull();
    expect(
      container.querySelector('[data-slot="rich-text-editor-block-gutter"]')
    ).toBeNull();
  });

  it('keeps typed markup as literal text', () => {
    let reported = '';
    renderWithTheme(
      <Textarea
        label="Notes"
        richText={false}
        value=""
        onChange={(e) => {
          reported = e.target.value;
        }}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Notes' }), {
      target: { value: '<b>bold?</b>' },
    });
    expect(reported).toBe('<b>bold?</b>');
  });

  it('forwards the ref to the real textarea element', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    renderWithTheme(
      <Textarea label="Notes" richText={false} ref={ref} defaultValue="x" />
    );
    expect(ref.current?.tagName).toBe('TEXTAREA');
    expect(ref.current?.value).toBe('x');
  });
});
