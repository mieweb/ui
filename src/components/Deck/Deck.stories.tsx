import type { Meta, StoryObj } from '@storybook/react-vite';
import { Deck } from './Deck';
import { SlideFrame } from './SlideFrame';
import { SlideHeader } from './primitives';
import { sampleDeck, sampleDeckMeta } from './storyData';
import type { SlideRendererProps, Slide } from './types';

const meta: Meta<typeof Deck> = {
  id: 'presentations-deck',
  title: 'Modules/Presentations/Deck',
  component: Deck,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: {
      origin: {
        repo: 'mieweb/enterprise-health-frontdoor',
        note: 'The EH report Deck shell and slides, merged with the slide types of the BlueHive/EH SlidePresentation board decks.',
      },
    },
    docs: {
      story: { inline: false, height: '720px' },
      description: {
        component: `### What it's for

A full-screen, scroll-snapping slide deck built from plain JSON slides — board updates, growth reviews, conference talks published as a page. It supplies the chrome: progress bar, dot nav, slide counter, outline dialog, keyboard (arrows, Page Up/Down, Home/End, 1–9, **F** fullscreen, **?** hints), swipe, deep links (\`#slide-3\` or a slide's \`id\`) and one-slide-per-page printing.

**Slide types:** \`cover\`, \`section-divider\`, \`table-of-contents\`, \`bullet-list\`, \`quote\`, \`image\`, \`definition-list\`, \`conclusion\`, \`metrics\`, \`chart\`, \`feature-highlight\`, \`comparison-table\`, \`impact-table\`, \`cards\`, \`ranked-list\`, \`breakdown\`, \`cycle\`, \`roadmap\`, \`adoption-curve\`, \`diagram\`, \`certification-grid\`, \`showcase\`, \`tabs\`, and \`custom\`.
**Graphics** (in \`chart\`, \`feature-highlight\` and \`breakdown\`): \`bar\`, \`horizontal-bar\`, \`multi-line\` (log scale, lines/bars toggle), \`kpi-row\`, \`spark\`, and \`custom\`.

### Use it when

- The content is a presentation: one idea per screen, read in order, shared as a link.

### Don't use it when

- The content is a report people scan and search — build it with the Reports sections in [LandingPage](?path=/docs/pages-landingpage--docs).
- You need an editor — this renders decks, it doesn't author them.

### Example

\`\`\`tsx
'use client';
import { Deck } from '@mieweb/ui/deck';
import { PointMap } from '@mieweb/ui/maps';
import { trackEvent } from '@/lib/analytics';

<Deck
  slides={deck.slides}
  meta={{ title: 'Q2 Growth Review', period: 'Q2 2026' }}
  home={{ label: 'Back to site', href: '/' }}
  onSlideChange={(slide, i) => trackEvent('report_slide_view', { slide_index: i, slide_type: slide.type })}
  graphics={{ map: PointMap }}
  renderers={{ roi: RoiSlide }}
/>
\`\`\`

### Limitations

- **Client-only.** Import from \`@mieweb/ui/deck\` in a client component. Slide content still renders on the server first; the fade-up reveal only applies after mount, so HTML without JavaScript is readable.
- **It fills the viewport** (\`h-dvh\`). Hide the site's header and footer on deck routes, and give readers \`home\` as a way back.
- **Tones** (\`brand\`, \`deep\`, \`ink\`, \`glow\`, \`light\`) and accents come from the brand tokens — decks look right in every brand without per-deck colours. \`accent\` is the brand's highlight colour (EH and BlueHive gold).
- **Custom slides** render through \`renderers\`; build them with \`SlideFrame\` and the exported primitives (\`SlideHeader\`, \`SlideCard\`, \`CountUp\`, \`reveal\`) so they sit flush.
- **Figures count up** once when first seen, and not at all under \`prefers-reduced-motion\`. Charts include a screen-reader table of their values.
- Every chrome string is in \`labels\` for translation. Numbers use \`locale\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/deck',
      relationships: [
        {
          type: 'composes with',
          target: 'presentations-pointmap',
          why: 'Register PointMap in `graphics` to put a map on a slide.',
        },
      ],
    },
  },
  argTypes: {
    slides: {
      control: false,
      description: 'The deck, first to last: slide objects tagged with `type`.',
    },
    meta: {
      control: false,
      description:
        '`{ title, subtitle?, period? }` — the region label and hidden `h1`.',
    },
    home: { control: false, description: 'A link back to the site.' },
    onSlideChange: {
      control: false,
      description: '`(slide, index) => void` when the visible slide changes.',
    },
    renderers: {
      control: false,
      description: 'Site slide renderers by type or custom name.',
    },
    graphics: {
      control: false,
      description: 'Components for `custom` graphics.',
    },
    labels: { control: false, description: 'Chrome strings for translation.' },
    syncHash: { control: 'boolean' },
  },
  args: {
    slides: sampleDeck,
    meta: sampleDeckMeta,
    home: { label: 'Back to site', href: '#' },
    syncHash: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSlideTypes: Story = {};

function RoiSlide({ slide, index }: SlideRendererProps<Slide>) {
  return (
    <SlideFrame slide={slide} index={index} tone="light">
      <SlideHeader
        eyebrow="Site-owned slide"
        title="An ROI calculator"
        subtitle="Rendered by the app through `renderers`, framed by SlideFrame."
      />
    </SlideFrame>
  );
}

export const CustomSlide: Story = {
  args: {
    slides: [
      sampleDeck[0],
      { type: 'custom', component: 'roi', title: 'ROI' },
      sampleDeck[sampleDeck.length - 1],
    ],
    renderers: { roi: RoiSlide },
  },
};

export const LightTone: Story = {
  args: {
    slides: sampleDeck
      .slice(2, 7)
      .map((s) => ({ ...s, tone: 'light' as const })),
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <Deck {...args} />
    </div>
  ),
};
