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
  id: 'media-videocard',
  title: 'Modules/Media/VideoCard',
  component: VideoCard,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    meta: componentMeta,
    docs: {
      description: {
        component: `### What it's for

A video thumbnail card: poster image, the branded \`PlayButton\` (white disc, brand triangle, spinning conic ring on hover), a "Watch · 34 min" duration pill, and — with a \`youtubeId\` — a muted, looping hover preview after a 600ms dwell with a progress bar and "Silent" pill, exactly as YouTube's own grid behaves. \`variant="plate"\` renders only the media for heroes and detail panels. Exports \`VideoCard\`, \`PlayButton\`; the preview lives in \`useYouTubeHoverPreview\` (exported from \`@mieweb/ui/hooks\`) for custom cards.

### Use it when

- A video library, resource grid or "watch the tour" tile links out to full playback — the card is the invitation, not the player.
- A hero or \`RadialExplorer\` detail panel needs just the media block — \`variant="plate"\`.

### Don't use it when

- The user should watch **here**: full inline playback with controls — \`MediaPlayer\`.
- The media is audio — \`AudioPlayer\`.
- There's no video — a \`Card\` with an image slot.

### Example

\`\`\`tsx
<VideoCard
  title="Ozwell AI in the exam room"
  href="/videos/ozwell-exam-room/"
  thumbnailUrl="/thumbs/ozwell.jpg"
  duration="34 min"
  youtubeId="dQw4w9WgXcQ" // enables the muted hover preview
  eyebrow={<Badge>New</Badge>}
/>
\`\`\`

### Limitations

- Accessibility: the whole card is one link named \`"Watch: {title}"\`; decorative layers (play ring, pills, preview) are \`aria-hidden\`. The preview never traps focus — it starts on hover/focus and stops on leave/blur.
- The hover preview is skipped on touch (\`hover: none\`) and under \`prefers-reduced-motion\`, and returns the card to its poster if the YouTube iframe API is blocked (CSP, ad blocker) or times out.
- The preview loads YouTube's iframe API script from \`www.youtube.com\` and hosts the player on \`www.youtube-nocookie.com\` — a CSP must allow **both** origins for the feature (the card itself works without them).
- i18n: \`durationPrefix\` (default "Watch") and \`silentLabel\` (default "Silent") are props; pass \`durationPrefix={null}\` for just the duration.
- RTL: pills and progress bar use logical start/end classes and mirror correctly.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'showcase-radialexplorer',
          why: '`VideoCard variant="plate"` is the intended media block for RadialExplorer\'s detail panel.',
        },
      ],
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['card', 'plate'],
      description:
        '`card` is the full tile; `plate` renders only the media block.',
    },
    durationPrefix: {
      control: 'text',
      description:
        'Word before the duration in the pill; null for just the duration.',
    },
    preview: {
      control: 'boolean',
      description: 'Enable the muted hover preview (requires `youtubeId`).',
    },
    eyebrow: {
      control: false,
      description: 'Slot above the title, e.g. a Badge.',
    },
    footer: { control: false, description: 'Slot under the title.' },
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
