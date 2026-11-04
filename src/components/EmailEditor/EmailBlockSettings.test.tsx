import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithTheme } from '../../test/test-utils';
import type { TextAreaRichProps } from '../TextAreaRich/TextAreaRich';

// Sentinel in place of the global legacy-backed stub: captures the props the
// text-block case hands the Kerebron surface, which the stub would swallow.
const received: TextAreaRichProps[] = [];
vi.mock('../TextAreaRich/TextAreaRichKerebron', () => ({
  TextAreaRichKerebron: (props: TextAreaRichProps) => {
    received.push(props);
    return <div data-testid="kerebron-sentinel" />;
  },
}));

import { EmailEditor } from './EmailEditor';
import { createEmailBlock, type EmailContentTree } from './types';

const doc: EmailContentTree = {
  version: '1.0',
  blocks: [createEmailBlock('text')],
};

describe('EmailEditor text blocks on the Kerebron engine', () => {
  it('wires the text block to TextAreaRichKerebron with the email policy', () => {
    renderWithTheme(
      <EmailEditor
        value={doc}
        onChange={vi.fn()}
        mergeTags={[
          { token: '{{first_name}}', label: 'First name', group: 'Contact' },
          { token: '{{sender_name}}', label: 'Sender', group: 'Sender' },
        ]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    expect(screen.getByTestId('kerebron-sentinel')).toBeInTheDocument();

    const props = received.at(-1)!;
    expect(props['aria-label']).toBe('Content');
    expect(props.value).toBe('<p>Write your message here.</p>');
    // The block settings panel brings its own chrome; the editor's toolbar
    // starts visible because there is no block gutter menu to reveal it.
    expect(props.defaultToolbar).toBe('visible');
    expect(props.enableDictation).toBe(false);
    // mergeTags become the Variables menu, grouped by their `group`.
    expect(props.variableGroups).toEqual([
      {
        label: 'Contact',
        variables: [{ label: 'First name', value: '{{first_name}}' }],
      },
      {
        label: 'Sender',
        variables: [{ label: 'Sender', value: '{{sender_name}}' }],
      },
    ]);
    // Declared paste policy matches the stored-content policy.
    expect(props.sanitizeHtml!('<b>ok</b><script>x</script>')).toBe(
      '<b>ok</b>'
    );
  });
});
