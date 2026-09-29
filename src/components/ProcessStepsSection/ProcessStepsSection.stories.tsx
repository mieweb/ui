import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProcessStepsSection } from './ProcessStepsSection';
import { steps, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof ProcessStepsSection> = {
  id: 'content-processstepssection',
  title: 'Templates/Content/ProcessStepsSection',
  component: ProcessStepsSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive ProcessSteps (numbered markers joined by a connector line).'
    ),
    docs: {
      description: {
        component: `### What it's for

A short, ordered "how it works": numbered (or icon) markers joined by a connector line at desktop widths, each with an \`h3\` title and one sentence.

### Use it when

- Getting started takes two to four steps a buyer should see at a glance.
- The order matters — the section renders an \`<ol>\`.

### Don't use it when

- The items are parallel rather than sequential — use [FeatureGridSection](?path=/docs/content-featuregridsection--docs).
- You are showing a record's progress over time inside an app — use [Timeline](?path=/docs/data-display-timeline--docs).

### Example

\`\`\`tsx
<ProcessStepsSection
  title="Live in four steps"
  steps={[{ title: 'Connect your roster', description: 'Import or sync from your HRIS.' }]}
/>
\`\`\`

### Limitations

- The connector line only draws for two to four steps in one row; five or more wrap without it.
- Markers are decorative (\`aria-hidden\`); the \`<ol>\` carries the numbering for assistive tech.
- Step \`icon\` accepts the same tokens as FeatureGridSection.`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    steps: { description: 'Steps: `{ title, description, icon? }`.' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
  },
  args: {
    eyebrow: 'How it works',
    title: 'Live in four steps',
    steps,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const FourSteps: Story = {};

export const ThreeWithIcons: Story = {
  args: {
    tone: 'muted',
    steps: steps.slice(0, 3).map((s, i) => ({
      ...s,
      icon: ['users', 'clipboard-check', 'badge-check'][i],
    })),
  },
};

export const OnBrand: Story = { args: { tone: 'brand' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
