import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart, MessageCircle } from 'lucide-react';
import { MediaFeed, type MediaFeedProps, type MediaFeedMedia } from './index';
import { Button } from '../Button';
import { getSampleVideo } from '../AudioPlayer/sampleVideo';

interface Update {
  id: string;
  title: string;
  caption: string;
  author: string;
  media: MediaFeedMedia;
}

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="540" height="720" viewBox="0 0 540 720"><rect width="540" height="720" fill="#163b4a"/><circle cx="330" cy="270" r="170" fill="#56c2b3"/><path d="M0 620 210 320 540 720H0" fill="#edf8e3"/><circle cx="120" cy="120" r="45" fill="#fbd38d"/></svg>')}`;

const updates: Update[] = [
  {
    id: 'clip',
    title: 'A conversation in motion',
    caption:
      'A short video update shared with the team. Swipe or scroll to the next update.',
    author: 'Maya Chen',
    media: { kind: 'video', src: '', alt: 'A moving color band' },
  },
  {
    id: 'photo',
    title: 'The next idea',
    caption:
      'Images and clips share the same feed, with actions supplied by the host.',
    author: 'Luis Rivera',
    media: {
      kind: 'image',
      src: image,
      alt: 'An abstract landscape with a sun and teal circle',
    },
  },
  {
    id: 'follow-up',
    title: 'One more update',
    caption:
      'Only the active clip plays. Opening the viewer pauses the inline feed.',
    author: 'Maya Chen',
    media: { kind: 'video', src: '', alt: 'A moving color band' },
  },
];

function InteractiveFeed(props: MediaFeedProps<Update>) {
  const [video, setVideo] = React.useState('');
  const [failure, setFailure] = React.useState<string>();
  const [liked, setLiked] = React.useState<string[]>([]);
  const [discussion, setDiscussion] = React.useState<string>();
  React.useEffect(() => {
    let mounted = true;
    void getSampleVideo().then(
      (url) => {
        if (mounted) setVideo(url);
      },
      () => {
        if (mounted)
          setFailure('The browser could not generate the local sample video.');
      }
    );
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <div className="mx-auto flex h-[42rem] max-w-lg flex-col gap-2 p-4">
      <MediaFeed
        {...props}
        items={props.items.map((item) =>
          item.media.kind === 'video' && !item.media.src
            ? { ...item, media: { ...item.media, src: video } }
            : item
        )}
        loading={
          props.loading ||
          (!video &&
            !failure &&
            props.items.some(
              (item) => item.media.kind === 'video' && !item.media.src
            ))
        }
        error={props.error ?? failure}
        renderActions={(item) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Like ${item.title}`}
              aria-pressed={liked.includes(item.id)}
              leftIcon={<Heart className="size-4" />}
              onClick={() =>
                setLiked((all) =>
                  all.includes(item.id)
                    ? all.filter((id) => id !== item.id)
                    : [...all, item.id]
                )
              }
            >
              {liked.includes(item.id) ? 'Liked' : 'Like'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MessageCircle className="size-4" />}
              onClick={() => setDiscussion(item.title)}
            >
              Discuss
            </Button>
          </>
        )}
      />
      {discussion && (
        <p role="status" className="text-muted-foreground text-sm">
          The host opens the conversation for “{discussion}”.
        </p>
      )}
    </div>
  );
}

const meta: Meta<MediaFeedProps<Update>> = {
  id: 'media-mediafeed',
  title: 'Modules/Media/MediaFeed',
  component: MediaFeed<Update>,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    catalog: {
      entry: '@mieweb/ui/components/MediaFeed',
      collection: true,
      relationships: [
        {
          type: 'composes with',
          target: 'media-mediaplayer',
          why: 'Native audio and video use the shared MediaPlayer transport and error surface.',
        },
        {
          type: 'composes with',
          target: 'superchat-inbox',
          why: 'SuperChatInbox can display the active conversation’s explicit media attachments in this feed while retaining its header and composer.',
        },
        {
          type: 'alternative to',
          target: 'media-videocard',
          why: 'VideoCard is a link or preview for one video; MediaFeed coordinates a scrollable collection and an immersive viewer.',
        },
      ],
    },
    docs: {
      description: {
        component: `### What it's for

A vertical media feed for a collection owned by the host. \`MediaFeed<T>\` uses item accessors so a news post, an update, or a conversation attachment can share scrolling, active-item playback and an immersive viewer. Images and native audio/video work directly; provider media can use \`renderMedia\`. No RSS, authentication, router, persistence or comment service is included.

### Use it when

- People browse media updates one at a time by touch scrolling or the feed’s keyboard navigation.
- A conversation should offer an Instagram-like media view alongside its thread. \`SuperChatInbox\` maps explicit message attachments into the same feed.
- The host supplies captions, participants and actions, while the library coordinates the active player.

### Don't use it when

- There is one clip: use \`MediaPlayer\` for direct media or \`VideoCard\` for a linked video and hover preview.
- The user is editing a recording: use \`MediaEditor\`.
- Text discussion is the primary task: use the standard \`SuperChat\` thread; playing an attachment opens its media view, with a return control for the conversation.

### Example

\`\`\`tsx
import { MediaFeed } from '@mieweb/ui/components/MediaFeed';

<MediaFeed
  items={updates}
  getId={(item) => item.id}
  getMedia={(item) => item.media}
  getTitle={(item) => item.title}
  getCaption={(item) => item.caption}
  getAuthor={(item) => ({ name: item.author.name, avatar: item.author.avatar })}
  onActiveItemChange={(item) => setSelectedId(item.id)}
  renderActions={(item) => <Button onClick={() => openConversation(item)}>Discuss</Button>}
/>
\`\`\`

Import \`@mieweb/ui/styles.css\` once. Tailwind 4 consumers who generate their own CSS must include the library with \`@source\` as described in the Tailwind integration guide.

### Limitations

- The feed needs a bounded height. It holds all cards in the DOM; it does not virtualize a large collection.
- Native autoplay starts muted, depends on browser policy, and is suppressed for reduced motion. Playback controls remain available; provider embedding can still be blocked or unavailable.
- The immersive viewer uses \`Modal\` for focus trapping, Escape and scroll lock. Feed arrow navigation is scoped to its own surface and leaves inputs and media controls alone.
- All feed copy is overridable through \`labels\`; host-rendered captions and actions require the host’s localization. Layout uses theme tokens and logical direction.
- The stories generate a local synthetic video, so the primary demonstration does not depend on YouTube or a remote media server. Live provider behavior still needs a manual integration check.
- This port replaces the reusable presentation from \`mieweb/news-widget\`. Existing RSS/Discourse consumers must adapt their data and callbacks; this is not a drop-in replacement for \`<NewsWidget />\`.`,
      },
    },
  },
  args: {
    items: updates,
    getId: (item) => item.id,
    getMedia: (item) => item.media,
    getTitle: (item) => item.title,
    getCaption: (item) => item.caption,
    getAuthor: (item) => ({ name: item.author }),
  },
  argTypes: {
    items: {
      control: false,
      description: 'Host-owned items; the component never fetches them.',
      table: { category: 'Data' },
    },
    getId: {
      control: false,
      description: 'Stable item identity.',
      table: { category: 'Data' },
    },
    getMedia: {
      control: false,
      description: 'Media resource for each item.',
      table: { category: 'Data' },
    },
    getTitle: {
      control: false,
      description: 'Optional item title.',
      table: { category: 'Data' },
    },
    getCaption: {
      control: false,
      description: 'Host-rendered caption.',
      table: { category: 'Slots' },
    },
    getAuthor: {
      control: false,
      description: 'Display name and avatar supplied by the host.',
      table: { category: 'Data' },
    },
    renderActions: {
      control: false,
      description: 'Host-owned actions, such as opening a conversation.',
      table: { category: 'Slots' },
    },
    renderMedia: {
      control: false,
      description: 'Provider renderer; honor the active and playback context.',
      table: { category: 'Slots' },
    },
    onActiveItemChange: {
      control: false,
      description: 'Reports the item selected through scrolling or navigation.',
      table: { category: 'Callbacks' },
    },
    activeItemId: {
      control: 'text',
      description: 'Controlled item identity; scrolls to the selected item.',
      table: { category: 'Selection' },
    },
    defaultActiveItemId: {
      control: 'text',
      description: 'Initial selection for an uncontrolled feed.',
      table: { category: 'Selection' },
    },
    playbackRequest: {
      control: false,
      description:
        'Explicit user playback intent for an item: { itemId, requestId }. Select the item separately and supply a fresh requestId for each Play action. Manual requests work with autoplay off or reduced motion enabled.',
      table: { category: 'Behavior' },
    },
    onRetry: {
      control: false,
      description: 'Host retry callback for a data-loading error.',
      table: { category: 'Callbacks' },
    },
    loading: {
      control: 'boolean',
      description: 'Show the loading state.',
      table: { category: 'Data' },
    },
    error: {
      control: false,
      description: 'Host data error to display.',
      table: { category: 'Data' },
    },
    labels: {
      control: false,
      description: 'Overrides for every user-facing feed label.',
      table: { category: 'Slots' },
    },
    classNames: {
      control: false,
      description: 'Per-slot style overrides.',
      table: { category: 'Slots' },
    },
    autoPlay: {
      control: 'boolean',
      description: 'Request muted playback for the active item.',
    },
    muted: { control: 'boolean', description: 'Start the active media muted.' },
    loop: { control: 'boolean', description: 'Loop the active clip.' },
  },
  render: (args) => <InteractiveFeed {...args} />,
};

