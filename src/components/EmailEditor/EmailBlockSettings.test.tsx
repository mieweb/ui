import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithTheme } from '../../test/test-utils';
import type { TextAreaRichKerebronProps } from '../TextAreaRich/TextAreaRichKerebron';

// Sentinel in place of the global legacy-backed stub: captures the props the
// text-block case hands the Kerebron surface, which the stub would swallow.
const received: TextAreaRichKerebronProps[] = [];
vi.mock('../TextAreaRich/TextAreaRichKerebron', () => ({
  TextAreaRichKerebron: (props: TextAreaRichKerebronProps) => {
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
    // Pasted/dropped media files must never take the stock pipeline, which
    // would embed them as `data:` URLs — the email URL policy strips those on
    // render, leaving broken images. A handler is always present (videos
    // never are), so that path is unreachable.
    expect(props.mediaUpload).toEqual({
      uploadHandler: expect.any(Function),
      allowedVideoTypes: [],
    });
    // Task lists would serialize checkbox <input>s — forbidden by the
    // sanitiser and inert in mail clients — so the nodes are dropped.
    expect(props.omitExtensions).toEqual(['task_list', 'task_item']);
  });

  it('routes pasted image files through the latest onUploadImage', async () => {
    const { rerender } = renderWithTheme(
      <EmailEditor value={doc} onChange={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));

    const handler = received.at(-1)!.mediaUpload!.uploadHandler!;
    const file = new File(['x'], 'x.png', { type: 'image/png' });
    // No host uploader: the handler rejects, which the media extension
    // catches — the file is skipped instead of embedded.
    await expect(handler(file)).rejects.toThrow('pasted file skipped');

    // The host supplies a callback after the editor mounted (the editor
    // captures `mediaUpload` once): the same stable handler delegates to the
    // latest prop — no editor rebuild, no lost editing state.
    const onUploadImage = vi.fn(async () => 'https://cdn.example/x.png');
    rerender(
      <EmailEditor
        value={doc}
        onChange={vi.fn()}
        onUploadImage={onUploadImage}
      />
    );
    await expect(handler(file)).resolves.toBe('https://cdn.example/x.png');
    expect(onUploadImage).toHaveBeenCalledWith(file);
  });
});
