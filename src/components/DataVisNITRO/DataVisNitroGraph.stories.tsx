import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVisNitroGraph } from './DataVisNitroGraph';
import { DataVisNitroSource } from './DataVisNITRO';

const meta: Meta<typeof DataVisNitroGraph> = {
  title: 'Components/Text & Data Display/DataVis NITRO Graph',
  component: DataVisNitroGraph,
  parameters: {
    layout: 'fullscreen',
    a11y: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Graph visualization component powered by `@mieweb/datavis`. Wraps the `GraphView` component and supports bar, line, area, and pie chart types. Use `<DataVisNitroSource>` to provide data and `<DataVisNitroGraph>` to render the chart. All fields are available in the X/Y axis dropdowns so you can freely explore different combinations.',
      },
    },
  },
  tags: ['autodocs'],
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
