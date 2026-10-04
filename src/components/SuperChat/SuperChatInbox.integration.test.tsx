import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuperChatInbox } from './SuperChatInbox';
import { SuperChatConversations } from './SuperChatConversations';
import type { SuperChatConversation } from './types';

const conversations: SuperChatConversation[] = [
  {
    id: 'one',
    title: 'First chat',
    preview: 'A summary without loaded messages',
    participants: [],
    thread: [],
  },
  {
    id: 'two',
    title: 'Second chat',
    participants: [],
    thread: [{ id: 'm', participantId: 'human', text: 'Loaded message' }],
  },
];

describe('SuperChatInbox host integration', () => {
  it('focuses the requested mobile panel after delayed controlled selection', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="one"
        readOnly
      />
    );
    const row = screen.getByRole('button', { name: /Second chat/ });
    await user.click(row);
    expect(
      container.querySelector('[data-slot="superchat"]')
    ).not.toHaveFocus();
    rerender(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        readOnly
      />
    );
    expect(container.querySelector('[data-slot="superchat"]')).toHaveFocus();
    expect(
      screen.getByRole('heading', { name: 'Second chat' })
    ).toBeInTheDocument();
  });

  it('allows explicit null selection and offers no composer or highlighted row', () => {
    const composer = vi.fn(() => <textarea aria-label="Host composer" />);
    const { container } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId={null}
        renderComposer={composer}
      />
    );
    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
    expect(container.querySelector('[aria-current="true"]')).toBeNull();
    expect(composer).not.toHaveBeenCalled();
  });

  it('preserves the legacy first-row fallback unless the host opts out', () => {
    const { rerender } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="missing"
        readOnly
      />
    );
    expect(
      screen.getByRole('heading', { name: 'First chat' })
    ).toBeInTheDocument();
    rerender(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="missing"
        selectionFallback="none"
        readOnly
      />
    );
    expect(
      screen.queryByRole('heading', { name: 'First chat' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
  });

  it('does not substitute another conversation after the selected row disappears', () => {
    const onSend = vi.fn();
    const { rerender, container } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        selectionFallback="none"
        onMessageSent={onSend}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Second chat' })
    ).toBeInTheDocument();
    rerender(
      <SuperChatInbox
        conversations={[conversations[0]]}
        activeConversationId="two"
        selectionFallback="none"
        onMessageSent={onSend}
        renderNoSelection={() => 'This conversation is unavailable'}
      />
    );
    expect(
      screen.getByText('This conversation is unavailable')
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-current="true"]')).toBeNull();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('requests controlled selection and mobile navigation without changing them itself', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onView = vi.fn();
    const { container, rerender } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId={null}
        mobileView="list"
        onConversationOpened={onOpen}
        onMobileViewChange={onView}
      />
    );
    await user.click(screen.getByRole('button', { name: /Second chat/ }));
    expect(onOpen).toHaveBeenCalledWith(conversations[1]);
    expect(onView).toHaveBeenCalledWith('chat');
    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="superchat-conversations"]')
    ).not.toHaveClass('hidden');
    rerender(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        mobileView="chat"
        onConversationOpened={onOpen}
        onMobileViewChange={onView}
        readOnly
      />
    );
    expect(
      container.querySelector('[data-slot="superchat-conversations"]')
    ).toHaveClass('hidden');
    await user.click(
      screen.getByRole('button', { name: 'Back to conversations' })
    );
    expect(onView).toHaveBeenLastCalledWith('list');
    expect(
      container.querySelector('[data-slot="superchat-conversations"]')
    ).toHaveClass('hidden');
  });

  it('keeps a back path when selection is removed while viewing chat on a phone', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="missing"
        selectionFallback="none"
        defaultMobileView="chat"
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'Back to conversations' })
    );
    expect(
      container.querySelector('[data-slot="superchat-conversations"]')
    ).not.toHaveClass('hidden');
  });

  it('forwards the exact selected conversation to replacement composer and status', () => {
    render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        currentParticipantId="human"
        renderComposer={({ conversation, currentParticipantId }) => (
          <textarea aria-label={`${conversation.id}:${currentParticipantId}`} />
        )}
        renderStatus={({ conversation }) => (
          <div role="status">Ready for {conversation.title}</div>
        )}
      />
    );
    expect(
      screen.getByRole('textbox', { name: 'two:human' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ready for Second chat'
    );
    expect(
      screen.queryByPlaceholderText(/Type a message/)
    ).not.toBeInTheDocument();
  });

  it('suppresses the selected composer while detail is loading or failed', () => {
    const composer = vi.fn(() => <textarea aria-label="Host composer" />);
    const { rerender } = render(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        conversationLoading
        renderComposer={composer}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading messages');
    expect(composer).not.toHaveBeenCalled();
    rerender(
      <SuperChatInbox
        conversations={conversations}
        activeConversationId="two"
        conversationError="The selected conversation is unavailable"
        renderComposer={composer}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The selected conversation is unavailable'
    );
    expect(composer).not.toHaveBeenCalled();
  });

  it('supports localized labels and forwards native root attributes/ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <SuperChatInbox
        ref={ref}
        dir="rtl"
        lang="ar"
        data-testid="inbox"
        conversations={conversations}
        activeConversationId={null}
        labels={{
          conversations: 'المحادثات',
          noConversationSelected: 'اختر محادثة',
          chat: 'الدردشة',
        }}
      />
    );
    expect(screen.getByLabelText('المحادثات')).toBeInTheDocument();
    expect(screen.getByText('اختر محادثة')).toBeInTheDocument();
    expect(ref.current).toBe(screen.getByTestId('inbox'));
    expect(ref.current).toHaveAttribute('dir', 'rtl');
  });
});

