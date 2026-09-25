import * as React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
  act,
} from '@testing-library/react';
import { AIChat, type AIChatComposerProps } from './AIChat';
import type { AIMessage } from './types';

const messages: AIMessage[] = [
  {
    id: 'm1',
    role: 'user',
    status: 'complete',
    timestamp: new Date('2026-01-01T10:00:00Z'),
    content: [{ type: 'text', text: 'hello' }],
  },
  {
    id: 'm2',
    role: 'assistant',
    status: 'complete',
    timestamp: new Date('2026-01-01T10:00:05Z'),
    content: [{ type: 'text', text: 'hi there' }],
  },
];

async function setupUser() {
  const { default: userEvent } = await import('@testing-library/user-event');
  return userEvent.setup();
}

afterEach(() => {
  vi.useRealTimers();
});

describe('AIChat (ChatComposer integration)', () => {
  it('keeps the "Message" input label and sends trimmed text', async () => {
    const onSendMessage = vi.fn();
    const user = await setupUser();
    render(<AIChat messages={messages} onSendMessage={onSendMessage} />);
    // MessageComposer parity: same accessible name as before the swap.
    const input = screen.getByLabelText('Message');
    await user.type(input, '  what are my labs?  ');
    await user.click(screen.getByLabelText('Send message'));
    expect(onSendMessage).toHaveBeenCalledWith('what are my labs?');
    // The composer clears after a successful send.
    expect(input).toHaveValue('');
  });

  it('sends on Enter and inserts a newline on Shift+Enter', async () => {
    const onSendMessage = vi.fn();
    const user = await setupUser();
    render(<AIChat messages={messages} onSendMessage={onSendMessage} />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(onSendMessage).not.toHaveBeenCalled();
    await user.type(input, '{Enter}');
    expect(onSendMessage).toHaveBeenCalledWith('line one\nline two');
  });

  it('disables the composer while generating', () => {
    render(<AIChat messages={messages} isGenerating onSendMessage={vi.fn()} />);
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('restores the draft when onSendMessage throws', async () => {
    const onSendMessage = vi.fn(() => {
      throw new Error('backend down');
    });
    const user = await setupUser();
    render(<AIChat messages={messages} onSendMessage={onSendMessage} />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'important question');
    await user.click(screen.getByLabelText('Send message'));
    // The composer clears optimistically; AIChat restores the draft on
    // failure (MessageComposer parity).
    await waitFor(() => expect(input).toHaveValue('important question'));
  });

  it('restores the draft when an async onSendMessage rejects and reports onError', async () => {
    const onSendMessage = vi.fn(() =>
      Promise.reject(new Error('backend down'))
    );
    const onError = vi.fn();
    const user = await setupUser();
    render(
      <AIChat
        messages={messages}
        onSendMessage={onSendMessage}
        composerProps={{ onError }}
      />
    );
    const input = screen.getByLabelText('Message');
    await user.type(input, 'important question');
    await user.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(input).toHaveValue('important question'));
    // Same copy MessageComposer reported through onError.
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Failed to send message',
        expect.objectContaining({ reason: 'send-failed' })
      )
    );
  });

  it('does not clobber newer input when a stale send fails', async () => {
    let rejectSend!: (reason: Error) => void;
    const onSendMessage = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSend = reject;
        })
    );
    const user = await setupUser();
    render(<AIChat messages={messages} onSendMessage={onSendMessage} />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'first message');
    await user.click(screen.getByLabelText('Send message'));
    // While the send is pending, the user starts a newer draft.
    await user.type(input, 'newer draft');
    rejectSend(new Error('backend down'));
    await waitFor(() => expect(onSendMessage).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The failed send must not overwrite the newer input.
    expect(input).toHaveValue('newer draft');
  });

  it('does not restore a stale failed send over a newer in-flight send', async () => {
    // Two sends in flight: the first rejects after the second was submitted.
    // ChatComposer's optimistic clear bumps the draft epoch before onSend
    // runs, so the stale failure must not resurrect the first message — and
    // the second send's own failure must still restore the second message.
    const rejecters: Array<(reason: Error) => void> = [];
    const onSendMessage = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejecters.push(reject);
        })
    );
    const user = await setupUser();
    render(<AIChat messages={messages} onSendMessage={onSendMessage} />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'first message');
    await user.click(screen.getByLabelText('Send message'));
    await user.type(input, 'second message');
    await user.click(screen.getByLabelText('Send message'));
    expect(onSendMessage).toHaveBeenCalledTimes(2);
    rejecters[0](new Error('backend down'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The stale failure must not restore the first message.
    expect(input).toHaveValue('');
    rejecters[1](new Error('backend down'));
    // The latest send's failure still restores its own draft.
    await waitFor(() => expect(input).toHaveValue('second message'));
  });

  it('restores a host-controlled draft through onValueChange on failure', async () => {
    const onSendMessage = vi.fn(() =>
      Promise.reject(new Error('backend down'))
    );
    function Host() {
      const [value, setValue] = React.useState('');
      return (
        <AIChat
          messages={messages}
          onSendMessage={onSendMessage}
          composerProps={{ value, onValueChange: setValue }}
        />
      );
    }
    const user = await setupUser();
    render(<Host />);
    const input = screen.getByLabelText('Message');
    await user.type(input, 'controlled draft');
    await user.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(input).toHaveValue('controlled draft'));
  });

  it('does not invoke onValueChange when uncontrolled (no value prop)', async () => {
    // MessageComposer only fired onValueChange in controlled mode
    // (value !== undefined); the legacy contract must hold.
    const onValueChange = vi.fn();
    const user = await setupUser();
    render(
      <AIChat
        messages={messages}
        onSendMessage={vi.fn()}
        composerProps={{ onValueChange }}
      />
    );
    const input = screen.getByLabelText('Message');
    await user.type(input, 'hi');
    expect(input).toHaveValue('hi');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps parity defaults when composerProps forwards explicit undefined', () => {
    // A shared host config object may contain these keys set to undefined;
    // MessageComposer's destructuring defaults treated that as absent.
    render(
      <AIChat
        messages={messages}
        onSendMessage={vi.fn()}
        composerProps={{
          showAttachmentPicker: true,
          allowAttachments: undefined,
          maxLength: undefined,
          inputLabel: undefined,
        }}
      />
    );
    // inputLabel falls back to "Message" (not ChatComposer's default) and
    // the legacy showAttachmentPicker mapping survives.
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByLabelText('Add to message')).toBeInTheDocument();
  });

  it('renders a RecordButton in the mic slot when talkToText is on', () => {
    const { container } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} talkToText />
    );
    const micSlot = container.querySelector(
      '[data-slot="chat-composer-mic-slot"]'
    );
    expect(micSlot).not.toBeNull();
    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
  });

  it('sends the prompt when a suggestion chip is clicked', async () => {
    const onSendMessage = vi.fn();
    const user = await setupUser();
    render(
      <AIChat
        messages={messages}
        onSendMessage={onSendMessage}
        suggestions={[
          { id: 's1', label: 'Schedule', prompt: 'Schedule a follow-up' },
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(onSendMessage).toHaveBeenCalledWith('Schedule a follow-up');
  });

  describe('legacy MessageComposer composerProps compatibility', () => {
    it('hides attachments by default and maps showAttachmentPicker to allowAttachments', () => {
      const { rerender } = render(
        <AIChat messages={messages} onSendMessage={vi.fn()} />
      );
      expect(screen.queryByLabelText('Add to message')).toBeNull();
      rerender(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ showAttachmentPicker: true }}
        />
      );
      expect(screen.getByLabelText('Add to message')).toBeInTheDocument();
    });

    it('treats a present-but-undefined showAttachmentPicker as enabled', () => {
      // MessageComposer defaulted showAttachmentPicker to true, so the old
      // {...composerProps} spread turned an explicit undefined into
      // "enabled" (with the legacy accept/size defaults).
      const { container } = render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ showAttachmentPicker: undefined }}
        />
      );
      expect(screen.getByLabelText('Add to message')).toBeInTheDocument();
      expect(container.querySelector('input[type="file"]')).toHaveAttribute(
        'accept',
        'image/*,video/*,.pdf,.doc,.docx'
      );
    });

    it('forwards staged attachments to onSendMessage', async () => {
      const user = await setupUser();
      const onSendMessage = vi.fn();
      const { container } = render(
        <AIChat
          messages={messages}
          onSendMessage={onSendMessage}
          composerProps={{ showAttachmentPicker: true }}
        />
      );
      const file = new File(['data'], 'notes.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
      await user.type(screen.getByLabelText('Message'), 'see attached');
      await user.click(screen.getByLabelText('Send message'));
      expect(onSendMessage).toHaveBeenCalledWith('see attached', [file]);
    });

    it('delivers attachment-only sends instead of dropping the files', async () => {
      // ChatComposer clears its staged files before `onSend` resolves, so a
      // swallowed attachment-only send would silently destroy them.
      const user = await setupUser();
      const onSendMessage = vi.fn();
      const { container } = render(
        <AIChat
          messages={messages}
          onSendMessage={onSendMessage}
          composerProps={{ showAttachmentPicker: true }}
        />
      );
      const file = new File(['data'], 'notes.pdf', { type: 'application/pdf' });
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [file] },
      });
      await user.click(screen.getByLabelText('Send message'));
      expect(onSendMessage).toHaveBeenCalledWith('', [file]);
    });

    it('renders a legacy inputTrailing node in the mic slot', () => {
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{
            inputTrailing: <span data-testid="legacy-trailing">mic</span>,
          }}
        />
      );
      expect(screen.getByTestId('legacy-trailing')).toBeInTheDocument();
    });

    it('applies MessageComposer attachment validation defaults on the legacy path', () => {
      const { container, rerender } = render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ showAttachmentPicker: true }}
        />
      );
      // MessageComposer's defaults; ChatComposer alone leaves this unset.
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute(
        'accept',
        'image/*,video/*,.pdf,.doc,.docx'
      );
      // Explicit composerProps values still win over the legacy defaults.
      rerender(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{
            showAttachmentPicker: true,
            acceptedFileTypes: ['.png'],
          }}
        />
      );
      expect(container.querySelector('input[type="file"]')).toHaveAttribute(
        'accept',
        '.png'
      );
      // The new API path stays unrestricted (ChatComposer semantics).
      rerender(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ allowAttachments: true }}
        />
      );
      expect(container.querySelector('input[type="file"]')).not.toHaveAttribute(
        'accept'
      );
      // Forwarding `acceptedFileTypes: undefined` (optional host config) must
      // not erase the legacy defaults — MessageComposer treated it as absent.
      rerender(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{
            showAttachmentPicker: true,
            acceptedFileTypes: undefined,
            maxFileSize: undefined,
          }}
        />
      );
      expect(container.querySelector('input[type="file"]')).toHaveAttribute(
        'accept',
        'image/*,video/*,.pdf,.doc,.docx'
      );
    });

    it('passes mentionOptions through to the ChatComposer mention menu', () => {
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{
            mentionOptions: [
              { id: 'u1', label: 'Trish Nurse' },
              { id: 'u2', label: 'Sam Clerk' },
            ],
          }}
        />
      );
      fireEvent.change(screen.getByLabelText('Message'), {
        target: { value: 'Hi @tri' },
      });
      expect(
        screen.getByRole('listbox', { name: 'Mention' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /Trish Nurse/ })
      ).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /Sam Clerk/ })).toBeNull();
    });

    it('suppresses the mic when inputTrailing is explicitly null', () => {
      const { container } = render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          talkToText
          composerProps={{ inputTrailing: null }}
        />
      );
      // No AIChat RecordButton, no ChatComposer default mic button.
      expect(screen.queryByLabelText('Start recording')).toBeNull();
      expect(screen.queryByLabelText('Start voice input')).toBeNull();
      expect(
        container.querySelector('[data-slot="chat-composer-mic-slot"]')
      ).toBeNull();
    });

    it('suppresses the mic for a false conditional inputTrailing node', () => {
      // Legacy hosts write `inputTrailing={cond && <Mic />}` — the false
      // branch must not mount an empty ChatComposer mic slot.
      const { container } = render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          talkToText
          composerProps={{ inputTrailing: false }}
        />
      );
      expect(screen.queryByLabelText('Start recording')).toBeNull();
      expect(screen.queryByLabelText('Start voice input')).toBeNull();
      expect(
        container.querySelector('[data-slot="chat-composer-mic-slot"]')
      ).toBeNull();
    });

    it('lets composerProps micSlot win over inputTrailing and talkToText', () => {
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          talkToText
          composerProps={{
            inputTrailing: <span data-testid="legacy-trailing">a</span>,
            micSlot: <span data-testid="new-mic-slot">b</span>,
          }}
        />
      );
      expect(screen.getByTestId('new-mic-slot')).toBeInTheDocument();
      expect(screen.queryByTestId('legacy-trailing')).toBeNull();
      expect(screen.queryByLabelText('Start recording')).toBeNull();
    });

    it('passes micSlot null through to ChatComposer semantics', () => {
      // micSlot is a ChatComposerProps passthrough, not a legacy key: null
      // must forward raw, where ChatComposer renders its default mic button
      // — it must not be normalized away like a falsy inputTrailing.
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          talkToText
          composerProps={{ micSlot: null }}
        />
      );
      expect(screen.queryByLabelText('Start recording')).toBeNull();
      expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
    });

    it('falls back to talkToText when micSlot is explicitly undefined', () => {
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          talkToText
          composerProps={{ micSlot: undefined }}
        />
      );
      expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
    });

    it('accepts legacy variant and showCameraButton without effect', () => {
      const legacy: AIChatComposerProps = {
        variant: 'minimal',
        showCameraButton: true,
      };
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={legacy}
        />
      );
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
    });

    it('emulates onTypingStart / onTypingStop (idle + send)', async () => {
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ onTypingStart, onTypingStop }}
        />
      );
      const input = screen.getByLabelText('Message');
      fireEvent.change(input, { target: { value: 'typing…' } });
      expect(onTypingStart).toHaveBeenCalledTimes(1);
      expect(onTypingStop).not.toHaveBeenCalled();
      // Sending stops typing immediately (MessageComposer parity).
      fireEvent.click(screen.getByLabelText('Send message'));
      expect(onTypingStop).toHaveBeenCalled();
    });

    it('stops typing after 2s idle', () => {
      vi.useFakeTimers();
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ onTypingStart, onTypingStop }}
        />
      );
      const input = screen.getByLabelText('Message');
      fireEvent.change(input, { target: { value: 'typing…' } });
      expect(onTypingStart).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      expect(onTypingStop).toHaveBeenCalledTimes(1);
      // MessageComposer parity: while the draft stays non-empty the cycle
      // restarts — a keepalive loop hosts' typing indicators rely on.
      expect(onTypingStart).toHaveBeenCalledTimes(2);
      cleanup();
    });

    it('lets composerProps override the built-in defaults (placeholder, disabled)', () => {
      render(
        <AIChat
          messages={messages}
          isGenerating
          onSendMessage={vi.fn()}
          composerProps={{
            placeholder: 'Custom placeholder',
            disabled: false,
            isSending: false,
          }}
        />
      );
      const input = screen.getByPlaceholderText('Custom placeholder');
      // OzwellChatView relies on re-enabling the composer while generating.
      expect(input).not.toBeDisabled();
    });

    it('lets composerProps override onSend entirely', async () => {
      const onSendMessage = vi.fn();
      const onSend = vi.fn();
      const user = await setupUser();
      render(
        <AIChat
          messages={messages}
          onSendMessage={onSendMessage}
          composerProps={{ onSend }}
        />
      );
      const input = screen.getByLabelText('Message');
      await user.type(input, 'custom send');
      await user.click(screen.getByLabelText('Send message'));
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'custom send' })
      );
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('stops typing on send even when composerProps overrides onSend', async () => {
      const onTypingStart = vi.fn();
      const onTypingStop = vi.fn();
      const onSend = vi.fn();
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ onSend, onTypingStart, onTypingStop }}
        />
      );
      const input = screen.getByLabelText('Message');
      fireEvent.change(input, { target: { value: 'host send' } });
      expect(onTypingStart).toHaveBeenCalledTimes(1);
      // MessageComposer parity: its submit path stopped typing even when
      // the host overrode onSend.
      fireEvent.click(screen.getByLabelText('Send message'));
      expect(onTypingStop).toHaveBeenCalledTimes(1);
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'host send' })
      );
    });

    it('restores the draft when a composerProps onSend rejects', async () => {
      const onSend = vi.fn(() => Promise.reject(new Error('backend down')));
      const onError = vi.fn();
      const user = await setupUser();
      render(
        <AIChat
          messages={messages}
          onSendMessage={vi.fn()}
          composerProps={{ onSend, onError }}
        />
      );
      const input = screen.getByLabelText('Message');
      await user.type(input, 'important question');
      await user.click(screen.getByLabelText('Send message'));
      // MessageComposer restored the draft on failure for host onSend too.
      await waitFor(() => expect(input).toHaveValue('important question'));
      await waitFor(() =>
        expect(onError).toHaveBeenCalledWith(
          'Failed to send message',
          expect.objectContaining({ reason: 'send-failed' })
        )
      );
    });
  });
});

