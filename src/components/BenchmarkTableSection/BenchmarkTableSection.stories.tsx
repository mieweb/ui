import type { Meta, StoryObj } from '@storybook/react-vite';
import { BenchmarkTableSection } from './BenchmarkTableSection';
import { templateOrigin } from '../../templates/storyData';
import {
  benchmarkColumns,
  benchmarkRows,
} from '../../templates/reportStoryData';

const meta: Meta<typeof BenchmarkTableSection> = {
  id: 'reports-benchmarktablesection',
  title: 'Templates/Reports/BenchmarkTableSection',
  component: BenchmarkTableSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'Generalises the access report’s pricing, network and metro tables into one column-driven table.'
    ),
    docs: {
      description: {
        component: `### What it's for

A published benchmark table: labelled rows, locale-formatted numeric columns, an emphasised comparison column, optional inline bars, and a sticky label column so wide tables scroll sideways on phones.

### Use it when

- A report shows the same measures across many items (services by region, states by supply).

### Don't use it when

- Readers need to sort, filter or page — use [DataVis NITRO](?path=/docs/components-grids-overview--docs).
- There are two or three numbers — use [StatsSection](?path=/docs/social-proof-statssection--docs).

### Example

\`\`\`tsx
<BenchmarkTableSection
  title="What services cost"
  rowHeader="Service"
  columns={[{ key: 'avg', label: 'National avg', format: { style: 'currency', currency: 'USD' }, emphasis: true }]}
  rows={[{ label: 'DOT physical', values: { avg: 98 } }]}
/>
\`\`\`

### Limitations

- Static: no sorting or filtering. Numbers are formatted by \`Intl.NumberFormat(locale, column.format)\`; strings render as written; \`null\` shows a dash.
- Bars are decorative; the number beside each bar carries the value.
- \`validateLandingPage\` warns when a row has values for unknown columns.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'grids-table',
          why: 'Table is an app table primitive; this is a whole report section with formatting and bars.',
        },
        {
          type: 'alternative to',
          target: 'reports-rankedlistsection',
          why: 'Use a ranked list when order matters more than several measures.',
        },
      ],
    },
  },
  argTypes: {
    columns: { description: '`{ key, label, format?, bar?, emphasis? }[]`.' },
    rows: { description: '`{ label, sublabel?, href?, values }[]`.' },
    rowHeader: { control: 'text' },
    status: {
      control: 'inline-radio',
      options: ['live', 'modeled', 'maturing'],
    },
    locale: { control: 'text' },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Pricing benchmarks',
    title: 'What services cost',
    status: 'live',
    rowHeader: 'Service',
    columns: benchmarkColumns,
    rows: benchmarkRows,
    footnote: 'State-level averages of provider-listed rates. Sample data.',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBars: Story = {
  args: {
    title: 'Top states by provider locations',
    rowHeader: 'State',
    columns: [
      { key: 'locations', label: 'Provider locations', bar: true },
      {
        key: 'density',
        label: 'Per 100k workers',
        format: { maximumFractionDigits: 1 },
      },
    ],
    rows: [
      { label: 'Texas', values: { locations: 412, density: 3.0 } },
      { label: 'California', values: { locations: 388, density: 2.9 } },
      { label: 'Ohio', values: { locations: 201, density: 5.1 } },
    ],
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
