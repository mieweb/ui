import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
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
});
