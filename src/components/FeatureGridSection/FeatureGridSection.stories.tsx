import type { Meta, StoryObj } from '@storybook/react-vite';
import { HardHat } from 'lucide-react';
import { FeatureGridSection } from './FeatureGridSection';
import { features, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof FeatureGridSection> = {
  id: 'content-featuregridsection',
  title: 'Templates/Content/FeatureGridSection',
  component: FeatureGridSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive FeatureGrid + BrandedValueProps, with the icon tile, tag and lettermark rules of the EH Capabilities section.'
    ),
    docs: {
      description: {
        component: `### What it's for

A heading over a responsive grid of features — each an icon tile, optional tag, \`h3\` title, description and optional link. Icons are named by token (\`"shield-check"\`) so the page data stays serializable.

### Use it when

- You list three to eight parallel capabilities, benefits or services that each need a sentence.
- A vertical or service page needs a "what you get" block.

### Don't use it when

- One idea needs an image and a longer argument — use [SplitContentSection](?path=/docs/content-splitcontentsection--docs).
- The items happen in order — use [ProcessStepsSection](?path=/docs/content-processstepssection--docs).
- The items are numbers — use [StatsSection](?path=/docs/social-proof-statssection--docs).

### Example

\`\`\`tsx
<FeatureGridSection
  eyebrow="Capabilities"
  title="Built for crews that move between sites"
  features={[{ icon: 'shield-check', title: 'Clearance in one place', description: '…' }]}
  columns={3}
/>
\`\`\`

### Limitations

- Icon tokens resolve against \`templateIcons\`; pass \`icons\` to add your own. An unknown token of up to four characters renders as a lettermark (\`"EHR"\`); longer unknown tokens render nothing.
- Renders a \`<ul>\`; each title is an \`h3\` under the section's \`h2\`.
- Columns collapse to one on phones and two on tablets.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'content-splitcontentsection',
          why: 'FeatureGridSection lists several parallel points; SplitContentSection argues one point beside an image.',
        },
      ],
    },
  },
  argTypes: {
    features: {
      description: 'Items: `{ title, description, icon?, tag?, link? }`.',
    },
    columns: { control: 'inline-radio', options: [2, 3, 4] },
    variant: { control: 'inline-radio', options: ['cards', 'plain'] },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
    icons: {
      control: false,
      description: 'Extra icon tokens mapped to components.',
    },
  },
  args: {
    eyebrow: 'Capabilities',
    title: 'Built for crews that move between sites',
    description:
      'Everything a safety team needs to prove every worker is cleared.',
    features,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Cards: Story = {};

export const Plain: Story = {
  args: { variant: 'plain', columns: 2, features: features.slice(0, 4) },
};

export const WithLinksAndTags: Story = {
  args: {
    tone: 'muted',
    features: features.slice(0, 3).map((f, i) => ({
      ...f,
      tag: ['Compliance', 'Scheduling', 'Network'][i],
      link: { label: 'Learn more', href: '#learn' },
    })),
  },
};

/** A site-specific token supplied through `icons`. */
export const CustomIcon: Story = {
  args: {
    icons: { crew: HardHat },
    features: [{ ...features[0], icon: 'crew' }, ...features.slice(1, 3)],
  },
};

export const OnBrand: Story = { args: { tone: 'brand', align: 'center' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
