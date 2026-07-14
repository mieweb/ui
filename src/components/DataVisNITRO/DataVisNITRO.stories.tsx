import { useState } from 'react';
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

const EMPLOYEE_COLUMNS = [
  'id',
  'name',
  'email',
  'department',
  'status',
  'start_date',
  'manager',
];

export const DetailRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'New in `@mieweb/datavis` 1.3.0. Passing `renderDetailRow` adds a leading disclosure-toggle column to the plain table. Expanding a row inserts a full-width detail row rendered by the callback — ideal for drill-in content such as notes, documents, or summaries. The callback receives the row and can render any React content.',
      },
    },
  },
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employees"
        columns={EMPLOYEE_COLUMNS}
        height="480px"
        renderDetailRow={(row) => (
          <div className="text-sm text-gray-600 dark:text-neutral-300">
            <div className="font-medium text-gray-900 dark:text-neutral-100">
              {String(row.data.name)}
            </div>
            <p>
              {String(row.data.name)} works in {String(row.data.department)} as{' '}
              {String(row.data.status)}, reporting to {String(row.data.manager)}
              . Started on {String(row.data.start_date)}. Contact:{' '}
              {String(row.data.email)}.
            </p>
          </div>
        )}
      />
    </DataVisNitroSource>
  ),
};

export const ExpandAllDetailRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'New in `@mieweb/datavis` 1.3.0. The `detailRowsExpanded` prop drives expand-all / collapse-all across every detail row. Changing the value overrides individual toggles; leave it `undefined` for per-row control only. Here a button toggles the value so all detail rows open or close at once.',
      },
    },
  },
  render: () => {
    const AllDetailRowsDemo = () => {
      const [expanded, setExpanded] = useState(false);

      return (
        <div>
          <button
            type="button"
            className="mb-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            aria-pressed={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Collapse all details' : 'Expand all details'}
          </button>
          <DataVisNitroSource type="http" url="/sample-data.json">
            <DataVisNitroGrid
              title="Employees"
              columns={EMPLOYEE_COLUMNS}
              height="480px"
              detailRowsExpanded={expanded}
              renderDetailRow={(row) => (
                <div className="text-sm text-gray-600 dark:text-neutral-300">
                  <div className="font-medium text-gray-900 dark:text-neutral-100">
                    {String(row.data.name)}
                  </div>
                  <p>
                    {String(row.data.department)} · {String(row.data.status)} ·
                    manager {String(row.data.manager)}
                  </p>
                </div>
              )}
            />
          </DataVisNitroSource>
        </div>
      );
    };

    return <AllDetailRowsDemo />;
  },
};

export const TitleActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'New in `@mieweb/datavis` 1.3.0. The `titleActions` slot renders custom consumer actions inline in the title bar, alongside the built-in controls. Pass any React node — buttons, menus, or badges — to extend the header without replacing the toolbar.',
      },
    },
  },
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employees"
        columns={EMPLOYEE_COLUMNS}
        height="440px"
        titleActions={
          <>
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Add employee
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Export
            </button>
          </>
        }
      />
    </DataVisNitroSource>
  ),
};
