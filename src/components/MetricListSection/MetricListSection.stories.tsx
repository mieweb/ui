import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricListSection } from './MetricListSection';
import { templateOrigin } from '../../templates/storyData';
import {
  maturingMetrics,
  measuredMetrics,
} from '../../templates/reportStoryData';

const meta: Meta<typeof MetricListSection> = {
  id: 'reports-metriclistsection',
  title: 'Templates/Reports/MetricListSection',
  component: MetricListSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The access report’s ReportMaturingMetrics.'
    ),
    docs: {
      description: {
        component: `### What it's for

Metric definitions, with values once they exist. Publishing what you will measure before the data lands is honest about what isn't measured yet; when values arrive they drop in and the badge flips from *maturing* to *live*.

### Use it when

- A report promises operational figures (turnaround, time to appointment) that are still being instrumented.

### Don't use it when

- All values are known — use [StatsSection](?path=/docs/social-proof-statssection--docs) with \`variant="cards"\`.

### Example

\`\`\`tsx
<MetricListSection title="Scheduling and turnaround" metrics={[{ label: 'Results turnaround', unit: 'hours', description: 'Median hours from collection to result.' }]} />
\`\`\`

### Limitations

- The status is derived: *live* if any metric has a \`value\`, otherwise *maturing* with a "Roadmap preview" note.
- \`positive\` marks measured values with a success rule rather than coloured text, which fails contrast on some brands.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'uses',
          target: 'reports-metricstatusbadge',
          why: 'Shows whether the values are measured yet.',
        },
      ],
    },
  },
  argTypes: {
    metrics: { description: '`{ label, unit?, description, value? }[]`.' },
    takeaway: { control: 'text' },
    positive: { control: 'boolean' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Operations',
    title: 'Scheduling and turnaround',
    description:
      'We publish the definitions now and the values once they are measured.',
    metrics: maturingMetrics,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Maturing: Story = {};
export const Measured: Story = {
  args: {
    metrics: measuredMetrics,
    positive: true,
    takeaway:
      'Most workers are seen within three days and have results the next day.',
  },
};
