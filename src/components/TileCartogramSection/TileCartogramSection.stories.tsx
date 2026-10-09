import type { Meta, StoryObj } from '@storybook/react-vite';
import { TileCartogramSection } from './TileCartogramSection';
import { templateOrigin } from '../../templates/storyData';
import { tileLegend, tileValues } from '../../templates/reportStoryData';

const meta: Meta<typeof TileCartogramSection> = {
  id: 'reports-tilecartogramsection',
  title: 'Templates/Reports/TileCartogramSection',
  component: TileCartogramSection,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    meta: templateOrigin(
      'bluehive',
      'The access report’s state density heat-grid, with the US tile layout and quartile bucketing extracted.'
    ),
    docs: {
      description: {
        component: `### What it's for

A tile-grid map: every region the same size, shaded into five buckets, so Rhode Island is as visible as Texas. Ships the US states + DC layout (\`usStateTiles\`) and a \`quartileBuckets\` helper.

### Use it when

- A figure varies by state (or any region set you can lay out on a grid) and small regions matter as much as large ones.

### Don't use it when

- Location itself matters (distances, clusters of points) — use [PointMap](?path=/docs/presentations-pointmap--docs).

### Example

\`\`\`tsx
import { quartileBuckets } from '@mieweb/ui/templates';
const buckets = quartileBuckets({ TX: 3.0, OH: 5.1 /* … */ });
<TileCartogramSection
  title="Provider density"
  values={{ TX: { bucket: buckets.TX, detail: '3.0 per 100k' } }}
  legend={[{ bucket: 4, label: 'Highest' }, { bucket: 0, label: 'No data' }]}
/>
\`\`\`

### Limitations

- Five buckets (0 = no data, 1–4 up the primary scale). Compute buckets in the data layer.
- Each tile is a list item that reads its full name and \`detail\`; the visible code is decorative.
- Pass \`layout\` for other region sets (countries, districts) as \`{ code, name, row, col }[]\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/templates',
      relationships: [
        {
          type: 'alternative to',
          target: 'presentations-pointmap',
          why: 'PointMap shows real geography; the cartogram gives every region equal area.',
        },
      ],
    },
  },
  argTypes: {
    values: {
      control: false,
      description: 'Keyed by tile code: `{ bucket: 0–4, detail? }`.',
    },
    legend: { description: '`{ bucket, label }[]`.' },
    layout: {
      control: false,
      description: 'Tile positions; defaults to `usStateTiles`.',
    },
    status: {
      control: 'inline-radio',
      options: ['live', 'modeled', 'maturing'],
    },
    tone: { control: 'inline-radio', options: ['default', 'muted', 'brand'] },
  },
  args: {
    eyebrow: 'Geographic access',
    title: 'Where supply meets, and misses, demand',
    status: 'live',
    mapTitle: 'Provider density by state',
    mapDescription:
      'Each tile is a state, shaded by providers per 100k workers. Sample data.',
    values: tileValues,
    legend: tileLegend,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UnitedStates: Story = {};
export const Muted: Story = { args: { tone: 'muted' } };
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
