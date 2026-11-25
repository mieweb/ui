/**
 * The `editor="rich"` input, over a stand-in RichEditor: the real one needs
 * Kerebron's WASM grammars (see RichEditor's own tests). The stand-in holds
 * a draft its `onChange` never published, as the real editor does between a
 * keystroke and its async serialization.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ChatComposer, type ChatComposerHandle } from './ChatComposer';
import type {
  RichEditorHandle,
  RichEditorProps,
} from '../RichEditor/RichEditor';

const editor = vi.hoisted(() => ({
  /** What the editor holds, published or not. */
  draft: '',
  focus: vi.fn(),
  props: null as Record<string, unknown> | null,
  /** When set, getContent() waits on it: a read still pending. */
  reading: null as Promise<void> | null,
}));

vi.mock('../RichEditor/RichEditor', async () => {
  const React = await import('react');
  const RichEditor = React.forwardRef<RichEditorHandle, RichEditorProps>(
    function RichEditor(props, ref) {
      editor.props = props as Record<string, unknown>;
      // Ready a tick after mount, as the real editor is after its setup;
      // until then `focus()` does nothing, as the real one does.
      const ready = React.useRef(false);
      const onReady = React.useRef(props.onReady);
      onReady.current = props.onReady;
      React.useEffect(() => {
        let live = true;
        void Promise.resolve().then(() => {
          if (!live) return;
          ready.current = true;
          onReady.current?.(null as never);
        });
        return () => {
          live = false;
        };
      }, []);
      // Clearing the value empties the document, as the real editor reloads.
      React.useEffect(() => {
        if (!props.value) editor.draft = '';
      }, [props.value]);
      React.useImperativeHandle(ref, () => ({
        getContent: async () => {
          if (editor.reading) await editor.reading;
          return editor.draft;
        },
        focus: () => {
          if (ready.current) editor.focus();
        },
      }));
      return <div role="textbox" aria-label={props['aria-label']} />;
    }
  );
  return { RichEditor };
});

afterEach(() => {
  editor.draft = '';
  editor.focus.mockClear();
  editor.props = null;
  editor.reading = null;
});

const person = {
  kind: 'person',
  char: '@',
  label: 'People',
  search: () => [],
  toHref: (id: string) => `/people/${id}`,
  fromHref: (href: string) =>
    href.startsWith('/people/') ? href.slice('/people/'.length) : null,
};

async function renderRich(
  props: Partial<React.ComponentProps<typeof ChatComposer>> = {}
) {
  const onSend = vi.fn();
  const view = renderWithTheme(
    <ChatComposer
      editor="rich"
      onSend={onSend}
      triggers={[person]}
      sendOptions={[{ id: 'later', label: 'Send later' }]}
      {...props}
    />
  );
  const input = await screen.findByRole('textbox', { name: /message input/i });
  return { onSend, input, ...view };
}

