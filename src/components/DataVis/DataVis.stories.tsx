import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataVisSource, DataVisGrid } from './DataVis';

const meta: Meta<typeof DataVisGrid> = {
  title: 'Data Display/DataVis',
  component: DataVisGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'React wrapper around the wcdatavis library. `<DataVisSource>` creates a data source and provides it to child `<DataVisGrid>` components via context.',
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
type Story = StoryObj<typeof DataVisGrid>;

/**
 * Basic grid that fetches data from an HTTP JSON source and renders all columns.
 */
export const Default: Story = {
  render: () => (
    <DataVisSource type="http" url="/sample-data.json">
      <DataVisGrid
        title="Employees"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        style={{ width: '100%', minHeight: 350 }}
      />
    </DataVisSource>
  ),
};

/**
 * Grid showing only a subset of columns.
 */
export const SubsetColumns: Story = {
  render: () => (
    <DataVisSource type="http" url="/sample-data.json">
      <DataVisGrid
        title="Employee Directory"
        columns={['name', 'department', 'status']}
        style={{ width: '100%', minHeight: 350 }}
      />
    </DataVisSource>
  ),
};

/**
 * Grid with controls visible so the user can interact with filtering,
 * grouping, and other built-in features.
 */
export const WithControls: Story = {
  render: () => (
    <DataVisSource type="http" url="/sample-data.json">
      <DataVisGrid
        title="Employee Management"
        columns={['id', 'name', 'email', 'department', 'status', 'start_date']}
        showControls
        style={{ width: '100%', minHeight: 400 }}
      />
    </DataVisSource>
  ),
};

/**
 * Multiple grids sharing the same data source. Both grids read from the same
 * `<DataVisSource>` so the data is fetched only once.
 */
export const MultipleGrids: Story = {
  render: () => (
    <DataVisSource type="http" url="/sample-data.json">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <DataVisGrid
          title="Contact Info"
          columns={['name', 'email']}
          style={{ width: '100%', minHeight: 250 }}
        />
        <DataVisGrid
          title="Department Overview"
          columns={['name', 'department', 'status']}
          style={{ width: '100%', minHeight: 250 }}
        />
      </div>
    </DataVisSource>
  ),
};
