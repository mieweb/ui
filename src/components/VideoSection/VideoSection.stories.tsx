import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoSection } from './VideoSection';
import { productTour, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof VideoSection> = {
  id: 'content-videosection',
  title: 'Templates/Content/VideoSection',
  component: VideoSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive VideoSection, reduced to a server-rendered embed.'
    ),
    docs: {
      description: {
        component: `### What it's for

A heading over one video — a privacy-enhanced YouTube embed (\`youtube-nocookie.com\`) or a self-hosted file in the native player — with an optional caption.

### Use it when

- A page has one walkthrough or explainer worth watching in place.

### Don't use it when

- You list several videos to pick from, with hover previews — use [VideoCard](?path=/docs/media-videocard--docs).
- The video is decoration behind a hero — that is site styling, not content.

### Example

\`\`\`tsx
<VideoSection
  title="See an order from start to clearance"
  video={{ title: 'Product tour (2 min)', youtubeId: 'VIDEO_ID' }}
  caption="Two-minute walkthrough."
/>
\`\`\`

### Limitations

- The YouTube iframe is lazy-loaded and titled from \`video.title\`; YouTube's player sets its own keyboard and caption behaviour.
- Self-hosted files load nothing until played (\`preload="none"\`) and **require** a WebVTT \`captions\` track (WCAG 1.2.2); \`poster\` sets the still. YouTube embeds use YouTube's own captions.
- Emit \`VideoObject\` JSON-LD from the page if you want video rich results.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'media-videocard',
          why: 'VideoSection embeds one video in place on a server-rendered page; VideoCard is an interactive card for choosing among several.',
        },
      ],
    },
  },
  argTypes: {
    video: {
      description:
        '`{ title, youtubeId }` or `{ title, src, captions, poster? }`.',
    },
    caption: { description: 'Caption under the player.' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    title: 'See an order from start to clearance',
    video: productTour,
    caption: 'Two-minute walkthrough.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SelfHosted: Story = {};

export const Muted: Story = { args: { tone: 'muted', align: 'start' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
