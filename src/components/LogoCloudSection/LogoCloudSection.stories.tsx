import type { Meta, StoryObj } from '@storybook/react-vite';
import { LogoCloudSection } from './LogoCloudSection';
import { logos, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof LogoCloudSection> = {
  id: 'social-proof-logocloudsection',
  title: 'Templates/Social proof/LogoCloudSection',
  component: LogoCloudSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive LogoCloudAnimated (grid + CSS marquee with speeds) and the EH LogoMarquee.'
    ),
    docs: {
      description: {
        component: `### What it's for

A row of customer, partner or integration logos under a short label — a wrapping grid, or a CSS marquee that loops continuously. Logos without an image render as wordmarks.

### Use it when

- A page needs quick recognition proof: "Trusted by…", "Connects to…".

### Don't use it when

- The logos should orbit your product mark as a hero visual — use [OrbitRing](?path=/docs/showcase-orbitring--docs).
- Readers need to compare or browse the partners — use [FeatureGridSection](?path=/docs/content-featuregridsection--docs) with one card each.

### Example

\`\`\`tsx
<LogoCloudSection
  eyebrow="Connects to the HR systems you already run"
  logos={[{ name: 'Workday', src: '/logos/workday.svg', href: '/integrations/workday/' }]}
  variant="marquee"
/>
\`\`\`

### Limitations

- The marquee is pure CSS (\`mie-marquee\` in \`effects.css\`): it pauses on hover and focus, reverses in RTL, and under \`prefers-reduced-motion\` stops and wraps into a static row. Its second copy is \`aria-hidden\` and out of the tab order.
- Logos render grayscale and brighten on hover; on the \`brand\` tone they are drawn white.
- Each logo's \`name\` is its alt text.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'showcase-orbitring',
          why: 'LogoCloudSection is a compact recognition strip; OrbitRing is a decorative hero visual of logos orbiting a centre mark.',
        },
      ],
    },
  },
  argTypes: {
    logos: {
      description: 'Logos: `{ name, src?, href? }`; name is the alt text.',
    },
    variant: { control: 'inline-radio', options: ['grid', 'marquee'] },
    speed: { control: 'inline-radio', options: ['slow', 'normal', 'fast'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Connects to the HR systems you already run',
    logos,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Grid: Story = {};

export const Marquee: Story = { args: { variant: 'marquee' } };

export const Wordmarks: Story = {
  args: {
    tone: 'muted',
    logos: ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin', 'Litware'].map(
      (name) => ({ name })
    ),
  },
};

export const OnBrand: Story = { args: { tone: 'brand', variant: 'marquee' } };
