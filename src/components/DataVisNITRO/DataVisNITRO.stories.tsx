import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVisNitroGrid, DataVisNitroSource } from './DataVisNITRO';

const meta: Meta<typeof DataVisNitroGrid> = {
  title: 'Data Display/DataVis NITRO',
  component: DataVisNitroGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "React wrapper around the new datavis package. `<DataVisNitroSource>` creates a wcdatavis source/view pair and `<DataVisNitroGrid>` renders that view through DataVis NITRO's React `DataGrid` and `TableRenderer`.",
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

type Story = StoryObj<typeof DataVisNitroGrid>;

export const Default: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employees"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        height="420px"
      />
    </DataVisNitroSource>
  ),
};

export const WithControls: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employee Management"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        showControls
        height="480px"
      />
    </DataVisNitroSource>
  ),
};

export const DerivedColumns: Story = {
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Auto Derived Columns"
        showControls
        height="480px"
      />
    </DataVisNitroSource>
  ),
};