describe('SuperChatConversations lazy catalog', () => {
  it('renders summary previews without synthesizing thread messages', () => {
    render(<SuperChatConversations conversations={conversations} />);
    expect(
      screen.getByText('A summary without loaded messages')
    ).toBeInTheDocument();
    expect(screen.getByText('Loaded message')).toBeInTheDocument();
    expect(conversations[0].thread).toEqual([]);
  });

  it('treats an explicit empty preview as an override', () => {
    render(
      <SuperChatConversations
        conversations={[{ ...conversations[1], preview: '' }]}
      />
    );
    expect(screen.queryByText('Loaded message')).not.toBeInTheDocument();
  });

  it('distinguishes initial loading, error, and empty data, with retained rows on refresh failure', () => {
    const { rerender } = render(
      <SuperChatConversations conversations={[]} loading />
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading conversations'
    );
    expect(screen.queryByText('No conversations')).not.toBeInTheDocument();
    rerender(
      <SuperChatConversations conversations={[]} error="Desktop unavailable" />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Desktop unavailable');
    expect(screen.queryByText('No conversations')).not.toBeInTheDocument();
    rerender(
      <SuperChatConversations
        conversations={[]}
        renderEmpty={() => 'Start a conversation on your computer'}
      />
    );
    expect(
      screen.getByText('Start a conversation on your computer')
    ).toBeInTheDocument();
    rerender(
      <SuperChatConversations
        conversations={conversations}
        error="Refresh failed"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh failed');
    expect(
      screen.getByRole('button', { name: /First chat/ })
    ).toBeInTheDocument();
  });

  it('keeps standalone controlled null unselected after a selection request', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { container } = render(
      <SuperChatConversations
        conversations={conversations}
        activeConversationId={null}
        onConversationOpened={onOpen}
      />
    );
    await user.click(screen.getByRole('button', { name: /First chat/ }));
    expect(onOpen).toHaveBeenCalledWith(conversations[0]);
    expect(container.querySelector('[aria-current="true"]')).toBeNull();
  });

  it('localizes unread count as one accessible phrase', () => {
    render(
      <SuperChatConversations
        conversations={[{ ...conversations[0], unread: 2 }]}
        labels={{ unreadMessages: (count) => `${count} sin leer` }}
      />
    );
    const row = screen.getByRole('button', { name: /First chat/ });
    expect(within(row).getByText('2 sin leer')).toBeInTheDocument();
    expect(row).toHaveAccessibleName(/2 sin leer/);
  });
});
