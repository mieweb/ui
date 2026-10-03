import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricStatusBadge } from './MetricStatusBadge';
import { templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof MetricStatusBadge> = {
  id: 'reports-metricstatusbadge',
  title: 'Templates/Reports/MetricStatusBadge',
  component: MetricStatusBadge,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    meta: templateOrigin(
      'bluehive',
      'The access report’s MetricStatusBadge, re-tokenised with a neutral pill and a status dot.'
    ),
    docs: {
      description: {
        component: `### What it's for

Labels a figure by provenance — **live** (measured), **modeled** (estimated) or **maturing** (defined, not yet measured) — so readers know how much weight each number carries.

### Use it when

- A report or data page mixes measured and estimated figures.
- A section heading needs a provenance tag; report sections take \`status\` and render this badge for you.

### Don't use it when

- The label is a workflow state (pending, approved) — use [Badge](?path=/docs/data-display-badge--docs).
- You need to say *which* source backs a figure — use [SourceTip](?path=/docs/overlays-sourcetip--docs).

### Example

\`\`\`tsx
<MetricStatusBadge status="modeled" />
\`\`\`

### Limitations

- Three fixed statuses. The dot colour is decorative; the text carries the meaning.
- Pass \`label\` to translate; pass \`onDark\` on brand-coloured surfaces.
- Server-safe (\`@mieweb/ui/templates\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'data-display-badge',
          why: 'Badge is a general status pill; MetricStatusBadge has fixed data-provenance meanings.',
        },
      ],
    },
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['live', 'modeled', 'maturing'],
      description: 'Where the figure comes from.',
    },
    label: {
      control: 'text',
      description: 'Override the visible text, e.g. for translation.',
    },
    onDark: {
      control: 'boolean',
      description: 'Set on brand-coloured or dark surfaces.',
    },
  },
  args: { status: 'live' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {};
export const Modeled: Story = { args: { status: 'modeled' } };
export const Maturing: Story = { args: { status: 'maturing' } };
export const OnDark: Story = {
  args: { onDark: true },
  render: (args) => (
    <div className="bg-primary-900 rounded-xl p-6">
      <MetricStatusBadge {...args} />
    </div>
  ),
};
