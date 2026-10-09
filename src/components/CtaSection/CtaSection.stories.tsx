import type { Meta, StoryObj } from '@storybook/react-vite';
import { CtaSection } from './CtaSection';
import { templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof CtaSection> = {
  id: 'conversion-ctasection',
  title: 'Templates/Conversion/CtaSection',
  component: CtaSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive CTASection (117 page imports) merged with the eyebrow and microcopy of the EH CTA panel.'
    ),
    docs: {
      description: {
        component: `### What it's for

A call-to-action band: eyebrow, heading, one line of copy, up to two button-styled links and small print. Defaults to the saturated \`brand\` tone so it reads as the end of the page.

### Use it when

- A page, or a long run of content, needs a clear next step — typically the last block of [LandingPage](?path=/docs/pages-landingpage--docs).
- The next step is another page (a demo booking page, pricing, contact).

### Don't use it when

- Visitors should convert without leaving the page — use [LeadFormSection](?path=/docs/conversion-leadformsection--docs).
- It is the first thing on the page — use [HeroSection](?path=/docs/conversion-herosection--docs), which owns the page's \`h1\`.

### Example

\`\`\`tsx
<CtaSection
  title="See it with your own roster"
  description="A 20-minute walkthrough using your roles and sites."
  primaryCta={{ label: 'Book a demo', href: '/demo/' }}
  secondaryCta={{ label: 'Talk to sales', href: '/contact/' }}
/>
\`\`\`

### Limitations

- \`layout="band"\` fills the section with \`tone\`; \`layout="panel"\` floats a rounded card of \`tone\` on the page background.
- Buttons are anchors with no click handler; give a link a \`trackingId\` and it renders as \`data-track\` for your analytics.
- Server-safe: no client state or motion. Labels wrap when translated.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'composes with',
          target: 'conversion-herosection',
          why: 'A page opens with HeroSection and closes with CtaSection, usually pointing at the same destination.',
        },
        {
          type: 'alternative to',
          target: 'conversion-leadformsection',
          why: 'CtaSection links to the next page; LeadFormSection captures the lead in place.',
        },
      ],
    },
  },
  argTypes: {
    title: { description: 'Section heading (`h2`).' },
    layout: { control: 'inline-radio', options: ['band', 'panel'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
    note: { description: 'Small print under the buttons.' },
  },
  args: {
    eyebrow: 'Get started',
    title: 'See it with your own roster',
    description: 'A 20-minute walkthrough using your roles and sites.',
    primaryCta: { label: 'Book a demo', href: '#demo' },
    secondaryCta: { label: 'Talk to sales', href: '#sales' },
    note: 'No commitment. Setup takes about ten minutes.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Band: Story = {};

export const Panel: Story = { args: { layout: 'panel' } };

export const Muted: Story = { args: { tone: 'muted', align: 'start' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