describe('ChatComposer rich input', () => {
  // First: React.lazy caches the editor once loaded, after which it mounts
  // at once and there is nothing to replay.
  it('replays a focus() asked for before the editor loaded', async () => {
    const ref = React.createRef<ChatComposerHandle>();
    renderWithTheme(<ChatComposer ref={ref} editor="rich" onSend={vi.fn()} />);
    ref.current!.focus();
    expect(editor.focus).not.toHaveBeenCalled();
    await screen.findByRole('textbox', { name: /message input/i });
    await waitFor(() => expect(editor.focus).toHaveBeenCalledTimes(1));
  });

  it.each([
    [
      'Enter',
      (input: HTMLElement) => fireEvent.keyDown(input, { key: 'Enter' }),
    ],
    [
      'the send button',
      () =>
        fireEvent.click(screen.getByRole('button', { name: 'Send message' })),
    ],
  ])(
    'sends what the editor holds on %s, not the lagging value',
    async (_, send) => {
      const { onSend, input } = await renderRich();
      // Typed, and a chip picked, but not yet published through onChange…
      editor.draft = 'Ask [@Ann](/people/u-ann)';
      // …except a first keystroke, so the send button is enabled.
      act(() => (editor.props!.onChange as (v: string) => void)('A'));
      send(input);

      await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
      expect(onSend.mock.calls[0][0]).toMatchObject({
        content: 'Ask [@Ann](/people/u-ann)',
        references: [{ kind: 'person', id: 'u-ann', label: '@Ann' }],
      });
      // The sent draft is cleared from the editor, not left behind.
      await waitFor(() => expect(editor.draft).toBe(''));
    }
  );

  it('sends what the editor holds through a send option', async () => {
    const { onSend } = await renderRich();
    editor.draft = 'later';
    act(() => (editor.props!.onChange as (v: string) => void)('l'));
    fireEvent.click(screen.getByRole('button', { name: 'More send options' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Send later' })
    );

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'later' }),
      { sendOption: 'later' }
    );
  });

  it('sends once when Enter is pressed again while the draft is read', async () => {
    const { onSend, input } = await renderRich();
    editor.draft = 'once';
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  describe('the host changes the composer while the draft is read', () => {
    it.each([
      ['disables it', { disabled: true }],
      ['makes it read-only', { readOnly: true }],
      ['removes onSend', { onSend: undefined }],
    ] as const)(
      'sends nothing and keeps the draft when it %s',
      async (_, change) => {
        const { onSend, input, rerender } = await renderRich();
        editor.draft = 'hold on';
        let release = () => {};
        editor.reading = new Promise<void>((resolve) => (release = resolve));
        fireEvent.keyDown(input, { key: 'Enter' });
        const onValueChange = vi.fn();
        rerender(
          <ChatComposer
            editor="rich"
            onSend={onSend}
            onValueChange={onValueChange}
            triggers={[person]}
            {...change}
          />
        );
        await act(async () => release());
        await act(async () => {});
        expect(onSend).not.toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
      }
    );
  });

  it('sends to the conversation it was written in when the host switches meanwhile', async () => {
    const sendToA = vi.fn();
    const sendToB = vi.fn();
    const { input, rerender } = await renderRich({
      onSend: sendToA,
      replyTo: { id: 'a-1', senderName: 'Ann', content: 'In A' },
    });
    editor.draft = 'for A';
    let release = () => {};
    editor.reading = new Promise<void>((resolve) => (release = resolve));
    fireEvent.keyDown(input, { key: 'Enter' });
    // SuperChatInbox reuses the composer; its onSend now targets B.
    rerender(
      <ChatComposer
        editor="rich"
        onSend={sendToB}
        triggers={[person]}
        replyTo={{ id: 'b-1', senderName: 'Bo', content: 'In B' }}
      />
    );
    await act(async () => release());

    await waitFor(() => expect(sendToA).toHaveBeenCalledTimes(1));
    expect(sendToA.mock.calls[0][0]).toMatchObject({
      content: 'for A',
      replyToId: 'a-1',
    });
    expect(sendToB).not.toHaveBeenCalled();
  });

  it('sends nothing, and clears nothing, when the host swaps in another draft meanwhile', async () => {
    const sendToA = vi.fn();
    const sendToB = vi.fn();
    const onValueChange = vi.fn();
    const { input, rerender } = await renderRich({
      onSend: sendToA,
      value: 'for A',
      onValueChange,
    });
    editor.draft = 'for A';
    let release = () => {};
    editor.reading = new Promise<void>((resolve) => (release = resolve));
    fireEvent.keyDown(input, { key: 'Enter' });
    // The host switches to B: its callback, reply target and draft.
    rerender(
      <ChatComposer
        editor="rich"
        onSend={sendToB}
        value="for B"
        onValueChange={onValueChange}
        triggers={[person]}
        replyTo={{ id: 'b-1', senderName: 'Bo', content: 'In B' }}
      />
    );
    // The editor reloads B's draft, so its read now returns it.
    editor.draft = 'for B';
    await act(async () => release());
    await act(async () => {});

    expect(sendToA).not.toHaveBeenCalled();
    expect(sendToB).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('still sends when the host only echoes the composer’s own edits', async () => {
    function Host({ onSend }: { onSend: (m: unknown) => void }) {
      const [value, setValue] = React.useState('');
      return (
        <ChatComposer
          editor="rich"
          onSend={onSend}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    const onSend = vi.fn();
    renderWithTheme(<Host onSend={onSend} />);
    const input = await screen.findByRole('textbox', {
      name: /message input/i,
    });
    act(() => (editor.props!.onChange as (v: string) => void)('hel'));
    editor.draft = 'hello';
    let release = () => {};
    editor.reading = new Promise<void>((resolve) => (release = resolve));
    fireEvent.keyDown(input, { key: 'Enter' });
    act(() => (editor.props!.onChange as (v: string) => void)('hello'));
    await act(async () => release());

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0][0]).toMatchObject({ content: 'hello' });
  });

  describe('attachments changed while the draft is read', () => {
    function holdRead() {
      let release = () => {};
      editor.reading = new Promise<void>((resolve) => (release = resolve));
      return () => act(async () => release());
    }

    it('sends a file added meanwhile', async () => {
      const ref = React.createRef<ChatComposerHandle>();
      const { onSend, input } = await renderRich({ ref });
      editor.draft = 'see file';
      const release = holdRead();
      fireEvent.keyDown(input, { key: 'Enter' });
      const late = new File(['data'], 'late.txt', { type: 'text/plain' });
      act(() => ref.current!.addFiles([late]));
      await release();

      await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
      expect(onSend.mock.calls[0][0].attachments).toEqual([late]);
      expect(screen.queryByText('late.txt')).not.toBeInTheDocument();
    });

    it('leaves out a file removed meanwhile', async () => {
      const ref = React.createRef<ChatComposerHandle>();
      const { onSend, input } = await renderRich({ ref });
      const gone = new File(['data'], 'gone.txt', { type: 'text/plain' });
      act(() => ref.current!.addFiles([gone]));
      editor.draft = 'no file';
      const release = holdRead();
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.click(screen.getByRole('button', { name: 'Remove gone.txt' }));
      await release();

      await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
      expect(onSend.mock.calls[0][0].attachments).toEqual([]);
    });
  });

  it('sends nothing when the editor holds only whitespace', async () => {
    const { onSend, input } = await renderRich();
    editor.draft = '   ';
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => {});
    expect(onSend).not.toHaveBeenCalled();
  });

  it('autofocuses the editor once it has loaded', async () => {
    await renderRich({ autoFocus: true });
    await waitFor(() => expect(editor.focus).toHaveBeenCalledTimes(1));
  });

  it('focuses the editor for a reply target', async () => {
    const { rerender } = await renderRich();
    editor.focus.mockClear();
    rerender(
      <ChatComposer
        editor="rich"
        onSend={vi.fn()}
        replyTo={{ id: 'm1', senderName: 'Ann', content: 'Hi' }}
      />
    );
    await waitFor(() => expect(editor.focus).toHaveBeenCalled());
  });

  it('takes no pasted or dropped media, which would skip the attachment checks', async () => {
    await renderRich();
    expect(editor.props!.omitExtensions).toContain('mediaUpload');
  });

  it('keeps a controlled composer strict, so a rejected edit reverts', async () => {
    await renderRich({ value: 'fixed', onValueChange: vi.fn() });
    expect(editor.props!.strictValue).toBe(true);
  });

  it('leaves an uncontrolled composer lenient', async () => {
    await renderRich();
    expect(editor.props!.strictValue).toBe(false);
  });
  it('waits for a file attached while the draft is read', async () => {
    let finishRead = () => {};
    editor.reading = new Promise<void>((resolve) => (finishRead = resolve));
    let finishUpload = (_value: unknown) => {};
    const upload = vi.fn(
      () => new Promise<unknown>((resolve) => (finishUpload = resolve))
    );
    const ref = React.createRef<ChatComposerHandle>();
    const { onSend } = await renderRich({ ref, uploadAttachment: upload });
    editor.draft = 'With a file';
    act(() => (editor.props!.onChange as (v: string) => void)('W'));
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    act(() => ref.current?.addFiles([file]));
    await act(async () => finishRead());
    expect(onSend).not.toHaveBeenCalled();
    await act(async () => finishUpload({ id: 'v1' }));
    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'With a file',
          uploads: [{ file, result: { id: 'v1' } }],
        })
      )
    );
  });
  it('puts focus back in the editor when a tile is removed or retried', async () => {
    let failUpload = (_error: Error) => {};
    const upload = vi.fn(
      () => new Promise<unknown>((_resolve, reject) => (failUpload = reject))
    );
    const ref = React.createRef<ChatComposerHandle>();
    await renderRich({ ref, uploadAttachment: upload });
    await waitFor(() => expect(editor.props?.onReady).toBeDefined());
    await act(async () => {});
    const clip = () => new File(['x'], 'clip.mp4', { type: 'video/mp4' });

    act(() => ref.current?.addFiles([clip()]));
    editor.focus.mockClear();
    fireEvent.click(
      screen.getByRole('button', { name: 'Cancel upload of clip.mp4' })
    );
    expect(editor.focus).toHaveBeenCalledTimes(1);

    act(() => ref.current?.addFiles([clip()]));
    await act(async () => failUpload(new Error('offline')));
    editor.focus.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Retry clip.mp4' }));
    expect(editor.focus).toHaveBeenCalledTimes(1);
  });
});
