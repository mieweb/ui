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
import {
  getConversationMediaItems,
  messagePreview,
  previewOfAttachments,
} from './media';
import { KNOWN_SHAPES_LIMIT, knownShapes, rememberShape } from './MessageMedia';
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

/** The same two clips, one per message: each a lone tile, so a host card draws it. */
const oneClipPerMessage: SuperChatConversation = {
  ...videoConversation,
  thread: videoConversation.thread[0].media!.map((clip, index) => ({
    ...videoConversation.thread[0],
    id: `m${index + 1}`,
    time: new Date(Date.UTC(2026, 9, 3, 9, index)).toISOString(),
    media: [clip],
  })),
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

describe('messagePreview', () => {
  const preview = (text: string) =>
    messagePreview(
      { id: 'm', participantId: 'alex', time: '2026-10-03T09:00:00Z', text },
      previewOfAttachments
    );

  it('leaves the underscores in a file name or a link alone', () => {
    expect(preview('see file_name_v2.pdf')).toBe('see file_name_v2.pdf');
    expect(preview('https://x.dev/a_b_c')).toBe('https://x.dev/a_b_c');
    expect(preview('rename my_file_v2 to v3')).toBe('rename my_file_v2 to v3');
  });

  it('still strips real emphasis and code', () => {
    expect(
      preview('**bold**, _italic_, *also*, __strong__, `code` and ~~gone~~')
    ).toBe('bold, italic, also, strong, code and gone');
  });
});

describe('knownShapes', () => {
  afterEach(() => knownShapes.clear());

  it('keeps the most recently seen shapes, up to its limit', () => {
    for (let i = 0; i <= KNOWN_SHAPES_LIMIT; i++) {
      rememberShape(`/still-${i}.png`, 1);
    }
    expect(knownShapes.size).toBe(KNOWN_SHAPES_LIMIT);
    expect(knownShapes.has('/still-0.png')).toBe(false);
    // Seen again, the oldest left is the newest, and outlives the next one.
    rememberShape('/still-1.png', 2);
    rememberShape('/still-new.png', 1);
    expect(knownShapes.get('/still-1.png')).toBe(2);
    expect(knownShapes.has('/still-2.png')).toBe(false);
  });

  it('keeps no data: URL, which can be megabytes', () => {
    rememberShape('data:image/png;base64,AAAA', 1.5);
    expect(knownShapes.size).toBe(0);
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
      screen.getAllByRole('button', { name: /^Open in media feed/ })[1]
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
      screen.getAllByRole('button', { name: /^Open in media feed/ })[1]
    ).toHaveFocus();
  });

  it("sizes attachment cards, built-in and the host's, from mediaMaxSize", () => {
    const host = vi.fn(() => null);
    const { container } = render(
      <SuperChat
        conversation={oneClipPerMessage}
        mediaMaxSize={256}
        renderMessageMedia={host}
      />
    );
    expect(host).toHaveBeenCalledWith(
      expect.objectContaining({ maxSize: '256px' })
    );
    // The host returned nothing for it, so the built-in card stands in.
    // A clip with no poster yet: 16:9 until its first frame says otherwise.
    const card = container.querySelector<HTMLElement>(
      '[data-slot="superchat-message-media"]'
    );
    expect(card?.getAttribute('style')).toContain('256px');
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
    // Two pictures share one gallery tile, after the text and outside it.
    expect(tiles).toHaveLength(1);
    expect(
      tiles[0].querySelector('[data-slot="superchat-message-gallery"]')
    ).toBeTruthy();
    expect(
      bubble?.querySelector('[data-slot="superchat-message-gallery"]')
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
    ).toHaveLength(1);
  });

  it('lays out a gallery by count, and its last cell says how many more', async () => {
    const user = userEvent.setup();
    const image = (n: number) => ({
      id: `p${n}`,
      kind: 'image' as const,
      src: `/p${n}.png`,
      title: `Photo ${n}`,
    });
    const withPictures = (count: number): SuperChatConversation => ({
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          media: Array.from({ length: count }, (_, i) => image(i + 1)),
        },
      ],
    });
    const gallery = () =>
      document.querySelector<HTMLElement>(
        '[data-slot="superchat-message-gallery"]'
      )!;
    const { rerender } = render(<SuperChat conversation={withPictures(2)} />);
    expect(gallery()).toHaveClass('aspect-[4/3]');
    expect(within(gallery()).getAllByRole('button')).toHaveLength(2);

    rerender(<SuperChat conversation={withPictures(3)} />);
    expect(within(gallery()).getAllByRole('button')[0]).toHaveClass(
      'row-span-2'
    );

    rerender(<SuperChat conversation={withPictures(6)} />);
    const cells = within(gallery()).getAllByRole('button');
    expect(cells).toHaveLength(4);
    expect(cells[3]).toHaveAccessibleName(
      'Open in media feed, Photo 4, 2 more'
    );
    expect(cells[3]).toHaveTextContent('+2');
    // "+2" in an RTL page too, not "2+".
    expect(screen.getByText('+2')).toHaveAttribute('dir', 'ltr');

    // A cell opens the media view at its own picture.
    await user.click(cells[1]);
    expect(
      screen.getByRole('button', { name: 'Back to conversation' })
    ).toBeTruthy();
  });

  it("lists a message's documents in one tile, each opening in a new tab", () => {
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: undefined,
              files: [
                {
                  id: 'f1',
                  name: 'Q3 report.pdf',
                  url: '/q3.pdf',
                  size: 2_200_000,
                },
                { id: 'f2', name: 'budget.xlsx', url: '/budget.xlsx' },
              ],
            },
          ],
        }}
      />
    );
    const files = document.querySelector(
      '[data-slot="superchat-message-files"]'
    )!;
    expect(
      files.closest('[data-slot="superchat-message-attachment"]')
    ).toBeTruthy();
    const links = within(files as HTMLElement).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/q3.pdf');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveTextContent('Q3 report.pdf');
    expect(links[0]).toHaveTextContent('PDF · 2.1 MB');
    expect(links[1]).toHaveTextContent('XLSX');
    // Documents aren't media: no media view for them.
    expect(screen.queryByRole('button', { name: 'Media' })).toBeNull();
  });

  it("keeps a host's card out of the gallery, with its own controls", () => {
    const withClipAndPhotos: SuperChatConversation = {
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          media: [
            videoConversation.thread[0].media![0],
            ...conversation.thread[0].media!,
          ],
        },
      ],
    };
    render(
      <SuperChat
        conversation={withClipAndPhotos}
        renderMessageMedia={({ attachment }) =>
          attachment.kind === 'video' ? (
            <span>Host card {attachment.title}</span>
          ) : null
        }
      />
    );
    expect(screen.getByText('Host card First clip')).toBeTruthy();
    const gallery = document.querySelector<HTMLElement>(
      '[data-slot="superchat-message-gallery"]'
    )!;
    // The two photos the host doesn't draw still share a gallery.
    expect(within(gallery).getAllByRole('button')).toHaveLength(2);
    expect(within(gallery).queryByText(/Host card/)).toBeNull();
  });

  it('plays audio where it is, with no trip to the media view', () => {
    const { container } = render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [
                {
                  id: 'note',
                  kind: 'audio',
                  src: '/note.m4a',
                  title: 'Voice note',
                },
              ],
            },
          ],
        }}
      />
    );
    expect(container.querySelector('audio')?.hasAttribute('controls')).toBe(
      true
    );
    expect(
      screen.queryByRole('button', { name: /Play Voice note/ })
    ).toBeNull();
  });

  it("says a picture couldn't load, and crops a long screenshot", () => {
    const { container } = render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [conversation.thread[0].media![0]],
            },
          ],
        }}
      />
    );
    const tile = container.querySelector<HTMLElement>(
      '[data-slot="superchat-message-media"]'
    )!;
    const img = tile.querySelector('img')!;
    Object.defineProperty(img, 'naturalWidth', { value: 400 });
    Object.defineProperty(img, 'naturalHeight', { value: 4000 });
    fireEvent.load(img);
    // 1:10 would be a sliver; the tile stops at 0.6.
    expect(tile.style.aspectRatio).toBe('0.6');
    fireEvent.error(tile.querySelector('img')!);
    expect(tile).toHaveTextContent("Couldn't load");
  });

  it("dims a sending message's attachments and says how far it has got", () => {
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            { ...conversation.thread[0], status: 'pending', progress: 0.452 },
          ],
        }}
      />
    );
    // Said once: the percent beside it changes on every tick, so it is shown
    // but kept out of the status.
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^Sending…$/);
    const line = document.querySelector(
      '[data-slot="superchat-message-sending"]'
    )!;
    expect(line).not.toHaveAttribute('role');
    expect(line).toHaveTextContent('Sending…45%');
    expect(status.contains(screen.getByText('45%'))).toBe(false);
    // Its pictures dim; text on a tile (a file's name and size) stays
    // readable.
    const tile = document.querySelector(
      '[data-slot="superchat-message-attachment"]'
    );
    expect(tile).toHaveClass('[&_img]:opacity-60', '[&_video]:opacity-60');
    expect(tile).not.toHaveClass('opacity-60');
  });

  it('previews a last message with no text by what it carries, and markdown as plain text', () => {
    render(
      <SuperChatInbox
        conversations={[
          {
            ...conversation,
            thread: [{ ...conversation.thread[0], text: undefined }],
          },
          {
            ...conversation,
            id: 'c2',
            title: 'Second',
            thread: [
              {
                ...conversation.thread[0],
                id: 'm2',
                media: undefined,
                text: 'Shipped **the fix** · *Plan · [TH-7: Login](/app/tickets/7)*',
              },
            ],
          },
        ]}
      />
    );
    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('2 photos');
    expect(list).toHaveTextContent('Shipped the fix · Plan · TH-7: Login');
  });

  it('goes back from the media view on Escape in every layout', async () => {
    mockNativePlayback();
    const user = userEvent.setup();
    render(<SuperChat conversation={conversation} />);
    await user.click(
      screen.getAllByRole('button', { name: /^Open in media feed/ })[0]
    );
    expect(
      screen.getByRole('button', { name: 'Back to conversation' })
    ).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('log', { name: 'Messages' })).toBeInTheDocument();
  });

  it('starts a tile at the size the host gives, before its picture loads', () => {
    const { container } = render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [
                {
                  ...conversation.thread[0].media![0],
                  width: 300,
                  height: 400,
                },
              ],
            },
          ],
        }}
      />
    );
    expect(
      container.querySelector<HTMLElement>(
        '[data-slot="superchat-message-media"]'
      )?.style.aspectRatio
    ).toBe('0.75');
  });

  it("shows a message's label under it, out of its text, its editor and its preview", async () => {
    const user = userEvent.setup();
    const labelled: SuperChatConversation = {
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          media: undefined,
          label: 'Plan · *Personal*',
        },
      ],
    };
    render(
      <SuperChatInbox
        conversations={[labelled]}
        currentParticipantId="alex"
        onMessageEdited={() => {}}
      />
    );
    const label = document.querySelector(
      '[data-slot="superchat-message-label"]'
    );
    expect(label).toHaveTextContent('Plan · Personal');
    expect(
      document.querySelector('[data-slot="superchat-bubble"]')
    ).not.toHaveTextContent('Personal');
    expect(screen.getByRole('list')).not.toHaveTextContent('Personal');
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    expect(screen.getByRole('textbox', { name: 'Edit message' })).toHaveValue(
      'First caption'
    );
  });

  it('lets the author take an attachment off while editing', async () => {
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="alex"
        onMessageEdited={onMessageEdited}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    const list = screen.getByRole('list', { name: 'Attachments' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // Save waits for a change; taking one off is one.
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.click(
      within(list).getByRole('button', { name: 'Remove Second image' })
    );
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onMessageEdited).toHaveBeenCalledWith(
      'm1',
      'First caption',
      expect.objectContaining({ removedMedia: ['a2'], removedFiles: [] })
    );
  });

  it('opens no media while a message is being edited, so its draft stays', async () => {
    const user = userEvent.setup();
    const opens: Record<string, unknown> = {};
    const withClip: SuperChatConversation = {
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          media: [
            ...conversation.thread[0].media!,
            { id: 'v1', kind: 'video', src: '/clip.webm', title: 'Clip' },
          ],
        },
      ],
    };
    render(
      <SuperChat
        conversation={withClip}
        currentParticipantId="alex"
        onMessageEdited={() => {}}
        renderMessageMedia={({ attachment, open }) => {
          opens[attachment.id] = open;
          return attachment.kind === 'video' ? (
            <button type="button" onClick={() => open?.(true)}>
              Host card
            </button>
          ) : null;
        }}
      />
    );
    expect(opens.v1).toBeTypeOf('function');
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    const editor = screen.getByRole('textbox', { name: 'Edit message' });
    await user.type(editor, ' and more');
    // The host's card gets no open, and the gallery's cells don't open.
    expect(opens.v1).toBeUndefined();
    const cell = within(
      screen.getByRole('group', { name: 'Gallery, 2 items' })
    ).getAllByRole('button')[0];
    expect(cell).toBeDisabled();
    await user.click(cell);
    await user.click(screen.getByRole('button', { name: 'Host card' }));
    expect(
      screen.queryByRole('button', { name: 'Back to conversation' })
    ).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Edit message' })).toHaveValue(
      'First caption and more'
    );
  });

  it('keeps a lone tile in place, not opening, while its message is edited', async () => {
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [conversation.thread[0].media![0]],
            },
          ],
        }}
        currentParticipantId="alex"
        onMessageEdited={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    const tile = screen.getByRole('button', {
      name: 'Open in media feed, First image',
    });
    expect(tile).toBeDisabled();
    await user.click(tile);
    expect(screen.getByRole('textbox', { name: 'Edit message' })).toBeVisible();
  });

  it.each([
    ['an empty text', ''],
    ['no text at all', undefined],
  ])(
    'offers Edit on a message that is only attachments, with %s',
    async (_, text) => {
      const user = userEvent.setup();
      const { container } = render(
        <SuperChat
          conversation={{
            ...conversation,
            thread: [{ ...conversation.thread[0], text }],
          }}
          currentParticipantId="alex"
          onMessageEdited={() => {}}
        />
      );
      expect(
        container.querySelector('[data-slot="superchat-bubble"]')
      ).toBeNull();
      // Beside the attachments, as it would be beside a bubble. Nothing to
      // copy, so Edit is its only action.
      const slot = container.querySelector<HTMLElement>(
        '[data-slot="superchat-message-attachments"] > [data-slot="superchat-message-actions-slot"]'
      )!;
      expect(slot).toBeTruthy();
      expect(
        within(slot).queryByRole('button', { name: 'Copy message' })
      ).toBeNull();
      await user.click(
        within(slot).getByRole('button', { name: 'Edit message' })
      );
      expect(screen.getByRole('textbox', { name: 'Edit message' })).toHaveValue(
        ''
      );
    }
  );

  it('saves an edit that clears the text while attachments stay', async () => {
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <SuperChat
        conversation={conversation}
        currentParticipantId="alex"
        onMessageEdited={onMessageEdited}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    await user.clear(screen.getByRole('textbox', { name: 'Edit message' }));
    // Clearing the text is a change: the pictures are still a message.
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await user.click(
      screen.getByRole('button', { name: 'Remove Second image' })
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onMessageEdited).toHaveBeenCalledWith(
      'm1',
      '',
      expect.objectContaining({ removedMedia: ['a2'], removedFiles: [] })
    );
  });

  it('will not save an edit that takes off everything a message had', async () => {
    const user = userEvent.setup();
    const onMessageEdited = vi.fn();
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              text: '',
              media: [conversation.thread[0].media![0]],
            },
          ],
        }}
        currentParticipantId="alex"
        onMessageEdited={onMessageEdited}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Edit message' }));
    await user.click(
      screen.getByRole('button', { name: 'Remove First image' })
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    // Writing something makes it a message again.
    const editor = screen.getByRole('textbox', { name: 'Edit message' });
    await user.type(editor, 'Gone');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    // Enter with nothing left closes the editor as Cancel would.
    await user.clear(editor);
    await user.type(editor, '{Enter}');
    expect(onMessageEdited).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Open in media feed, First image' })
    ).toBeEnabled();
  });

  it('takes the words on tiles, galleries and the editor from mediaLabels', async () => {
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [
                ...conversation.thread[0].media!,
                { id: 'a3', kind: 'image', src: '/third.png' },
                { id: 'a4', kind: 'image', src: '/fourth.png', title: 'Four' },
                { id: 'a5', kind: 'image', src: '/fifth.png' },
              ],
            },
            {
              ...conversation.thread[0],
              id: 'm2',
              time: '2026-10-03T09:01:00Z',
              media: [
                { id: 'v1', kind: 'video', src: '/clip.webm', title: 'Clip' },
              ],
            },
          ],
        }}
        currentParticipantId="alex"
        onMessageEdited={() => {}}
        mediaLabels={{
          openMediaNamed: (name) => `«${name}» öffnen`,
          playMediaNamed: (title) => `«${title}» abspielen`,
          moreMedia: (count, name) => `${name} (+${count})`,
          gallery: (count) => `Galerie mit ${count}`,
          editAttachments: 'Anhänge',
          removeAttachment: (name) => `«${name}» entfernen`,
          attachmentName: (kind) => (kind === 'image' ? 'Foto' : kind),
        }}
      />
    );
    const gallery = screen.getByRole('group', { name: 'Galerie mit 5' });
    const cells = within(gallery).getAllByRole('button');
    expect(cells[0]).toHaveAccessibleName('«First image» öffnen');
    expect(cells[3]).toHaveAccessibleName('«Four» öffnen (+1)');
    expect(
      screen.getByRole('button', { name: '«Clip» abspielen' })
    ).toBeTruthy();
    await user.click(
      screen.getAllByRole('button', { name: 'Message actions' })[0]
    );
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    const list = screen.getByRole('list', { name: 'Anhänge' });
    expect(
      within(list).getAllByRole('button', { name: '«Foto» entfernen' })
    ).toHaveLength(2);
  });

  it('names an untitled attachment in the editor by its kind', async () => {
    const user = userEvent.setup();
    render(
      <SuperChat
        conversation={{
          ...conversation,
          thread: [
            {
              ...conversation.thread[0],
              media: [{ id: 'v1', kind: 'video', src: '/clip.webm' }],
            },
          ],
        }}
        currentParticipantId="alex"
        onMessageEdited={() => {}}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Message actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit message' }));
    expect(screen.getByRole('button', { name: 'Remove Video' })).toBeTruthy();
  });

  it('tries a still again once the host gives it a new source', () => {
    const single = (src: string): SuperChatConversation => ({
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          media: [{ ...conversation.thread[0].media![0], src }],
        },
      ],
    });
    const { container, rerender } = render(
      <SuperChat conversation={single('/broken.png')} />
    );
    const tile = () =>
      container.querySelector<HTMLElement>(
        '[data-slot="superchat-message-media"]'
      )!;
    fireEvent.error(tile().querySelector('img')!);
    expect(tile()).toHaveTextContent("Couldn't load");
    rerender(<SuperChat conversation={single('/fixed.png')} />);
    expect(tile()).not.toHaveTextContent("Couldn't load");
    expect(tile().querySelector('img')).toHaveAttribute('src', '/fixed.png');
  });

  it('makes the links in a media item’s caption tappable', () => {
    const linked: SuperChatConversation = {
      ...conversation,
      thread: [
        {
          ...conversation.thread[0],
          text: 'Notes at https://example.dev/notes and [the board](https://example.dev/board)',
          media: [conversation.thread[0].media![0]],
        },
      ],
    };
    render(<SuperChat conversation={linked} view="media" />);
    const view = document.querySelector<HTMLElement>(
      '[data-slot="superchat-media-view"]'
    )!;
    expect(
      within(view).getByRole('link', { name: 'https://example.dev/notes' })
    ).toHaveAttribute('href', 'https://example.dev/notes');
    expect(
      within(view).getByRole('link', { name: 'the board' })
    ).toHaveAttribute('href', 'https://example.dev/board');
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
      screen.getAllByRole('button', { name: /^Open in media feed/ })[0]
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
      screen.getAllByRole('button', { name: /^Open in media feed/ })[0]
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
      screen.queryByRole('button', { name: /^Open in media feed/ })
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
        conversation={oneClipPerMessage}
        mediaFeedProps={{ autoPlay: false }}
        renderMessageMedia={({ attachment, open, launchId }) =>
          attachment.id === 'video-2' ? (
            <button
              type="button"
              data-media-launch-id={launchId}
              onClick={() => open?.(true)}
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
        conversation={oneClipPerMessage}
        mediaFeedProps={{ autoPlay: false }}
        virtualized
        renderMessageMedia={({ attachment, open, launchId }) => (
          <button
            type="button"
            data-media-launch-id={launchId}
            onClick={() => open?.(true)}
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
            onClick={() => open?.()}
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
    // Beside the title in the item's details, not a row of its own under
    // the caption.
    const details = title.closest('[data-slot="details"]');
    expect(details).not.toBeNull();
    expect(actions.closest('[data-slot="details"]')).toBe(details);
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
      screen.getAllByRole('button', { name: /^Open in media feed/ })[1]
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

    it('returns a reader who was at the bottom to the bottom, not a stale offset', () => {
      mockThreadLayout();
      const { container, rerender } = render(
        <SuperChat
          conversation={conversation}
          currentParticipantId="alex"
          view="thread"
        />
      );
      thread(container).scrollTop = 600; // at the bottom
      fireEvent.scroll(thread(container));
      for (const view of ['media', 'thread'] as const) {
        rerender(
          <SuperChat
            conversation={conversation}
            currentParticipantId="alex"
            view={view}
          />
        );
      }
      // A remounted virtualized thread may not be as tall yet as when it was
      // left, so it scrolls to its end rather than to the old pixel offset.
      expect(thread(container).scrollTop).toBe(thread(container).scrollHeight);
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
