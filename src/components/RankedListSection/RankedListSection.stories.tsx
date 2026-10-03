import type { Meta, StoryObj } from '@storybook/react-vite';
import { RankedListSection } from './RankedListSection';
import { templateOrigin } from '../../templates/storyData';
import { demandList, rankedLists } from '../../templates/reportStoryData';

const meta: Meta<typeof RankedListSection> = {
  id: 'reports-rankedlistsection',
  title: 'Templates/Reports/RankedListSection',
  component: RankedListSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'Generalises the access report’s demand trends, search trends and best/least-served state lists.'
    ),
    docs: {
      description: {
        component: `### What it's for

Ranked horizontal bars: the most-ordered services, the most-searched terms, or the best- and worst-served regions side by side.

### Use it when

- Order matters more than exact values, and there are roughly 3–15 items per list.

### Don't use it when

- Each item has several measures — use [BenchmarkTableSection](?path=/docs/reports-benchmarktablesection--docs).
- The ranking changes over time in a presentation — use a \`ranked-list\` slide in [Deck](?path=/docs/presentations-deck--docs).

### Example

\`\`\`tsx
<RankedListSection title="What employers are buying" numbered lists={[{ items: [{ label: 'DOT physical', value: 94, note: '14 industries' }] }]} />
\`\`\`

### Limitations

- Bars scale to each list's largest value; they are decorative, and the value (or \`display\`) is always in the text.
- \`layout="stacked"\` shows \`note\` in place of the value visually and keeps the value for screen readers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'reports-benchmarktablesection',
          why: 'Use a table when each item has several measures.',
        },
      ],
    },
  },
  argTypes: {
    lists: {
      description:
        '`{ title?, items: { label, value, display?, href?, note? }[] }[]`.',
    },
    layout: { control: 'inline-radio', options: ['stacked', 'inline'] },
    bar: { control: 'inline-radio', options: ['primary', 'accent', 'success'] },
    numbered: { control: 'boolean' },
    status: {
      control: 'inline-radio',
      options: ['live', 'modeled', 'maturing'],
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Employer demand',
    title: 'What employers are buying',
    status: 'modeled',
    numbered: true,
    lists: demandList,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Stacked: Story = {};

export const SideBySide: Story = {
  args: {
    eyebrow: undefined,
    title: 'Best- and least-served states',
    status: 'live',
    numbered: false,
    layout: 'inline',
    bar: 'accent',
    lists: rankedLists,
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
