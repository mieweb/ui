import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportLegend } from './ReportLegend';
import { templateOrigin } from '../../templates/storyData';
import { reportLegend } from '../../templates/reportStoryData';

const meta: Meta<typeof ReportLegend> = {
  id: 'reports-reportlegend',
  title: 'Templates/Reports/ReportLegend',
  component: ReportLegend,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The legend variant of the access report’s ReportByline.'
    ),
    docs: {
      description: {
        component: `### What it's for

The key to a report's provenance badges: what *live*, *modeled* and *maturing* mean in this report. Place it near the top, right after the key findings.

### Use it when

- The report tags sections or figures with [MetricStatusBadge](?path=/docs/reports-metricstatusbadge--docs).

### Don't use it when

- Every figure has one source — say so in the methodology instead.

### Example

\`\`\`tsx
<ReportLegend entries={[{ status: 'live', description: 'From the current directory.' }]} />
\`\`\`

### Limitations

- The heading defaults to "How to read the data"; pass \`title\` to translate or reword.
- Server-safe (\`@mieweb/ui/templates\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'uses',
          target: 'reports-metricstatusbadge',
          why: 'Each entry is a badge with its meaning.',
        },
      ],
    },
  },
  argTypes: {
    entries: {
      description:
        'Statuses and what they mean: `{ status, description, label? }`.',
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: { entries: reportLegend },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const OnBrand: Story = { args: { tone: 'brand' } };
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