export default meta;
type Story = StoryObj<MediaFeedProps<Update>>;

export const Default: Story = {};
export const Empty: Story = { args: { items: [] } };
export const Loading: Story = { args: { items: [], loading: true } };
export const Error: Story = {
  args: {
    items: [],
    error: 'The host could not load these updates.',
    onRetry: () => undefined,
  },
};
export const Mobile: Story = {
  render: (args) => (
    <div className="mx-auto w-full max-w-sm">
      <InteractiveFeed {...args} />
    </div>
  ),
};
export const UnavailableMedia: Story = {
  args: {
    items: [
      {
        ...updates[0],
        media: { kind: 'video', src: 'data:video/webm;base64,AA==' },
      },
    ],
  },
};
export const TranslatedRTL: Story = {
  args: {
    dir: 'rtl',
    labels: {
      feed: 'الوسائط المشتركة في المحادثة',
      fullscreen: 'فتح الوسائط في عارض ملء الشاشة',
      close: 'إغلاق عارض الوسائط',
      previous: 'الانتقال إلى الوسائط السابقة',
      next: 'الانتقال إلى الوسائط التالية',
      play: 'تشغيل الوسائط',
      pause: 'إيقاف التشغيل مؤقتًا',
      loading: 'جارٍ تحميل الوسائط المشتركة',
      empty: 'لا توجد وسائط مشتركة في هذه المحادثة',
      retry: 'إعادة محاولة تحميل الوسائط',
      mediaError: 'تعذر تشغيل الوسائط المطلوبة',
      blockedAutoplay: 'اضغط على تشغيل لبدء عرض الوسائط',
      openSource: 'فتح المصدر الأصلي للوسائط',
      item: (position, total) => `الوسائط ${position} من ${total}`,
      position: (position, total) => `${position} من ${total}`,
    },
  },
};
