import type { Meta, StoryObj } from '@storybook/react-vite';
import { WCDVSOURCE, WCDVGRID } from './WCDataVis';

const meta: Meta<typeof WCDVGRID> = {
  title: 'Data Display/WC DataVis',
  component: WCDVGRID,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'React wrapper around the wcdatavis library. `<WCDVSOURCE>` creates a data source and provides it to child `<WCDVGRID>` components via context.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem', minHeight: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WCDVGRID>;

/**
 * Basic grid that fetches data from an HTTP JSON source and renders all columns.
 */
export const Default: Story = {
  render: () => (
    <WCDVSOURCE type="http" url="/sample-data.json">
      <WCDVGRID
        title="Employees"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        style={{ width: '100%', minHeight: 350 }}
      />
    </WCDVSOURCE>
  ),
};

/**
 * Grid showing only a subset of columns.
 */
export const SubsetColumns: Story = {
  render: () => (
    <WCDVSOURCE type="http" url="/sample-data.json">
      <WCDVGRID
        title="Employee Directory"
        columns={['name', 'department', 'status']}
        style={{ width: '100%', minHeight: 350 }}
      />
    </WCDVSOURCE>
  ),
};

/**
 * Grid with controls visible so the user can interact with filtering,
 * grouping, and other built-in features.
 */
export const WithControls: Story = {
  render: () => (
    <WCDVSOURCE type="http" url="/sample-data.json">
      <WCDVGRID
        title="Employee Management"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        showControls
        style={{ width: '100%', minHeight: 400 }}
      />
    </WCDVSOURCE>
  ),
};

/**
 * Multiple grids sharing the same data source. Both grids read from the same
 * `<WCDVSOURCE>` so the data is fetched only once.
 */
export const MultipleGrids: Story = {
  render: () => (
    <WCDVSOURCE type="http" url="/sample-data.json">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <WCDVGRID
          title="Contact Info"
          columns={['name', 'email']}
          style={{ width: '100%', minHeight: 250 }}
        />
        <WCDVGRID
          title="Department Overview"
          columns={['name', 'department', 'status']}
          style={{ width: '100%', minHeight: 250 }}
        />
      </div>
    </WCDVSOURCE>
  ),
};
