import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeroSection } from './HeroSection';
import { dashboardImage, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof HeroSection> = {
  id: 'conversion-herosection',
  title: 'Templates/Conversion/HeroSection',
  component: HeroSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'Consolidates BlueHive Hero, HeroAnimated and BrandedHero with the breadcrumb and trust line of the EH PageHero.'
    ),
    docs: {
      description: {
        component: `### What it's for

The opening band of a marketing page: an eyebrow, the page's single \`<h1>\`, a supporting line, up to two calls to action, a reassurance note, a checked list of trust points, optional breadcrumbs and an optional image. Every prop is plain data, so a page can import it from a content file.

### Use it when

- A public landing, industry, service or campaign page needs its first screen — usually as the first block of [LandingPage](?path=/docs/pages-landingpage--docs).
- The page needs breadcrumbs above the title (industry and service detail pages).

### Don't use it when

- The page is a screen inside a signed-in app — use [PageHeader](?path=/docs/layout-pageheader--docs), which carries actions and tabs rather than marketing CTAs.
- You need the closing call to action at the bottom of a page — use [CtaSection](?path=/docs/conversion-ctasection--docs).

### Example

\`\`\`tsx
<HeroSection
  eyebrow="Construction"
  title="Keep every crew cleared to work"
  description="Exams, drug screens and certifications for every job site."
  primaryCta={{ label: 'Book a demo', href: '/demo/' }}
  secondaryCta={{ label: 'See pricing', href: '/pricing/' }}
  variant="split"
  image={{ src: '/hero.webp', alt: 'Site safety lead reviewing clearances', width: 1280, height: 800 }}
/>
\`\`\`

### Limitations

- Renders an \`<h1>\` by default; set \`headingLevel="h2"\` if the page already has one. \`validateLandingPage\` flags a second \`h1\` hero.
- \`variant="split"\` needs \`image\`; without one it falls back to the centred layout.
- The image is the page's likely LCP element, so it renders with \`priority\`: eager, \`fetchPriority="high"\`. Pass \`width\`/\`height\` to reserve space, or \`components.Image\` (e.g. a \`next/image\` adapter) for responsive sources.
- Calls to action are real \`<a>\` elements styled with \`buttonVariants\`; labels wrap instead of overflowing when translated. Breadcrumb chevrons and arrows mirror in RTL.
- Server-safe: no client state. The breadcrumb \`<nav>\` label defaults to English — override it with \`labels.breadcrumb\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-pageheader',
          why: 'HeroSection opens a public marketing page with an h1 and CTAs; PageHeader titles a screen inside an app with actions and tabs.',
        },
        {
          type: 'composes with',
          target: 'conversion-ctasection',
          why: 'A page opens with HeroSection and closes with CtaSection, usually pointing at the same destination.',
        },
      ],
    },
  },
  argTypes: {
    title: { description: 'The page heading.' },
    variant: { control: 'inline-radio', options: ['centered', 'split'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    headingLevel: { control: 'inline-radio', options: ['h1', 'h2'] },
    primaryCta: { description: 'Main call to action `{ label, href }`.' },
    secondaryCta: {
      description: 'Second call to action, rendered as an outline button.',
    },
    highlights: {
      description: 'Short trust points rendered as a checked list.',
    },
    breadcrumbs: {
      description: 'Trail ending in the current page, which is not linked.',
    },
  },
  args: {
    eyebrow: 'Construction',
    title: 'Keep every crew cleared to work',
    description:
      'Exams, drug screens and certifications for every job site — ordered, tracked and renewed in one place.',
    primaryCta: { label: 'Book a demo', href: '#demo' },
    secondaryCta: { label: 'See pricing', href: '#pricing' },
    highlights: [
      'No setup fees',
      'Nationwide clinic network',
      'Results in real time',
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Centered: Story = {};

export const Split: Story = {
  args: {
    variant: 'split',
    image: dashboardImage,
    breadcrumbs: [
      { label: 'Home', href: '#home' },
      { label: 'Industries', href: '#industries' },
      { label: 'Construction', href: '#construction' },
    ],
  },
};

/** The saturated brand band — for campaign and ABM pages. */
export const Brand: Story = {
  args: {
    tone: 'brand',
    ctaNote: 'A specialist replies within one business day.',
  },
};

export const Mobile: Story = {
  args: { variant: 'split', image: dashboardImage },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  name: 'RTL',
  args: {
    variant: 'split',
    image: dashboardImage,
    breadcrumbs: [
      { label: 'Home', href: '#home' },
      { label: 'Industries', href: '#industries' },
      { label: 'Construction', href: '#construction' },
    ],
  },
  render: (args) => (
    <div dir="rtl">
      <HeroSection {...args} />
    </div>
  ),
};
