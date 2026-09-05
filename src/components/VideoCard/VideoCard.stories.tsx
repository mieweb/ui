import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { VideoCard, PlayButton } from './VideoCard';
import { Badge } from '../Badge';
import { skillUrl, type ComponentMeta } from '../../docs/component-meta';

const componentMeta: ComponentMeta = {
  usedIn: [
    {
      repo: 'mieweb/enterprise-health-frontdoor',
      live: 'https://concept.enterprise.health/resources/videos/',
      note: 'Video library grid cards and the hero HUD detail plate.',
    },
    {
      repo: 'bluehive-health/bluehive-marketing',
      live: 'https://bluehive.com/resources/videos/',
      note: 'Video hub gallery cards (VideoHubGalleryClient).',
    },
  ],
  skills: [
    {
      name: 'video-content',
      repo: 'bluehive-health/bluehive-marketing',
      url: skillUrl('bluehive-health/bluehive-marketing', 'video-content'),
      summary:
        'Adds or replaces a video with its full SEO surface — detail page, transcript, JSON-LD, sitemap, hub card.',
    },
  ],
  origin: {
    repo: 'mieweb/enterprise-health-frontdoor',
    note: 'Ported from components/videos/VideoHubGalleryClient.tsx (VideoCard) and lib/use-youtube-hover-preview.ts.',
  },
};

const meta: Meta<typeof VideoCard> = {
  title: 'Components/Images & Media/VideoCard',
  component: VideoCard,
  parameters: {
    layout: 'centered',
    meta: componentMeta,
    docs: {
      description: {
        component:
          'A video thumbnail card with the branded `PlayButton` (white disc, brand triangle, ' +
          'spinning conic ring on hover), a "Watch · 34 min" duration pill and — with a `youtubeId` — ' +
          'a muted, looping hover preview after a 600ms dwell, with a progress bar and "Silent" pill, ' +
          "exactly as YouTube's grid behaves. Preview is skipped on touch and under " +
          '`prefers-reduced-motion`. `variant="plate"` renders only the media for heroes and detail panels. ' +
          'The preview lives in `useYouTubeHoverPreview`, exported from `@mieweb/ui/hooks`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['card', 'plate'] },
    durationPrefix: { control: 'text' },
    preview: { control: 'boolean' },
    eyebrow: { control: false },
    footer: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Ozwell AI in the exam room',
    href: '#',
    youtubeId: 'aqz-KE-bpKQ',
    duration: '2:44',
    eyebrow: (
      <Badge variant="secondary" size="sm">
        Demo
      </Badge>
    ),
    description:
      'Ozwell AI automates documentation and surveillance to expand clinician capacity — native to the platform, not bolted on.',
    footer: 'AI Medical Assistant · 12K views',
  },
};

/** Hover to see the muted preview mount after a short dwell. */
export const HoverPreview: Story = {
  args: { ...Default.args, description: undefined, footer: undefined },
};

/** Just the media plate — for heroes and detail panels where the copy lives elsewhere. */
export const Plate: Story = {
  args: {
    title: 'Enterprise Health platform tour',
    href: '#',
    youtubeId: 'aqz-KE-bpKQ',
    duration: '34 min',
    variant: 'plate',
  },
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
};

/** Custom thumbnail, no YouTube preview, plain duration pill. */
export const StaticThumbnail: Story = {
  args: {
    title: 'Customer story: Purdue University',
    onClick: fn(),
    thumbnailUrl: 'https://picsum.photos/seed/eh-video/640/360',
    duration: '7:52',
    durationPrefix: null,
    eyebrow: (
      <Badge variant="success" size="sm">
        Customer story
      </Badge>
    ),
    description:
      'How a 50,000-person campus consolidated employee health onto one record.',
  },
};

/** The play affordance on its own — reuse it on any custom media plate. */
export const PlayButtonOnly: Story = {
  render: () => (
    <div className="group bg-primary-950 flex items-center gap-8 rounded-xl p-10">
      <PlayButton size="sm" ring="always" />
      <PlayButton size="md" ring="always" />
      <PlayButton size="lg" ring="hover" />
    </div>
  ),
};
