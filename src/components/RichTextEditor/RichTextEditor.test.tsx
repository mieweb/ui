import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichTextEditor, type RichTextVariableGroup } from './RichTextEditor';
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
});
