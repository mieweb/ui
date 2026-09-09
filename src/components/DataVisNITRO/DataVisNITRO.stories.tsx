import { useContext, useEffect, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Pencil, Trash2 } from 'lucide-react';
import {
  GridAssistant,
  type GridAssistantColumn,
  type PrefsInstance,
} from '@mieweb/datavis';
import { Prefs } from 'datavis-ace';
import {
  DataVisNitroContext,
  DataVisNitroGrid,
  DataVisNitroLanguageSelector,
  DataVisNitroSource,
  type DataVisNitroGridProps,
} from './DataVisNITRO';

// datavis-ace is untyped JS (`Prefs` is built with a runtime `makeSubclass`
// helper), so give it an explicit constructor signature for use below.
const PrefsConstructor = Prefs as unknown as new (
  name: string,
  moduleBindings: unknown,
  opts: Record<string, unknown>
) => PrefsInstance;

const PREFS_STORAGE_KEY = 'mieweb-ui-storybook:datavis-prefs';

// Clears saved perspectives in automated runs (test runner, visual
// regression) so stories render deterministically, while keeping
// localStorage persistence for normal browsing. localStorage access
// can throw in restricted contexts, so fall back to defaults quietly.
const clearSavedPerspectives = () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) {
      window.localStorage.removeItem(PREFS_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable — the story just renders its defaults.
  }
  return {};
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

const meta: Meta<typeof DataVisNitroGrid> = {
  id: 'grids-datavis-nitro',
  title: 'Components/Grids/DataVis NITRO',
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
        component: `> **Tables and data grids start with DataVis NITRO.** Use \`Table\` only for a few static rows the user will not sort, filter, page or export. Never hand-roll grid features on a plain table; \`AGGrid\` is deprecated.

Source: [mieweb/datavis](https://github.com/mieweb/datavis) (\`@mieweb/datavis\`), built on the [mieweb/wcdatavis](https://github.com/mieweb/wcdatavis) DataVis ACE engine (\`datavis-ace\`).

### What it's for

Browsing, sorting, filtering, grouping and exporting record sets without writing grid logic. \`<DataVisNitroSource>\` creates a datavis source/view pair (HTTP, local array or file) and \`<DataVisNitroGrid>\` renders that view through DataVis NITRO's React \`DataGrid\`. Column menus, pinned columns, aggregates and saved perspectives come from the engine, so a product gets the same grid behaviour everywhere.

### Use it when

- Users need to browse or work with records: any list that may grow, be sorted, filtered or exported.
- You would otherwise hand-roll sorting, filtering or column menus on top of a plain \`<table>\`.
- Row actions are needed: render a \`RowActionToolbar\` with \`group="grid"\` from \`formatCell\`.

### Don't use it when

- The data is a handful of static rows shown for reading (a summary block, a definition list) — use \`Table\`.
- You need a chart rather than rows — use \`DataVisNitroGraph\` on the same source, or \`Sparkline\` for an inline strip.
- The consumer cannot take the optional peers (\`@mieweb/datavis\`, \`datavis-ace\`); keep it behind the \`@mieweb/ui/datavis\` entry so apps that never show a grid do not pay for it.

### Example

\`\`\`tsx
import { DataVisNitroGrid, DataVisNitroSource } from '@mieweb/ui/datavis';

<DataVisNitroSource type="http" url="/api/employees">
  <DataVisNitroGrid
    columns={['name', 'department', 'status']}
    onRowClick={(row) => openEmployee(row.id)}
  />
</DataVisNitroSource>
\`\`\`

The source owns the data lifecycle; the grid is presentational. Keep application state (selected id, route) in the host and react to \`onRowClick\` / \`onSelectionChange\`.

### Limitations

- **Accessibility:** the engine's DOM emits invalid ARIA attributes, nested interactive elements and some non-conforming contrast; automated a11y checks are disabled for this page. Provide a keyboard-reachable alternative for critical actions until upstream fixes land.
- **Theming:** the grid follows the active brand and dark mode through the DataVis colour scheme; per-cell styling goes through \`formatCell\`.
- **\`formatCell\` must return the value itself for columns it does not handle** — returning \`undefined\` blanks the cell.
- Saved perspectives persist in \`localStorage\` only on trusted workstations; public kiosks keep them in memory until refresh.
- Renders inline (no portal); the host controls height and scrolling.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/datavis',
      peers: ['@mieweb/datavis', 'datavis-ace'],
      relationships: [
        {
          type: 'alternative to',
          target: 'grids-table',
          why: 'Table is for a few static rows; NITRO whenever users browse, sort, filter or export records.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-webchartreportviewer',
          why: 'NITRO is the interactive grid for sorting, grouping and pivoting a dataset; WebChartReportViewer picks a backend-run report and shows its rows in a static Table.',
        },
        {
          type: 'composes with',
          target: 'grids-datavis-nitro-graph',
          why: 'Both render the same DataVisNitroSource; switch between rows and a chart without refetching.',
        },
        {
          type: 'composes with',
          target: 'actions-rowactiontoolbar',
          why: 'Render per-row actions inside a grid cell with group="grid" so they reveal on row hover.',
        },
        {
          type: 'composes with',
          target: 'data-display-filtersummarybar',
          why: 'FilterSummaryBar above the grid shows filtered-of-total counts for host-side filters and search, with one Clear all.',
        },
        {
          type: 'supersedes',
          target: 'deprecated-aggrid',
          why: 'AGGrid is deprecated; NITRO ships brand theming and perspectives without the ag-grid peers.',
        },
        {
          type: 'supersedes',
          target: 'deprecated-aggrid-enhanced',
          why: 'The enhanced cell renderers are covered by formatCell and the engine column types.',
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

type Story = StoryObj<typeof DataVisNitroGrid>;

type DefaultArgs = DataVisNitroGridProps & {
  perspectives?: boolean;
};

export const Default: StoryObj<DefaultArgs> = {
  args: {
    perspectives: true,
  },
  argTypes: {
    perspectives: {
      control: 'boolean',
      description:
        'Enable the perspective variant: binds a `Prefs` module so the "Main Perspective" toolbar renders. Persistence follows the public kiosk / trusted workstation toolbar setting. See the With Perspectives story for details.',
    },
  },
  loaders: [clearSavedPerspectives],
  render: ({ perspectives }, { globals }) => {
    const grid = {
      title: 'Employees',
      columns: EMPLOYEE_COLUMNS,
      height: '420px',
    };
    return (
      <DataVisNitroSource type="http" url="/sample-data.json">
        {perspectives ? (
          <PerspectivesGrid
            {...grid}
            trustedDevice={globals.device === 'trusted'}
          />
        ) : (
          <DataVisNitroGrid {...grid} />
        )}
      </DataVisNitroSource>
    );
  },
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
        mode="full"
        showControls
        debug
        height="480px"
        features={{
          columnResize: true,
          columnReorder: true,
          stickyHeaders: true,
          zebraStripe: true,
          keyboardNav: true,
          headerContextMenu: true,
        }}
      />
    </DataVisNitroSource>
  ),
};

export const LocalizedGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The public `DataVisNitroLanguageSelector` exposes the same locale picker as the standalone demo. Its selected locale updates translated DataVis labels, while the grid `locale` prop localizes date, number, and currency formatting.',
      },
    },
  },
  render: () => {
    const LocalizedGridDemo = () => {
      const [locale, setLocale] = useState('es-MX');

      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <DataVisNitroLanguageSelector
              value={locale}
              onLanguageChange={setLocale}
              className="w-56"
            />
          </div>
          <DataVisNitroSource type="http" url="/sample-data.json">
            <DataVisNitroGrid
              title="Directorio de empleados"
              columns={EMPLOYEE_COLUMNS}
              locale={locale}
              mode="full"
              showControls
              height="480px"
            />
          </DataVisNitroSource>
        </div>
      );
    };

    return <LocalizedGridDemo />;
  },
};

export const Operations: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Passing an `operations` array surfaces the operations palette in the controls region. Each entry has a `label`, optional `icon` and `category`, and a `callback` that receives the current selection context (`ctx.rows`). Use it to wire row actions such as edit, delete, or export.',
      },
    },
  },
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <DataVisNitroGrid
        title="Employees"
        columns={EMPLOYEE_COLUMNS}
        height="420px"
        mode="full"
        showControls
        operations={[
          {
            label: 'Edit',
            category: 'Actions',
            icon: <Pencil className="h-4 w-4" />,
            callback: (ctx) => window.alert(`Edit ${ctx.rows.length} row(s)`),
          },
          {
            label: 'Delete',
            category: 'Actions',
            icon: <Trash2 className="h-4 w-4" />,
            callback: (ctx) => window.alert(`Delete ${ctx.rows.length} row(s)`),
          },
          {
            label: 'Export',
            category: 'Export',
            icon: <Download className="h-4 w-4" />,
            callback: () => window.alert('Exporting…'),
          },
        ]}
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

const ASSISTANT_COLUMNS: GridAssistantColumn[] = EMPLOYEE_COLUMNS.map(
  (field) => ({
    field,
    header: field,
    type: field === 'id' ? 'number' : 'string',
  })
);

/** Reads the shared view from DataVisNitroContext and connects the assistant to it. */
const ConnectedGridAssistant = () => {
  const view = useContext(DataVisNitroContext);
  if (!view) return null;

  return (
    <GridAssistant
      view={view}
      columns={ASSISTANT_COLUMNS}
      height="480px"
      className="self-start"
    />
  );
};

export const OzwellAssistant: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'New in `@mieweb/datavis` 1.6.0. `<GridAssistant>` is a "Hey Ozwell" chat panel that controls the grid in natural language — sorting, filtering, grouping, pivoting, aggregates, global search, and perspectives — and answers questions about the data ("how many rows are there?", "what is the average of X for department Y?") with exact results computed from the visible rows. It shares the view from `<DataVisNitroSource>` via `DataVisNitroContext`. Requires an Ozwell backend: set `window.__ozwell = { apiKey: "…", baseURL: "…" }` (or `localStorage["ozwellConfig"]`) in the browser console before chatting.',
      },
    },
  },
  render: () => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 24rem',
          gap: '1rem',
        }}
      >
        <DataVisNitroGrid
          title="Employees"
          columns={EMPLOYEE_COLUMNS}
          showControls
          height="480px"
        />
        <ConnectedGridAssistant />
      </div>
    </DataVisNitroSource>
  ),
};

/**
 * Reads the shared view from DataVisNitroContext, binds a Prefs module to it,
 * and passes the module to the grid so the perspective toolbar ("Main
 * Perspective" dropdown, save/reset/history buttons) renders.
 */
const PerspectivesGrid = ({
  trustedDevice,
  ...props
}: DataVisNitroGridProps & { trustedDevice: boolean }) => {
  const view = useContext(DataVisNitroContext);

  const prefs = useMemo(() => {
    if (!view) return null;

    return new PrefsConstructor('mieweb-ui-storybook:employees', null, {
      autoSave: true,
      backend: trustedDevice
        ? {
            type: 'localStorage',
            localStorage: {
              key: PREFS_STORAGE_KEY,
            },
          }
        : { type: 'temporary' },
    });
  }, [view, trustedDevice]);

  useEffect(() => {
    if (!view || !prefs) return;
    view.setPrefs(prefs);
    prefs.prime?.();
  }, [view, prefs]);

  if (!prefs) return null;

  return <DataVisNitroGrid {...props} prefs={prefs} />;
};

export const WithPerspectives: Story = {
  loaders: [clearSavedPerspectives],
  parameters: {
    docs: {
      description: {
        story:
          'Passing a `prefs` module (a `PrefsInstance` from `datavis-ace`) enables the perspective toolbar: the "Main Perspective" dropdown, save / save-as / reset buttons, and undo/redo history. Perspectives capture the grid configuration (sort, filter, group, pivot, aggregate, column layout). The device toolbar controls persistence: trusted workstations save to `localStorage`, while public kiosks keep perspectives in memory only and discard them on refresh. Create the `Prefs` instance, bind it to the shared view with `view.setPrefs(prefs)`, and pass it to `<DataVisNitroGrid prefs={…}>`. In minimal mode the same toolbar appears inside the hamburger menu.',
      },
    },
  },
  render: (_args, { globals }) => (
    <DataVisNitroSource type="http" url="/sample-data.json">
      <PerspectivesGrid
        title="Employees"
        columns={EMPLOYEE_COLUMNS}
        showControls
        height="480px"
        trustedDevice={globals.device === 'trusted'}
      />
    </DataVisNitroSource>
  ),
};
