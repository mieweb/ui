import { useEffect } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MimeDocument } from '@kerebron/documents';
import { ArtifactDocumentEditor } from './ArtifactDocumentEditor';
import type {
  ArtifactEditorController,
  ArtifactEditorSnapshot,
  SerializedArtifactDocument,
} from './types';

// Wrapper behavior belongs here; actual Kerebron/Yjs is exercised in the browser.
vi.mock('../RichEditor', () => ({
  RichEditor: ({
    onReady,
    ...props
  }: {
    onReady: (editor: unknown) => void;
    'aria-label': string;
  }) => {
    useEffect(() => {
      onReady({ kind: 'test-editor' });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <div role="textbox" aria-label={props['aria-label']} />;
  },
}));

const incoming: MimeDocument = {
  format: 'mime',
  headers: [],
  from: [{ address: 'writer@example.test', name: 'Writer' }],
  replyTo: [],
  to: [{ address: 'reader@example.test' }],
  cc: [],
  bcc: [{ address: 'private@example.test' }],
  subject: 'Fixture message',
  body: {
    html: '<p>Hello <img src="cid:logo" alt="Logo"><img src="https://tracker.example.test/pixel"><script>unsafe()</script></p>',
  },
  attachments: [
    {
      id: 'logo',
      ref: 'stored:logo',
      filename: 'logo.png',
      mediaType: 'image/png',
      size: 68,
      disposition: 'inline',
      cid: 'logo',
    },
  ],
  readOnly: false,
  diagnostics: [],
};

function fakeController(overrides: Partial<ArtifactEditorSnapshot> = {}) {
  let snapshot: ArtifactEditorSnapshot = {
    reference: { artipodId: 'pod', artifactId: 'message' },
    document: globalThis.structuredClone(incoming),
    attachments: globalThis.structuredClone(incoming.attachments),
    revision: 0,
    bodyVersion: 0,
    dirty: false,
    locked: false,
    mode: 'display',
    ...overrides,
  };
  const listeners = new Set<() => void>();
  const update = (value: Partial<ArtifactEditorSnapshot>) => {
    snapshot = { ...snapshot, ...value };
    listeners.forEach((listener) => listener());
  };
  const release = vi.fn();
  const dispose = vi.fn();
  const connect = vi.fn().mockResolvedValue(undefined);
  const output: SerializedArtifactDocument = {
    format: 'mime',
    bytes: new TextEncoder().encode('complete-message'),
    mediaType: 'message/rfc822',
    envelope: {
      from: 'reader@example.test',
      to: ['writer@example.test', 'private@example.test'],
    },
  };
  const controller: ArtifactEditorController = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setHeader: vi.fn(),
    attachFiles: vi.fn().mockResolvedValue(undefined),
    removeAttachment: vi.fn(),
    openAttachment: vi
      .fn()
      .mockResolvedValue({ url: 'blob:protected-logo', release }),
    compose: vi.fn(async () => {
      update({ mode: 'compose', bodyVersion: 1 });
    }),
    serialize: vi.fn().mockResolvedValue(output),
    body: {
      createBinding: vi.fn(() => ({ editorKits: [], connect, dispose })),
    },
  };
  return { controller, update, release, connect, dispose, output };
}

describe('ArtifactDocumentEditor', () => {
  it('renders MIME headers and leased CID media with network and scripts disabled', async () => {
    const fake = fakeController();
    render(<ArtifactDocumentEditor controller={fake.controller} />);
    expect(
      screen.getByRole('heading', { name: 'Fixture message' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Writer <writer@example.test>')
    ).toBeInTheDocument();
    expect(screen.queryByText('private@example.test')).not.toBeInTheDocument();
    const frame = await screen.findByTitle('Email message body');
    expect(frame).toHaveAttribute('sandbox', 'allow-same-origin');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-scripts');
    const source = frame.getAttribute('srcdoc') ?? '';
    expect(source).toContain('blob:protected-logo');
    expect(source).not.toContain('tracker.example.test');
    expect(source).not.toContain('<script');
    expect(source).toContain("default-src 'none'");
    expect(source).toContain("script-src 'none'");
    expect(source).toContain("object-src 'none'");
  });

  it('clears message content and releases this view’s media on lock', async () => {
    const fake = fakeController();
    render(<ArtifactDocumentEditor controller={fake.controller} />);
    await screen.findByTitle('Email message body');
    act(() => fake.update({ locked: true }));
    expect(screen.queryByTitle('Email message body')).not.toBeInTheDocument();
    expect(screen.queryByText('Fixture message')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Writer <writer@example.test>')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Protected document' })
    ).toBeInTheDocument();
    expect(fake.release).toHaveBeenCalledOnce();
  });

  it('isolates mailbox/date values and address inputs in RTL without forcing the subject direction', async () => {
    const message = {
      ...globalThis.structuredClone(incoming),
      date: 'Thu, 12 Nov 2026 10:00:00 +0000',
    };
    const fake = fakeController({ document: message });
    const view = render(
      <ArtifactDocumentEditor controller={fake.controller} dir="rtl" />
    );
    expect(screen.getByText('Writer <writer@example.test>')).toHaveAttribute(
      'dir',
      'ltr'
    );
    for (const value of view.container.querySelectorAll('dd bdi')) {
      expect(value).toHaveAttribute('dir', 'ltr');
    }
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    await screen.findByRole('textbox', { name: 'To' });
    for (const name of ['From', 'To', 'Cc', 'Bcc']) {
      expect(screen.getByRole('textbox', { name })).toHaveAttribute(
        'dir',
        'ltr'
      );
    }
    expect(
      screen.getByRole('textbox', { name: 'Subject' })
    ).not.toHaveAttribute('dir');
    expect(
      view.container.querySelector('[data-slot="artifact-document-editor"]')
    ).toHaveAttribute('dir', 'rtl');
  });

  it('creates a reply through the controller and passes complete delivery output to the host', async () => {
    const fake = fakeController();
    const send = vi.fn();
    render(
      <ArtifactDocumentEditor controller={fake.controller} onSend={send} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
    );
    expect(fake.controller.compose).toHaveBeenCalledWith('reply');
    fireEvent.change(screen.getByRole('textbox', { name: 'To' }), {
      target: { value: 'other@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(send).toHaveBeenCalledWith(fake.output));
    expect(fake.controller.setHeader).toHaveBeenCalledWith(
      'to',
      'other@example.test'
    );
    expect(fake.controller.serialize).toHaveBeenCalledWith('delivery');
    expect(fake.output.envelope?.to).toContain('private@example.test');
  });

  it('uses protected attachment callbacks and keeps failed host saves retryable', async () => {
    const fake = fakeController({ mode: 'compose' });
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('Draft storage unavailable'))
      .mockResolvedValueOnce(undefined);
    render(
      <ArtifactDocumentEditor controller={fake.controller} onSaveDraft={save} />
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled()
    );
    const file = new File(['attachment'], 'agenda.txt', { type: 'text/plain' });
    fireEvent.change(
      screen.getByLabelText('Attach files', { selector: 'input' }),
      { target: { files: [file] } }
    );
    await waitFor(() =>
      expect(fake.controller.attachFiles).toHaveBeenCalledWith([file])
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Draft storage unavailable'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(fake.controller.serialize).toHaveBeenLastCalledWith('draft');
  });

  it('borrows a separate body binding per view and releases only those bindings', async () => {
    const fake = fakeController({ mode: 'compose' });
    const { unmount } = render(
      <>
        <ArtifactDocumentEditor controller={fake.controller} />
        <ArtifactDocumentEditor controller={fake.controller} />
      </>
    );
    await waitFor(() => expect(fake.connect).toHaveBeenCalledTimes(2));
    expect(fake.controller.body.createBinding).toHaveBeenCalledTimes(2);
    unmount();
    expect(fake.dispose).toHaveBeenCalledTimes(2);
  });

  it('uses the same save surface for preferred MDY without message headers', async () => {
    const fake = fakeController({
      mode: 'compose',
      document: {
        format: 'mdy',
        body: '# Notes',
        frontmatter: '---\ntitle: Notes\n---\n',
        diagnostics: [],
      },
      attachments: [],
    });
    const save = vi.fn();
    render(
      <ArtifactDocumentEditor controller={fake.controller} onSaveDraft={save} />
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save document' })
      ).toBeEnabled()
    );
    expect(
      screen.queryByRole('textbox', { name: 'To' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
    await waitFor(() =>
      expect(fake.controller.serialize).toHaveBeenCalledWith('draft')
    );
  });

  it.each(['lock', 'unmount'] as const)(
    'does not call a stale send callback after %s while serialization is pending',
    async (transition) => {
      const fake = fakeController({ mode: 'compose' });
      let finish!: (value: SerializedArtifactDocument) => void;
      vi.mocked(fake.controller.serialize).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      const send = vi.fn();
      const view = render(
        <ArtifactDocumentEditor controller={fake.controller} onSend={send} />
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
      );
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      await waitFor(() => expect(fake.controller.serialize).toHaveBeenCalled());
      if (transition === 'lock') act(() => fake.update({ locked: true }));
      else view.unmount();
      await act(async () => {
        finish(fake.output);
      });
      expect(send).not.toHaveBeenCalled();
    }
  );
});
