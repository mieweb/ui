import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVisNitroGraph } from './DataVisNitroGraph';
import { DataVisNitroSource } from './DataVisNITRO';

const meta: Meta<typeof DataVisNitroGraph> = {
  id: 'grids-datavis-nitro-graph',
  title: 'Components/Grids/DataVis NITRO Graph',
  component: DataVisNitroGraph,
  parameters: {
    layout: 'fullscreen',
    a11y: {
      disable: true,
    },
    docs: {
      description: {
        component: `### What it's for

Charting the same record set a NITRO grid shows. Wraps \`@mieweb/datavis\`'s \`GraphView\` and supports bar, line, area and pie charts driven by a \`config\` (\`Partial<GraphConfig>\`). Every field of the source is offered in the X/Y axis pickers, so users can explore combinations without a developer pre-defining each chart.

### Use it when

- A dashboard or report needs an interactive chart over data that already lives in a \`DataVisNitroSource\`.
- Users should be able to change axes or chart type themselves (\`onConfigChange\` lets the host persist their choice).

### Don't use it when

- You need a tiny inline trend (a cell, a header strip) — use \`Sparkline\`, which takes pre-bucketed points and no peers.
- The chart is decorative and static; an image or SVG avoids loading the datavis engine.
- You need rows, not a picture — use \`DataVisNitroGrid\`.

### Example

\`\`\`tsx
<DataVisNitroSource type="http" url="/api/revenue">
  <DataVisNitroGraph
    height="360px"
    config={{ type: 'bar', x: 'region', y: 'revenue' }}
    onConfigChange={saveUserChartPrefs}
  />
</DataVisNitroSource>
\`\`\`

### Limitations

- Same accessibility caveats as the grid: the engine's SVG/DOM is not screen-reader friendly and automated a11y checks are disabled here. Pair charts with a grid or a textual summary of the numbers.
- Colours come from the DataVis scheme, which follows brand and dark mode; individual series colours are not brand tokens.
- Requires the optional peers \`@mieweb/datavis\` and \`datavis-ace\`; only available from the \`@mieweb/ui/datavis\` entry.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/datavis',
      peers: ['@mieweb/datavis', 'datavis-ace'],
      relationships: [
        {
          type: 'composes with',
          target: 'grids-datavis-nitro',
          why: 'Share one DataVisNitroSource between a grid and a graph of the same records.',
        },
        {
          type: 'alternative to',
          target: 'grids-sparkline',
          why: 'Sparkline is a dependency-free inline strip over pre-bucketed points; the graph is a full interactive chart.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DataVisNitroGraph>;

/** Revenue by region — a classic bar chart comparison. */
export const BarChart: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph
        config={{
          chartType: 'bar',
          xField: 'region',
          yFields: ['revenue'],
        }}
        height="520px"
      />
    </DataVisNitroSource>
  ),
};

/** Revenue trend over months — shows progression over time. */
export const LineChart: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph
        config={{
          chartType: 'line',
          xField: 'month',
          yFields: ['revenue', 'expenses'],
        }}
        height="520px"
      />
    </DataVisNitroSource>
  ),
};

/** Units sold over time — filled area highlights volume. */
export const AreaChart: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph
        config={{
          chartType: 'area',
          xField: 'month',
          yFields: ['units_sold'],
        }}
        height="520px"
      />
    </DataVisNitroSource>
  ),
};

/** Revenue share by product — proportional breakdown. */
export const PieChart: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph
        config={{
          chartType: 'pie',
          xField: 'product',
          yFields: ['revenue'],
        }}
        height="520px"
      />
    </DataVisNitroSource>
  ),
};

/** Revenue vs. expenses stacked by month — compare totals at a glance. */
export const StackedBar: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph
        config={{
          chartType: 'bar',
          xField: 'month',
          yFields: ['revenue', 'expenses', 'profit'],
          stacked: true,
        }}
        height="520px"
      />
    </DataVisNitroSource>
  ),
};

/** No pre-selected config — pick any chart type and axes to explore. */
export const DefaultConfig: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-graph-data.json">
      <DataVisNitroGraph height="520px" />
    </DataVisNitroSource>
  ),
};
