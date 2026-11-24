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
      // Clearing the value empties the document, as the real editor reloads.
      React.useEffect(() => {
        if (!props.value) editor.draft = '';
      }, [props.value]);
      React.useImperativeHandle(ref, () => ({
        getContent: async () => {
          if (editor.reading) await editor.reading;
          return editor.draft;
        },
        focus: editor.focus,
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
    expect(editor.focus).toHaveBeenCalledTimes(1);
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
    expect(editor.focus).toHaveBeenCalled();
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
    expect(editor.focus).toHaveBeenCalled();
  });

  it('keeps a controlled composer strict, so a rejected edit reverts', async () => {
    await renderRich({ value: 'fixed', onValueChange: vi.fn() });
    expect(editor.props!.strictValue).toBe(true);
  });

  it('leaves an uncontrolled composer lenient', async () => {
    await renderRich();
    expect(editor.props!.strictValue).toBe(false);
  });
});
