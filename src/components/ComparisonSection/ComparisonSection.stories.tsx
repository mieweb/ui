import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComparisonSection } from './ComparisonSection';
import {
  comparisonColumns,
  comparisonRows,
  templateOrigin,
} from '../../templates/storyData';

const meta: Meta<typeof ComparisonSection> = {
  id: 'content-comparisonsection',
  title: 'Templates/Content/ComparisonSection',
  component: ComparisonSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'BlueHive FeatureComparison generalised to any number of columns, rendered as the plain table of the EH WhitepaperComparison.'
    ),
    docs: {
      description: {
        component: `### What it's for

A row-by-row comparison table: a feature column plus one column per option, with \`true\`/\`false\` cells drawn as included / not included and string cells as text. One column can be highlighted as "yours".

### Use it when

- A comparison or "before and after" page pits your product against an alternative or the status quo.
- A service page needs a short "with vs. without" table.

### Don't use it when

- Users sort, filter or page through the rows — that is data, use [DataVis NITRO](?path=/docs/grids-datavis-nitro--docs).
- There is no second option to compare against — use [FeatureGridSection](?path=/docs/content-featuregridsection--docs).

### Example

\`\`\`tsx
<ComparisonSection
  title="Before and after"
  columns={['Spreadsheets & phone calls', 'With BlueHive']}
  rows={[{ feature: 'Real-time result status', values: [false, true] }]}
  highlightColumn={1}
/>
\`\`\`

### Limitations

- A real \`<table>\` with \`scope\`d row and column headers and a visually hidden caption from \`title\`; check and cross icons carry screen-reader text from \`labels\` (English defaults).
- Two value columns fit a phone; three or more scroll sideways inside the card.
- Stick to claims you can substantiate — comparison copy about a named competitor is the app's legal responsibility.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'composes with',
          target: 'conversion-pricingsection',
          why: 'Under a PricingSection, ComparisonSection compares the plans feature by feature.',
        },
      ],
    },
  },
  argTypes: {
    columns: { description: 'Value column headers.' },
    rows: { description: 'Rows: `{ feature, values }`, one value per column.' },
    highlightColumn: {
      control: 'number',
      description: 'Index into `columns` to emphasise.',
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Compare',
    title: 'Before and after',
    columns: comparisonColumns,
    rows: comparisonRows,
    highlightColumn: 1,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoColumns: Story = {};

export const ThreeColumns: Story = {
  args: {
    tone: 'muted',
    columns: ['Spreadsheets', 'Point solution', 'The platform'],
    highlightColumn: 2,
    rows: comparisonRows.map((r) => ({
      ...r,
      values: [
        r.values[0],
        typeof r.values[1] === 'boolean' ? false : 'Partly',
        r.values[1],
      ],
    })),
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
