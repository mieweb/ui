import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuperChat } from './SuperChat';
import { SuperChatInbox } from './SuperChatInbox';
import { getConversationMediaItems } from './media';
import type { SuperChatConversation } from './types';

const conversation: SuperChatConversation = {
  id: 'c1',
  title: 'First conversation',
  participants: [{ id: 'alex', kind: 'human', name: 'Alex' }],
  thread: [
    {
      id: 'm1',
      participantId: 'alex',
      time: '2026-10-03T09:00:00Z',
      text: 'First caption',
      media: [
        {
          id: 'a1',
          kind: 'image',
          src: '/first.png',
          title: 'First image',
          alt: 'First scene',
        },
        {
          id: 'a2',
          kind: 'image',
          src: '/second.png',
          title: 'Second image',
          alt: 'Second scene',
        },
      ],
    },
  ],
};

const videoConversation: SuperChatConversation = {
  ...conversation,
  thread: [
    {
      ...conversation.thread[0],
      media: [
        {
          id: 'video-1',
          kind: 'video',
          src: '/clip-one.webm',
          title: 'First clip',
        },
        {
          id: 'video-2',
          kind: 'video',
          src: '/clip-two.webm',
          title: 'Second clip',
        },
      ],
    },
  ],
};

function mockNativePlayback() {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    Object.defineProperty(this, 'paused', { configurable: true, value: true });
    this.dispatchEvent(new Event('pause'));
  });
  return vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: false,
      });
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('getConversationMediaItems', () => {
  it('preserves source message, attachment and participant identity in chronological order', () => {
    const later = {
      ...conversation.thread[0],
      id: 'm2',
      time: '2026-10-03T10:00:00Z',
      media: [{ id: 'a1', kind: 'audio' as const, src: '/recording.wav' }],
    };
    const source = { ...conversation, thread: [later, ...conversation.thread] };
    const items = getConversationMediaItems(source);
    expect(items.map((item) => item.message.id)).toEqual(['m1', 'm1', 'm2']);
    expect(items[0].message).toBe(conversation.thread[0]);
    expect(items[0].attachment).toBe(conversation.thread[0].media?.[0]);
    expect(items[0].participant).toBe(conversation.participants[0]);
    expect(items[0].conversationId).toBe('c1');
    expect(source.thread[0]).toBe(later);
    expect(new Set(items.map((item) => item.id)).size).toBe(3);
    expect(
      getConversationMediaItems({
        ...source,
        thread: [...source.thread].reverse(),
      }).map((item) => item.id)
    ).toEqual(items.map((item) => item.id));
  });

  it('uses collision-safe tuple ids even when the source ids contain delimiters', () => {
    const makeConversation = (conversationId: string, messageId: string) => ({
      ...conversation,
      id: conversationId,
      thread: [{ ...conversation.thread[0], id: messageId }],
    });
    const a = getConversationMediaItems(makeConversation('c:m', '1'))[0];
    const b = getConversationMediaItems(makeConversation('c', 'm:1'))[0];
    expect(a.id).not.toBe(b.id);
    expect(JSON.parse(a.id)).toEqual(['c:m', '1', 'a1']);
  });

  it('ignores Markdown/custom metadata and preserves an unresolved participant id', () => {
    const source = {
      ...conversation,
      thread: [
        { ...conversation.thread[0], participantId: 'unknown' },
        {
          id: 'markdown',
          participantId: 'alex',
          time: '2026-10-03T10:00:00Z',
          text: '![photo](/third.png)',
          metadata: { media: [{ src: '/third.png' }] },
        },
      ],
    };
    const items = getConversationMediaItems(source);
    expect(items).toHaveLength(2);
    expect(items[0].participant).toBeUndefined();
    expect(items[0].message.participantId).toBe('unknown');
  });
});

