import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVisNitroGrid, DataVisNitroSource } from './DataVisNITRO';

const meta: Meta<typeof DataVisNitroGrid> = {
  title: 'Components/Text & Data Display/DataVis NITRO',
  component: DataVisNitroGrid,
  parameters: {
    layout: 'fullscreen',
    // DataVis NITRO is a third-party charting/grid library (datavis/wcdatavis-lib)
    // whose internal DOM renders invalid ARIA attributes, nested interactive elements,
    // and non-conforming contrast ratios that we cannot fix without upstream changes.
    a11y: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "React wrapper around the `datavis/wcdatavis-lib` package. `<DataVisNitroSource>` creates a datavis source/view pair using that library and `<DataVisNitroGrid>` renders that view through DataVis NITRO's React `DataGrid` and `TableRenderer`.",
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
        columns={[
          'id',
          'name',
          'email',
          'department',
          'status',
          'start_date',
          'manager',
        ]}
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
        columns={[
          'id',
          'name',
          'email',
          'department',
          'status',
          'start_date',
          'manager',
        ]}
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

export const MinimalMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Minimal mode hides the title bar and instead overlays a floating hamburger button on the grid (partially transparent, fully opaque on hover). Opening it reveals a menu with the title bar actions (download, copy, refresh, show controls) plus the perspective dropdown and its buttons. Ideal for compact or embedded layouts where the full header would take up too much space. Use the "show controls" action in the menu to reveal the filter/group/pivot/aggregate panels.',
      },
    },
  },
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employees"
        columns={[
          'id',
          'name',
          'email',
          'department',
          'status',
          'start_date',
          'manager',
        ]}
        minimalMode
        height="420px"
      />
    </DataVisNitroSource>
  ),
};
