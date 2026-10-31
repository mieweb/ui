import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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

  it("sizes attachment cards, built-in and the host's, from mediaMaxSize", () => {
    const host = vi.fn(() => null);
    const { container } = render(
      <SuperChat
        conversation={videoConversation}
        mediaMaxSize={256}
        renderMessageMedia={host}
      />
    );
    expect(host).toHaveBeenCalledWith(
      expect.objectContaining({ maxSize: '256px' })
    );
    // The host returned nothing for it, so the built-in card stands in.
    const card = container.querySelector<HTMLElement>(
      '[data-slot="superchat-message-media"]'
    );
    expect(card?.style.width).toBe('256px');
    expect(card).toHaveClass('max-w-full');
  });

  it("gives attachments their own tiles after the text, on the author's side", () => {
    const { container, rerender } = render(
      <SuperChat conversation={conversation} currentParticipantId="alex" />
    );
    const bubble = container.querySelector('[data-slot="superchat-bubble"]');
    const tiles = container.querySelectorAll(
      '[data-slot="superchat-message-attachment"]'
    );
    expect(tiles).toHaveLength(2);
    // Not inside the text bubble, and after it.
    expect(
      bubble?.querySelector('[data-slot="superchat-message-media"]')
    ).toBeNull();
    expect(
      bubble!.compareDocumentPosition(tiles[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      container.querySelector('[data-slot="superchat-message-attachments"]')
    ).toHaveClass('items-end');
    expect(tiles[0]).toHaveClass('rounded-2xl', 'overflow-hidden');

    // Only attachments: no empty bubble.
    rerender(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [{ ...conversation.thread[0], text: undefined }],
        }}
        currentParticipantId="alex"
      />
    );
    expect(
      container.querySelector('[data-slot="superchat-bubble"]')
    ).toBeNull();
    expect(
      container.querySelectorAll('[data-slot="superchat-message-attachment"]')
    ).toHaveLength(2);
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

  it("renders the host's card for an attachment, whose open plays it in the media view and gets focus back", async () => {
    const play = mockNativePlayback();
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
        renderMessageMedia={({ attachment, open, launchId }) =>
          attachment.id === 'video-2' ? (
            <button
              type="button"
              data-media-launch-id={launchId}
              onClick={() => open(true)}
            >
              {`Host card ${attachment.title}`}
            </button>
          ) : null
        }
      />
    );
    // The host's card replaces the built-in one; `null` keeps the built-in card.
    expect(
      screen.getByRole('button', { name: 'Play First clip' })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Play Second clip' })
    ).toBeNull();
    expect(container.querySelectorAll('video')).toHaveLength(1);
    await user.click(
      screen.getByRole('button', { name: 'Host card Second clip' })
    );
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(
      (play.mock.contexts[0] as HTMLMediaElement).getAttribute('src')
    ).toBe('/clip-two.webm');
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    expect(
      screen.getByRole('button', { name: 'Host card Second clip' })
    ).toHaveFocus();
  });

  it('renders the host card in a virtualized thread, and Back returns focus to it', async () => {
    mockNativePlayback();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new window.DOMRect(0, 0, 600, 400)
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
        virtualized
        renderMessageMedia={({ attachment, open, launchId }) => (
          <button
            type="button"
            data-media-launch-id={launchId}
            onClick={() => open(true)}
          >
            {`Host card ${attachment.title}`}
          </button>
        )}
      />
    );
    const card = await screen.findByRole('button', {
      name: 'Host card Second clip',
    });
    await user.click(card);
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Host card Second clip' })
      ).toHaveFocus()
    );
  });

  it('returns focus to a host card far down a long virtualized thread of tall rows', async () => {
    mockNativePlayback();
    // Rows measure 300px, well over the virtualizer's first guess.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new window.DOMRect(0, 0, 600, 300)
    );
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400);
    // Tall enough that the reader isn't at the bottom.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
      80 * 300
    );
    const thread = Array.from({ length: 80 }, (_, index) => ({
      id: `m${index}`,
      participantId: 'alex',
      time: new Date(Date.UTC(2026, 9, 1, 9, index)).toISOString(),
      text: `Message ${index}`,
      ...(index === 60
        ? {
            media: [
              {
                id: 'clip',
                kind: 'video' as const,
                src: '/clip.webm',
                title: 'Far clip',
              },
            ],
          }
        : {}),
    }));
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={{ ...conversation, thread }}
        mediaFeedProps={{ autoPlay: false }}
        virtualized
        renderMessageMedia={({ attachment, open, launchId }) => (
          <button
            type="button"
            data-media-launch-id={launchId}
            onClick={() => open()}
          >
            {`Host card ${attachment.title}`}
          </button>
        )}
      />
    );
    const log = container.querySelector<HTMLElement>(
      '[data-slot="superchat-thread"]'
    )!;
    const card = () =>
      screen.queryByRole('button', { name: 'Host card Far clip' });
    // Scroll down until the card's row is rendered (and every row above it
    // has been measured on the way).
    for (let top = 0; !card() && top < 40000; top += 300) {
      log.scrollTop = top;
      fireEvent.scroll(log);
      await act(async () => {});
    }
    await user.click(card()!);
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    await waitFor(() => expect(card()).toHaveFocus());
  });

  it('keeps the feed mounted when the host switches layout', async () => {
    mockNativePlayback();
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    const feed = container.querySelector('[data-component="media-feed"]');
    rerender(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false, layout: 'overlay' }}
      />
    );
    // Same feed, so its selection and saved positions carry over.
    expect(container.querySelector('[data-component="media-feed"]')).toBe(feed);
    expect(
      screen.getByRole('article', { name: 'Second clip' })
    ).toHaveAttribute('data-active', 'true');
  });

  it('offers no immersive viewer in the overlay media view unless the host asks, and shows actions beside the title', async () => {
    mockNativePlayback();
    const user = userEvent.setup();
    const { unmount } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{
          layout: 'overlay',
          autoPlay: false,
          renderActions: (item) => (
            <button type="button">{`Menu ${item.attachment.title}`}</button>
          ),
        }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    expect(
      screen.queryByRole('button', { name: 'Open fullscreen' })
    ).toBeNull();
    const item = screen.getByRole('article', { name: 'Second clip' });
    const title = within(item).getByRole('heading', { name: 'Second clip' });
    const actions = within(item).getByRole('button', {
      name: 'Menu Second clip',
    });
    // The same row as the title, not a row of its own under the caption.
    expect(title.parentElement?.parentElement).toBe(
      actions.closest('[data-slot="actions"]')?.parentElement?.parentElement
    );
    unmount();

    render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{
          layout: 'overlay',
          autoPlay: false,
          allowFullscreen: true,
        }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    expect(
      screen.getAllByRole('button', { name: 'Open fullscreen' }).length
    ).toBeGreaterThan(0);
  });

  it('keeps the stacked media view by default: a labelled Back above the feed', async () => {
    mockNativePlayback();
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    const view = document.querySelector('[data-slot="superchat-media-view"]');
    expect(view).not.toHaveAttribute('data-theme');
    expect(view).not.toHaveAttribute('role');
    expect(
      screen.getByRole('button', { name: 'Back to conversation' })
    ).toHaveTextContent('Back to conversation');
    expect(
      screen.getAllByRole('button', { name: 'Open fullscreen' }).length
    ).toBeGreaterThan(0);
  });

  it('covers a phone screen as a dialog with the overlay layout; Escape goes back', async () => {
    mockNativePlayback();
    const matchMedia = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query) => ({
        matches: query.includes('width < 40rem'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }));
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{
          layout: 'overlay',
          autoPlay: false,
          allowFullscreen: true,
        }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    // The whole panel: the dark media view, and the message box below it.
    expect(dialog).toHaveAttribute('data-slot', 'superchat');
    expect(
      dialog.querySelector('[data-slot="superchat-media-view"]')
    ).toHaveAttribute('data-theme', 'dark');
    expect(within(dialog).getByRole('textbox')).toBeEnabled();
    expect(
      within(dialog).getByRole('article', { name: 'Second clip' })
    ).toHaveFocus();
    // Escape with the feed's own viewer open closes that, not the media view.
    await user.click(
      within(dialog).getAllByRole('button', { name: 'Open fullscreen' })[0]
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    await user.keyboard('{Escape}');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog')).toBe(dialog);
    // An Escape something on top already handled leaves the view open.
    const handled = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    dialog.dispatchEvent(handled);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Play Second clip' })
    ).toHaveFocus();
    matchMedia.mockRestore();
  });

  it('takes focus into the phone dialog when it opens on media', () => {
    mockNativePlayback();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('width < 40rem'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    render(
      <SuperChat
        conversation={videoConversation}
        defaultView="media"
        mediaFeedProps={{ layout: 'overlay', autoPlay: false }}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(
      within(dialog).getByRole('article', { name: 'First clip' })
    ).toHaveFocus();
  });

  it('takes focus in once a host reveals the phone dialog it had hidden', () => {
    mockNativePlayback();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('width < 40rem'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    // A hidden panel can't take focus, as in a browser.
    const focus = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement,
      options?: Parameters<HTMLElement['focus']>[0]
    ) {
      if (!this.closest('.hidden-panel')) focus.call(this, options);
    });
    const props = {
      conversation: videoConversation,
      defaultView: 'media' as const,
      mediaFeedProps: { layout: 'overlay' as const, autoPlay: false },
    };
    const { rerender } = render(
      <SuperChat {...props} className="hidden-panel" />
    );
    expect(document.body).toHaveFocus();
    rerender(<SuperChat {...props} className="shown-panel" />);
    expect(
      within(screen.getByRole('dialog')).getByRole('article', {
        name: 'First clip',
      })
    ).toHaveFocus();
  });

  it('goes back on Escape whatever widgets the rest of the page has', async () => {
    mockNativePlayback();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('width < 40rem'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
    const user = userEvent.setup();
    render(
      <>
        <div role="listbox" aria-label="Transcript words" />
        <SuperChat
          conversation={videoConversation}
          mediaFeedProps={{ layout: 'overlay', autoPlay: false }}
        />
      </>
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps a clip floating in picture in picture playing after Back, until its window closes', async () => {
    mockNativePlayback();
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause');
    const user = userEvent.setup();
    const { container } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    const view = () =>
      container.querySelector('[data-slot="superchat-media-view"]');
    const floated = view()!.querySelector<HTMLVideoElement>(
      'video[src="/clip-two.webm"]'
    )!;
    Object.defineProperty(document, 'pictureInPictureElement', {
      configurable: true,
      value: floated,
    });
    act(() => {
      floated.dispatchEvent(new Event('enterpictureinpicture'));
    });
    pause.mockClear();
    await user.click(
      screen.getByRole('button', { name: 'Back to conversation' })
    );
    // The thread is back, the media view kept (hidden), the clip not paused.
    expect(
      screen.getByRole('button', { name: 'Play Second clip' })
    ).toBeTruthy();
    expect(view()).toHaveClass('hidden');
    expect(floated.isConnected).toBe(true);
    expect(pause.mock.contexts).not.toContain(floated);

    Object.defineProperty(document, 'pictureInPictureElement', {
      configurable: true,
      value: null,
    });
    act(() => {
      floated.dispatchEvent(new Event('leavepictureinpicture'));
    });
    expect(view()).toBeNull();
    pause.mockRestore();
  });

  it('lets the media view go once its floating clip has left with its conversation', async () => {
    mockNativePlayback();
    const user = userEvent.setup();
    const { container, rerender } = render(
      <SuperChat
        conversation={videoConversation}
        mediaFeedProps={{ autoPlay: false }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Play Second clip' }));
    const view = () =>
      container.querySelector('[data-slot="superchat-media-view"]');
    const floated = view()!.querySelector<HTMLVideoElement>(
      'video[src="/clip-two.webm"]'
    )!;
    Object.defineProperty(document, 'pictureInPictureElement', {
      configurable: true,
      value: floated,
    });
    try {
      act(() => {
        floated.dispatchEvent(new Event('enterpictureinpicture'));
      });
      await user.click(
        screen.getByRole('button', { name: 'Back to conversation' })
      );
      expect(view()).toHaveClass('hidden');
      // Another conversation: its feed replaces the one the clip floated from,
      // and the browser closed that window with it.
      rerender(
        <SuperChat
          conversation={{ ...videoConversation, id: 'c2' }}
          mediaFeedProps={{ autoPlay: false }}
        />
      );
      await waitFor(() => expect(view()).toBeNull());
    } finally {
      Object.defineProperty(document, 'pictureInPictureElement', {
        configurable: true,
        value: null,
      });
    }
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
