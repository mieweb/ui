import * as React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JumpToBottomButton } from '../ChatComposer/JumpToBottomButton';
import { SuperChat } from './SuperChat';
import type { SuperChatSlotContext } from './SuperChat';
import type { ComposerAttachment, SuperChatConversation } from './types';
import * as parts from './parts';

const first: SuperChatConversation = {
  id: 'first',
  title: 'First conversation',
  participants: [{ id: 'user', kind: 'human', name: 'User' }],
  thread: [
    {
      id: 'one',
      participantId: 'user',
      text: 'Existing message',
      time: '2026-10-03T10:00:00Z',
    },
  ],
};
const second: SuperChatConversation = {
  ...first,
  id: 'second',
  title: 'Second conversation',
  thread: [],
};

function pendingSend() {
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((_resolve, fail) => {
    reject = fail;
  });
  return { promise, reject };
}

describe('SuperChat panel integration', () => {
  it('replaces the built-in composer and updates both slot contexts', () => {
    const renderComposer = vi.fn((context: SuperChatSlotContext) => (
      <button disabled={context.readOnly}>
        Send to {context.conversation.title}
      </button>
    ));
    const renderStatus = vi.fn((context: SuperChatSlotContext) => (
      <p>Status for {context.conversation.title}</p>
    ));
    const { container, rerender } = render(
      <SuperChat
        conversation={first}
        currentParticipantId="user"
        renderComposer={renderComposer}
        renderStatus={renderStatus}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Send to First conversation' })
    ).toBeEnabled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    const status = container.querySelector('[data-slot="superchat-status"]');
    expect(status?.previousElementSibling).toHaveAttribute(
      'data-slot',
      'superchat-header'
    );
    expect(renderComposer).toHaveBeenLastCalledWith({
      conversation: first,
      currentParticipantId: 'user',
      readOnly: false,
    });

    rerender(
      <SuperChat
        conversation={second}
        currentParticipantId="other"
        readOnly
        renderComposer={renderComposer}
        renderStatus={renderStatus}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Send to Second conversation' })
    ).toBeDisabled();
    const expected = {
      conversation: second,
      currentParticipantId: 'other',
      readOnly: true,
    };
    expect(renderComposer).toHaveBeenLastCalledWith(expected);
    expect(renderStatus).toHaveBeenLastCalledWith(expected);
  });

  it('honors a null custom composer without restoring the default', () => {
    const { container } = render(
      <SuperChat conversation={first} renderComposer={() => null} />
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chat-composer"]')).toBeNull();
    expect(screen.getByText('Existing message')).toBeInTheDocument();
  });

  it.each(['loading', 'error'] as const)(
    'blocks both composers and stale transcript while %s',
    (state) => {
      const renderComposer = vi.fn(() => <button>Custom send</button>);
      const renderStatus = vi.fn(() => <p>Connection status</p>);
      const props =
        state === 'loading'
          ? { loading: true }
          : { error: <span>Reconnect to load this chat.</span> };
      const { rerender } = render(
        <SuperChat
          conversation={first}
          {...props}
          renderComposer={renderComposer}
          renderStatus={renderStatus}
          labels={{ loadingMessages: 'Loading selected conversation' }}
        />
      );
      expect(renderComposer).not.toHaveBeenCalled();
      expect(renderStatus).toHaveBeenLastCalledWith({
        conversation: first,
        currentParticipantId: undefined,
        readOnly: true,
      });
      expect(screen.queryByText('Existing message')).not.toBeInTheDocument();
      expect(
        screen.getByRole(state === 'loading' ? 'status' : 'alert')
      ).toHaveTextContent(
        state === 'loading'
          ? 'Loading selected conversation'
          : 'Reconnect to load this chat.'
      );
      rerender(<SuperChat conversation={first} {...props} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      rerender(
        <SuperChat conversation={first} renderComposer={renderComposer} />
      );
      expect(
        screen.getByRole('button', { name: 'Custom send' })
      ).toBeInTheDocument();
      expect(screen.getByText('Existing message')).toBeInTheDocument();
    }
  );

  it('supports localized, custom, and suppressed empty states without blocking compose', () => {
    const { rerender } = render(
      <SuperChat
        conversation={second}
        labels={{ noMessages: 'No messages in this chat' }}
      />
    );
    expect(screen.getByText('No messages in this chat')).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Message' })
    ).toBeInTheDocument();
    rerender(
      <SuperChat
        conversation={second}
        renderEmpty={() => <p>Begin with a question.</p>}
      />
    );
    expect(screen.getByText('Begin with a question.')).toBeInTheDocument();
    rerender(<SuperChat conversation={second} renderEmpty={() => null} />);
    expect(
      screen.queryByText('Begin with a question.')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('No messages yet')).not.toBeInTheDocument();
  });

  it('isolates built-in drafts immediately when the conversation changes', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    const { rerender } = render(
      <SuperChat conversation={first} onMessageSent={onMessageSent} />
    );
    const firstInput = screen.getByRole('textbox', { name: 'Message' });
    await user.type(firstInput, 'Draft for first');
    rerender(<SuperChat conversation={second} onMessageSent={onMessageSent} />);
    expect(screen.getByRole('textbox', { name: 'Message' })).not.toBe(
      firstInput
    );
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'Send only to second'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() =>
      expect(onMessageSent).toHaveBeenCalledWith(
        'Send only to second',
        expect.objectContaining({ conversation: second })
      )
    );
    rerender(<SuperChat conversation={first} onMessageSent={onMessageSent} />);
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  });

  it('does not restore a late failed send into another conversation or a remounted composer', async () => {
    const user = userEvent.setup();
    const send = pendingSend();
    const onMessageSent = vi.fn(() => send.promise);
    const { rerender } = render(
      <SuperChat conversation={first} onMessageSent={onMessageSent} />
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'First pending send'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onMessageSent).toHaveBeenCalledOnce());
    rerender(<SuperChat conversation={second} onMessageSent={onMessageSent} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'Second unsent draft'
    );
    await act(async () => {
      send.reject(new Error('Connection failed'));
    });
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Second unsent draft'
    );
    rerender(<SuperChat conversation={first} onMessageSent={onMessageSent} />);
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  });

  it('restores a rejected send only if its own conversation draft has not changed', async () => {
    const user = userEvent.setup();
    const send = pendingSend();
    const onMessageSent = vi.fn(() => send.promise);
    render(<SuperChat conversation={first} onMessageSent={onMessageSent} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'Retry this text'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onMessageSent).toHaveBeenCalledOnce());
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
    await act(async () => {
      send.reject(new Error('Connection failed'));
    });
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Retry this text'
    );
  });

  it('preserves newer typed input when an earlier send is rejected', async () => {
    const user = userEvent.setup();
    const send = pendingSend();
    const onMessageSent = vi.fn(() => send.promise);
    render(<SuperChat conversation={first} onMessageSent={onMessageSent} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'Sent text'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await waitFor(() => expect(onMessageSent).toHaveBeenCalledOnce());
    await user.type(
      screen.getByRole('textbox', { name: 'Message' }),
      'New draft'
    );
    await act(async () => {
      send.reject(new Error('Connection failed'));
    });
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'New draft'
    );
  });

  it('leaves host-owned custom drafts intact across conversation changes', async () => {
    const user = userEvent.setup();
    function Host({ conversation }: { conversation: SuperChatConversation }) {
      const [drafts, setDrafts] = React.useState<Record<string, string>>({});
      return (
        <SuperChat
          conversation={conversation}
          renderComposer={({ conversation: selected }) => (
            <input
              aria-label="Host draft"
              value={drafts[selected.id] ?? ''}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [selected.id]: event.target.value,
                }))
              }
            />
          )}
        />
      );
    }
    const { rerender } = render(<Host conversation={first} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Host draft' }),
      'Saved first draft'
    );
    rerender(<Host conversation={second} />);
    expect(screen.getByRole('textbox', { name: 'Host draft' })).toHaveValue('');
    await user.type(
      screen.getByRole('textbox', { name: 'Host draft' }),
      'Saved second draft'
    );
    rerender(<Host conversation={first} />);
    expect(screen.getByRole('textbox', { name: 'Host draft' })).toHaveValue(
      'Saved first draft'
    );
  });

  it('forwards localized panel/composer labels and exposes accessible back navigation', () => {
    const { container, rerender } = render(
      <SuperChat
        conversation={first}
        onBack={() => {}}
        onConversationClosed={() => {}}
        labels={{
          backToConversations: 'Volver',
          participants: 'Participantes',
          messages: 'Mensajes',
          closeConversation: 'Cerrar',
          messageInput: 'Mensaje',
          messagePlaceholder: 'Escribe aquí',
          readOnlyPlaceholder: 'Solo lectura',
        }}
        composerLabels={{ sendLabel: 'Enviar', addMenuLabel: 'Añadir' }}
      />
    );
    const back = screen.getByRole('button', { name: 'Volver' });
    expect(back).toHaveClass('min-h-11', 'min-w-11');
    expect(back.querySelector('svg')).toHaveClass('rtl:rotate-180');
    expect(container.querySelector('[data-slot="superchat"]')).toHaveAttribute(
      'tabindex',
      '-1'
    );
    expect(
      screen.getByRole('group', { name: 'Participantes' })
    ).toBeInTheDocument();
    expect(screen.getByRole('log', { name: 'Mensajes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añadir' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mensaje' })).toHaveAttribute(
      'placeholder',
      'Escribe aquí'
    );
    rerender(
      <SuperChat
        conversation={first}
        readOnly
        labels={{ readOnlyPlaceholder: 'Solo lectura' }}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute(
      'placeholder',
      'Solo lectura'
    );
  });

  it('keeps supplied message order when requested and sorts known times by default', () => {
    const conversation = {
      ...first,
      thread: [
        {
          ...first.thread[0],
          id: 'later',
          text: 'Later timestamp',
          time: '2026-10-03T12:00:00Z',
        },
        {
          ...first.thread[0],
          id: 'earlier',
          text: 'Earlier timestamp',
          time: '2026-10-03T11:00:00Z',
        },
      ],
    };
    const { rerender } = render(
      <SuperChat conversation={conversation} sortMessagesBy="provided" />
    );
    expect(screen.getAllByRole('article')[0]).toHaveTextContent(
      'Later timestamp'
    );
    rerender(<SuperChat conversation={conversation} />);
    expect(screen.getAllByRole('article')[0]).toHaveTextContent(
      'Earlier timestamp'
    );
  });

  it('initializes scrolling when the same conversation finishes loading', () => {
    const height = vi
      .spyOn(HTMLElement.prototype, 'scrollHeight', 'get')
      .mockReturnValue(1000);
    const viewport = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockReturnValue(400);
    try {
      const { rerender } = render(
        <SuperChat conversation={first} loading renderComposer={() => null} />
      );
      expect(screen.queryByRole('log')).not.toBeInTheDocument();
      rerender(<SuperChat conversation={first} renderComposer={() => null} />);
      const thread = screen.getByRole('log');
      expect(thread.scrollTop).toBe(1000);
      fireEvent.scroll(thread, { target: { scrollTop: 100 } });
      expect(
        screen.getByRole('button', { name: 'Scroll to bottom' })
      ).toBeInTheDocument();
      rerender(
        <SuperChat
          conversation={first}
          error="Unavailable"
          renderComposer={() => null}
        />
      );
      expect(screen.queryByRole('log')).not.toBeInTheDocument();
      rerender(<SuperChat conversation={first} renderComposer={() => null} />);
      expect(screen.getByRole('log').scrollTop).toBe(1000);
    } finally {
      height.mockRestore();
      viewport.mockRestore();
    }
  });

  it('does not dispatch after switching during deferred attachment conversion', async () => {
    let finish!: (attachments: ComposerAttachment[]) => void;
    const conversion = vi
      .spyOn(parts, 'filesToComposerAttachments')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
    try {
      const user = userEvent.setup();
      const onMessageSent = vi.fn();
      const { rerender } = render(
        <SuperChat conversation={first} onMessageSent={onMessageSent} />
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Message' }),
        'Converting attachment'
      );
      await user.click(screen.getByRole('button', { name: 'Send message' }));
      expect(conversion).toHaveBeenCalledOnce();
      rerender(
        <SuperChat conversation={second} onMessageSent={onMessageSent} />
      );
      await act(async () => {
        finish([]);
      });
      expect(onMessageSent).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
    } finally {
      conversion.mockRestore();
    }
  });

  it('localizes the shared scroll affordance without changing its default labels', () => {
    const labels = {
      scrollToBottom: 'Ir al final',
      newMessages: 'Nuevos mensajes',
      newMessagesScrollToBottom: 'Nuevos mensajes: ir al final',
    };
    const { rerender } = render(
      <JumpToBottomButton
        hasNewMessages={false}
        onClick={() => {}}
        dataSlot="test-jump"
        labels={labels}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Ir al final' })
    ).toBeInTheDocument();
    rerender(
      <JumpToBottomButton
        hasNewMessages
        onClick={() => {}}
        dataSlot="test-jump"
        labels={labels}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Nuevos mensajes: ir al final' })
    ).toHaveTextContent('Nuevos mensajes');
    rerender(
      <JumpToBottomButton
        hasNewMessages
        onClick={() => {}}
        dataSlot="test-jump"
      />
    );
    expect(
      screen.getByRole('button', { name: 'New messages — scroll to bottom' })
    ).toHaveTextContent('New messages');
  });
});
