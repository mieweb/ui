import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatsSection } from './StatsSection';
import { stats, templateOrigin } from '../../templates/storyData';

const meta: Meta<typeof StatsSection> = {
  id: 'social-proof-statssection',
  title: 'Templates/Social proof/StatsSection',
  component: StatsSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'eh',
      'The EH StatsBlock / Outcomes proof band (value, label, note, trend arrow), without the client-side count-up.'
    ),
    docs: {
      description: {
        component: `### What it's for

A band of headline numbers — value with optional prefix, suffix and trend arrow, a label and a note — rendered as a description list.

### Use it when

- A page backs its pitch with two to four figures: network size, time saved, outcomes.

### Don't use it when

- The figure should count up as it scrolls into view — that needs client JavaScript; render [AnimatedNumber](?path=/docs/composite-forms-slidercalculator--docs) from a client component instead.
- The numbers are live metrics in an app — use the Dashboards family.

### Example

\`\`\`tsx
<StatsSection
  title="What teams see in the first year"
  stats={[{ value: 30, suffix: '%', label: 'Less admin time', trend: 'down' }]}
/>
\`\`\`

### Limitations

- Numeric values are formatted with \`Intl.NumberFormat(locale)\`; string values render as written.
- The trend arrow is decorative — say the direction in the label.
- Every figure is a claim: cite its source on the page (a footnote or a SourceTip beside the section).`,
      },
    },
    catalog: { entry: '@mieweb/ui/templates' },
  },
  argTypes: {
    stats: {
      description:
        'Figures: `{ value, prefix?, suffix?, label, description?, trend? }`.',
    },
    variant: { control: 'inline-radio', options: ['plain', 'cards'] },
    locale: {
      control: 'text',
      description: 'BCP 47 locale for number formatting.',
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
    align: { control: 'inline-radio', options: ['start', 'center'] },
  },
  args: {
    title: 'What teams see in the first year',
    stats,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const Cards: Story = {
  args: {
    variant: 'cards',
    tone: 'muted',
    stats: stats.map((s, i) => ({
      ...s,
      description: [
        'Vetted and credentialed',
        'From order to result',
        'Versus manual tracking',
        'For supervisors on site',
      ][i],
    })),
  },
};

export const OnBrand: Story = { args: { tone: 'brand' } };

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