describe('SuperChat media view', () => {
  it('keeps the existing thread by default and opens the requested persisted attachment', async () => {
    const onActiveItemChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={conversation}
        mediaFeedProps={{ onActiveItemChange }}
      />
    );
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Second scene' })).toHaveAttribute(
      'src',
      '/second.png'
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Open in media feed' })[1]
    );
    expect(screen.queryByRole('log', { name: 'Messages' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Conversation' })).toBeNull();
    expect(onActiveItemChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: JSON.stringify(['c1', 'm1', 'a2']),
        message: conversation.thread[0],
      })
    );
    expect(
      screen.getByRole('article', { name: 'Second image' })
    ).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('article', { name: 'Second image' })).toHaveFocus();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Open in media feed' })[1]
    ).toHaveFocus();
  });

  it('leaves a text-only conversation on its existing thread surface', () => {
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [{ ...conversation.thread[0], media: undefined }],
        }}
      />
    );
    expect(screen.getByRole('log', { name: 'Messages' })).toHaveTextContent(
      'First caption'
    );
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull();
  });

  it('requests controlled view changes without replacing host state', async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SuperChat
        conversation={conversation}
        view="thread"
        onViewChange={onViewChange}
      />
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Open in media feed' })[0]
    );
    expect(onViewChange).toHaveBeenCalledWith('media', { conversation });
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
    rerender(
      <SuperChat
        conversation={conversation}
        view="media"
        onViewChange={onViewChange}
      />
    );
    expect(screen.queryByRole('log', { name: 'Messages' })).toBeNull();
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    expect(onViewChange).toHaveBeenLastCalledWith('thread', { conversation });
    expect(screen.queryByRole('log', { name: 'Messages' })).toBeNull();
    rerender(
      <SuperChat
        conversation={conversation}
        view="thread"
        onViewChange={onViewChange}
      />
    );
    expect(
      screen.getAllByRole('button', { name: 'Open in media feed' })[0]
    ).toHaveFocus();
  });

  it('Play opens only the chosen clip despite reduced motion and restores the draft and launcher on Back', async () => {
    const play = mockNativePlayback();
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    const previews = container.querySelectorAll('video');
    expect(Array.from(previews).every((video) => !video.controls)).toBe(true);
    expect(play).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Open in media feed' })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull();
    await user.type(screen.getByLabelText('Message'), 'Keep my reply');
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(
      (play.mock.contexts[0] as HTMLMediaElement).getAttribute('src')
    ).toBe('/clip-two.webm');
    expect(screen.getByRole('article', { name: 'Second clip' })).toHaveFocus();
    expect(screen.getByLabelText('Message')).toHaveValue('Keep my reply');
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    expect(
      screen.getByRole('button', { name: 'Play Second clip' })
    ).toHaveFocus();
    expect(screen.getByLabelText('Message')).toHaveValue('Keep my reply');
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(
      (play.mock.contexts[1] as HTMLMediaElement).getAttribute('src')
    ).toBe('/clip-two.webm');
  });

  it('changing an uncontrolled conversation returns to its thread without playing a new feed', async () => {
    const play = mockNativePlayback();
    const user = userEvent.setup();
    const { rerender } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    const second = {
      ...videoConversation,
      id: 'c2',
      title: 'Other conversation',
    };
    rerender(
      <SuperChat conversation={second} mediaFeedProps={{ autoPlay: false }} />
    );
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.queryByRole('feed')).toBeNull();
    expect(play).toHaveBeenCalledTimes(1);
    rerender(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.queryByRole('feed')).toBeNull();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('moves pending launch focus from Back to the selected item when loading finishes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SuperChat
        conversation={conversation}
        mediaFeedProps={{ loading: true }}
      />
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Open in media feed' })[1]
    );
    expect(
      screen.getByRole('button', { name: 'Back to conversation' })
    ).toHaveFocus();
    rerender(
      <SuperChat
        conversation={conversation}
        mediaFeedProps={{ loading: false }}
      />
    );
    expect(screen.getByRole('article', { name: 'Second image' })).toHaveFocus();
  });

  it('scopes the feed and composer callback to the selected inbox conversation', async () => {
    const second: SuperChatConversation = {
      id: 'c2',
      title: 'Second conversation',
      participants: [{ id: 'bea', kind: 'human', name: 'Bea' }],
      thread: [
        {
          ...conversation.thread[0],
          participantId: 'bea',
          text: 'Other caption',
          media: [
            {
              id: 'a1',
              kind: 'image',
              src: '/other.png',
              title: 'Other image',
              alt: 'Other scene',
            },
          ],
        },
      ],
    };
    const onMessageSent = vi.fn();
    const user = userEvent.setup();
    render(
      <SuperChatInbox
        conversations={[conversation, second]}
        view="media"
        onMessageSent={onMessageSent}
        mediaFeedProps={{
          renderActions: (item) => (
            <span data-testid="source-message">
              {item.conversationId}/{item.message.id}
            </span>
          ),
        }}
      />
    );
    expect(screen.getAllByTestId('source-message')[0]).toHaveTextContent(
      'c1/m1'
    );
    await user.click(screen.getByRole('button', { name: 'Next item' }));
    expect(
      screen.getByRole('article', { name: 'Second image' })
    ).toHaveAttribute('tabindex', '0');
    await user.click(
      screen.getByRole('button', { name: /Second conversation/ })
    );
    expect(screen.getByTestId('source-message')).toHaveTextContent('c2/m1');
    expect(screen.queryByRole('img', { name: 'First scene' })).toBeNull();
    expect(
      screen.getByRole('img', { name: 'Other scene' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: 'Other image' })
    ).toHaveAttribute('tabindex', '0');
    await user.type(screen.getByLabelText('Message'), 'Reply @Bea');
    await user.click(screen.getByLabelText('Send message'));
    await waitFor(() =>
      expect(onMessageSent).toHaveBeenCalledWith('Reply @Bea', {
        conversation: second,
        mentions: ['bea'],
        attachments: [],
      })
    );
  });

  it('restores a rejected composer send while the conversation is in media view', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn().mockRejectedValue(new Error('Send failed'));
    render(
      <SuperChat
        conversation={conversation}
        defaultView="media"
        onMessageSent={onMessageSent}
      />
    );
    const input = screen.getByLabelText('Message');
    await user.type(input, 'Keep this reply');
    await user.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(input).toHaveValue('Keep this reply'));
    expect(onMessageSent).toHaveBeenCalledWith(
      'Keep this reply',
      expect.objectContaining({ conversation })
    );
  });

  describe('thread scroll restoration', () => {
    // Mock the new thread node as well as the old one: returning from media
    // creates a fresh scroll container whose layout is read in a layout effect.
    function mockThreadLayout() {
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.dataset.slot === 'superchat-thread' ? 1000 : 0;
        }
      );
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.dataset.slot === 'superchat-thread' ? 400 : 0;
        }
      );
      vi.spyOn(
        HTMLElement.prototype,
        'getBoundingClientRect'
      ).mockImplementation(function (this: HTMLElement) {
        const top =
          this.dataset.slot === 'superchat-turn'
            ? 500 -
              (this.closest<HTMLDivElement>('[data-slot="superchat-thread"]')
                ?.scrollTop ?? 0)
            : 0;
        return new window.DOMRect(0, top, 600, 100);
      });
    }

    function thread(container: HTMLElement) {
      return container.querySelector<HTMLDivElement>(
        '[data-slot="superchat-thread"]'
      )!;
    }

    const withMessage = (participantId: string): SuperChatConversation => ({
      ...conversation,
      thread: [
        ...conversation.thread,
        {
          id: 'new-message',
          participantId,
          time: '2026-10-03T10:00:00Z',
          text: 'A reply sent while viewing media',
        },
      ],
    });

    it('keeps a reader’s position across media switches and incoming messages', () => {
      mockThreadLayout();
      const { container, rerender } = render(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
        />
      );
      const originalThread = thread(container);
      originalThread.scrollTop = 100;
      fireEvent.scroll(originalThread);
      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
        />
      );
      expect(thread(container).scrollTop).toBe(100);

      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('peer')}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('peer')}
          currentParticipantId="alex"
          view="thread"
        />
      );
      expect(thread(container).scrollTop).toBe(100);
      expect(
        screen.getByLabelText('New messages — scroll to bottom')
      ).toBeInTheDocument();
    });

    it('anchors an own send after returning from media instead of losing its pending turn', () => {
      mockThreadLayout();
      const { container, rerender } = render(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
        />
      );
      thread(container).scrollTop = 100;
      fireEvent.scroll(thread(container));
      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('alex')}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('alex')}
          currentParticipantId="alex"
          view="thread"
        />
      );
      const turn = container.querySelector<HTMLElement>(
        '[data-slot="superchat-turn"]'
      );
      expect(turn).toHaveTextContent('A reply sent while viewing media');
      expect(turn?.style.minHeight).toBe('368px');
      expect(thread(container).scrollTop).toBe(500);
    });

    it('pins a virtualized own send to the newest message when returning from media', () => {
      mockThreadLayout();
      const { container, rerender } = render(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
          virtualized
        />
      );
      thread(container).scrollTop = 100;
      fireEvent.scroll(thread(container));
      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="media"
          virtualized
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('alex')}
          currentParticipantId="alex"
          view="media"
          virtualized
        />
      );
      rerender(
        <SuperChat
          conversation={withMessage('alex')}
          currentParticipantId="alex"
          view="thread"
          virtualized
        />
      );
      expect(thread(container).scrollTop).toBe(1000);
      expect(
        container.querySelector('[data-slot="superchat-turn"]')
      ).toBeNull();
    });

    it('reveals an incoming stream on return and keeps its reading hold', () => {
      mockThreadLayout();
      const streaming: SuperChatConversation = {
        ...conversation,
        thread: [
          ...conversation.thread,
          {
            ...withMessage('peer').thread[1],
            status: 'streaming',
          },
        ],
      };
      const { container, rerender } = render(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
        />
      );
      thread(container).scrollTop = 600;
      fireEvent.scroll(thread(container));
      rerender(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={streaming}
          currentParticipantId="alex"
          view="media"
        />
      );
      rerender(
        <SuperChat
          conversation={streaming}
          currentParticipantId="alex"
          view="thread"
        />
      );
      expect(thread(container).scrollTop).toBe(1000);
      // jsdom does not clamp scrollTop. Match the real, reachable bottom and
      // establish its geometric state before another reply arrives.
      thread(container).scrollTop = 600;
      fireEvent.scroll(thread(container));
      const next: SuperChatConversation = {
        ...streaming,
        thread: [
          ...streaming.thread,
          {
            id: 'another-peer',
            participantId: 'peer',
            time: '2026-10-03T11:00:00Z',
            text: 'Another incoming message',
          },
        ],
      };
      rerender(
        <SuperChat
          conversation={next}
          currentParticipantId="alex"
          view="thread"
        />
      );
      expect(thread(container).scrollTop).toBe(600);
    });
  });
});