describe('AIChat scroll anchoring', () => {
  // jsdom has no layout, so scroll metrics are mocked directly on the
  // messages container and position changes are driven with scroll events.
  function getMessagesEl(container: HTMLElement): HTMLDivElement {
    const el = container.querySelector<HTMLDivElement>(
      '[data-slot="ai-chat-messages"]'
    );
    if (!el) throw new Error('messages container not found');
    return el;
  }

  function mockMetrics(
    el: HTMLElement,
    { scrollHeight = 1000, clientHeight = 400 } = {}
  ) {
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      value: scrollHeight,
    });
    Object.defineProperty(el, 'clientHeight', {
      configurable: true,
      value: clientHeight,
    });
  }

  function appended(role: 'user' | 'assistant'): AIMessage[] {
    return [
      ...messages,
      {
        id: `new-${role}`,
        role,
        status: 'complete',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'more content below' }],
      },
    ];
  }

  afterEach(() => cleanup());

  it('shows the jump-to-bottom button only while scrolled up', () => {
    const { container } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);

    // At the bottom (1000 - 600 - 400 = 0): no button.
    thread.scrollTop = 600;
    fireEvent.scroll(thread);
    expect(screen.queryByLabelText('Scroll to bottom')).toBeNull();

    // Scrolled up: the button appears.
    thread.scrollTop = 100;
    fireEvent.scroll(thread);
    expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument();
  });

  it('preserves the reading position when a reply arrives while scrolled up, and flags it', () => {
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100;
    fireEvent.scroll(thread);

    rerender(
      <AIChat messages={appended('assistant')} onSendMessage={vi.fn()} />
    );

    // Position untouched; the button now carries the new-messages hint.
    expect(thread.scrollTop).toBe(100);
    expect(screen.getByText('New messages')).toBeInTheDocument();
    expect(
      screen.getByLabelText('New messages — scroll to bottom')
    ).toBeInTheDocument();
  });

  it('follows an incoming reply while at the bottom', () => {
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 600; // at the bottom
    fireEvent.scroll(thread);

    rerender(
      <AIChat messages={appended('assistant')} onSendMessage={vi.fn()} />
    );

    expect(thread.scrollTop).toBe(thread.scrollHeight);
    expect(screen.queryByText('New messages')).toBeNull();
  });

  it('opens an anchored turn for the user’s own message instead of pinning to the bottom', () => {
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100; // scrolled up
    fireEvent.scroll(thread);

    rerender(<AIChat messages={appended('user')} onSendMessage={vi.fn()} />);

    // The new turn reserves a viewport of space (clientHeight 400 − px-4/py-4
    // padding) so its start can anchor to the top edge…
    const turn = container.querySelector<HTMLElement>(
      '[data-slot="ai-chat-turn"]'
    );
    expect(turn).not.toBeNull();
    expect(turn!.style.minHeight).toBe('368px');
    expect(turn!.textContent).toContain('more content below');
    // …and the thread is NOT yanked to the bottom (reading mode).
    expect(thread.scrollTop).not.toBe(thread.scrollHeight);
  });

  it('does not anchor a turn for user messages arriving with a session switch', () => {
    const { container, rerender } = render(
      <AIChat
        session={{
          id: 's1',
          messages,
          createdAt: new Date('2026-01-01T10:00:00Z'),
          updatedAt: new Date('2026-01-01T10:00:00Z'),
          isGenerating: false,
        }}
        onSendMessage={vi.fn()}
      />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100; // scrolled up in the old session
    fireEvent.scroll(thread);

    // The replacement session is longer and contains the user's messages —
    // that's history, not a fresh send: reset to the bottom, no turn.
    rerender(
      <AIChat
        session={{
          id: 's2',
          messages: appended('user'),
          createdAt: new Date('2026-01-01T10:00:00Z'),
          updatedAt: new Date('2026-01-01T10:05:00Z'),
          isGenerating: false,
        }}
        onSendMessage={vi.fn()}
      />
    );

    expect(container.querySelector('[data-slot="ai-chat-turn"]')).toBeNull();
    expect(thread.scrollTop).toBe(thread.scrollHeight);
  });

  it('holds instead of following when mounted with a streaming reply', () => {
    const streaming: AIMessage[] = [
      ...messages,
      {
        id: 'live',
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'tokens…' }],
      },
    ];
    const { container, rerender } = render(
      <AIChat messages={streaming} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 600; // at the bottom
    fireEvent.scroll(thread);

    // The mount established a stream hold, so the next growth must not
    // push the view to the bottom (a pinned follow would set scrollTop to
    // scrollHeight).
    rerender(
      <AIChat
        messages={[
          ...streaming,
          {
            id: 'more',
            role: 'assistant',
            status: 'complete',
            timestamp: new Date('2026-01-01T10:06:00Z'),
            content: [{ type: 'text', text: 'more content below' }],
          },
        ]}
        onSendMessage={vi.fn()}
      />
    );

    expect(thread.scrollTop).toBe(600);
  });

  it('anchors the new turn when a batch append ends with an assistant placeholder', () => {
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100; // scrolled up
    fireEvent.scroll(thread);

    // Optimistic send: the user's message and the assistant placeholder land
    // in a single update, so the final message is not the user's.
    const batch: AIMessage[] = [
      ...messages,
      {
        id: 'new-user',
        role: 'user',
        status: 'complete',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'a question' }],
      },
      {
        id: 'new-assistant',
        role: 'assistant',
        status: 'complete',
        timestamp: new Date('2026-01-01T10:05:01Z'),
        content: [{ type: 'text', text: 'thinking…' }],
      },
    ];
    rerender(<AIChat messages={batch} onSendMessage={vi.fn()} />);

    // The turn starts at the user's message and carries the placeholder.
    const turn = container.querySelector<HTMLElement>(
      '[data-slot="ai-chat-turn"]'
    );
    expect(turn).not.toBeNull();
    expect(turn!.textContent).toContain('a question');
    expect(turn!.textContent).toContain('thinking…');
    expect(thread.scrollTop).not.toBe(thread.scrollHeight);
  });

  it('upgrades the jump button to “New messages” when a stream finishes below the fold', () => {
    const streaming: AIMessage[] = [
      ...messages,
      {
        id: 'stream-1',
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'partial answer…' }],
      },
    ];
    const { container, rerender } = render(
      <AIChat messages={streaming} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100; // the end of the reply is below the fold
    fireEvent.scroll(thread);
    expect(screen.queryByText('New messages')).toBeNull(); // still streaming

    const finished: AIMessage[] = [
      ...messages,
      { ...streaming.at(-1)!, status: 'complete' },
    ];
    rerender(<AIChat messages={finished} onSendMessage={vi.fn()} />);

    expect(screen.getByText('New messages')).toBeInTheDocument();
  });

  it('raises no hint when a stream finishes while the reader is at the bottom', () => {
    const streaming: AIMessage[] = [
      ...messages,
      {
        id: 'stream-1',
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'partial answer…' }],
      },
    ];
    const { container, rerender } = render(
      <AIChat messages={streaming} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 600; // at the bottom
    fireEvent.scroll(thread);

    const finished: AIMessage[] = [
      ...messages,
      { ...streaming.at(-1)!, status: 'complete' },
    ];
    rerender(<AIChat messages={finished} onSendMessage={vi.fn()} />);

    expect(screen.queryByText('New messages')).toBeNull();
  });

  it('resumes following after a short stream that ended at the bottom', () => {
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 600; // at the bottom
    fireEvent.scroll(thread);

    // A streaming reply appends: its first line is revealed, then the view
    // holds (no following) while it streams.
    const streaming: AIMessage[] = [
      ...messages,
      {
        id: 'stream-1',
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date('2026-01-01T10:05:00Z'),
        content: [{ type: 'text', text: 'short answer' }],
      },
    ];
    rerender(<AIChat messages={streaming} onSendMessage={vi.fn()} />);
    expect(thread.scrollTop).toBe(thread.scrollHeight); // revealed

    // It finishes above the fold → following resumes: the next append is
    // followed instead of raising the hint.
    const finished: AIMessage[] = [
      ...messages,
      { ...streaming.at(-1)!, status: 'complete' },
    ];
    rerender(<AIChat messages={finished} onSendMessage={vi.fn()} />);
    rerender(
      <AIChat
        messages={[...finished, ...appended('assistant').slice(-1)]}
        onSendMessage={vi.fn()}
      />
    );
    expect(thread.scrollTop).toBe(thread.scrollHeight);
    expect(screen.queryByText('New messages')).toBeNull();
  });

  it('jump-to-bottom scrolls down, clears the hint, and hides', async () => {
    const user = await setupUser();
    const { container, rerender } = render(
      <AIChat messages={messages} onSendMessage={vi.fn()} />
    );
    const thread = getMessagesEl(container);
    mockMetrics(thread);
    thread.scrollTop = 100;
    fireEvent.scroll(thread);
    rerender(
      <AIChat messages={appended('assistant')} onSendMessage={vi.fn()} />
    );

    await user.click(screen.getByLabelText('New messages — scroll to bottom'));

    expect(thread.scrollTop).toBe(thread.scrollHeight);
    expect(screen.queryByText('New messages')).toBeNull();
    expect(screen.queryByLabelText('Scroll to bottom')).toBeNull();
  });
});
