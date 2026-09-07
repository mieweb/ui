import { useRef, useState, useEffect } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipboardList, Activity, Pill, Users } from 'lucide-react';
import {
  CustomizableDashboard,
  type DashboardColumns,
  type DashboardOrder,
} from './CustomizableDashboard';
import { DashboardWidget, DashboardWidgetInfo } from '../DashboardWidget';

const meta: Meta<typeof CustomizableDashboard> = {
  id: 'dashboards-customizabledashboard',
  title: 'Modules/Dashboards/CustomizableDashboard',
  component: CustomizableDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A user-arrangeable portlet grid**: pass \`columns: DashboardColumns\` (three arrays of \`{ id, node }\`) and users drag portlets within and across columns by the grip handle the component **appends into each portlet's header** (\`dragHandleSelector\`, default \`[data-slot="dashboard-widget-header"]\` — the \`DashboardWidget\` header; found via a MutationObserver so async content works; portlets with no match get a floating handle). A toolbar (\`title\`, \`toolbarSlot\` to portal it elsewhere) offers a 3 / 2 / 1 column toggle and, when \`widgets: WidgetDefinition[]\` is given, a **Customize** button that opens \`DashboardCustomizePanel\` for show/hide + reset. State is per concern, controlled or not: \`order\` / \`defaultOrder\` / \`onOrderChange\`, \`layout\` / \`defaultLayout\` / \`onLayoutChange\`, \`hiddenIds\` / \`defaultHiddenIds\` / \`onHiddenChange\`; \`storageKey\` persists all three to \`localStorage\` (\`{key}-portlet-order\`, \`-dashboard-layout\`, \`-dashboard-hidden\`, restored in a mount effect so SSR hydrates cleanly). Pure helpers are exported for host-side migrations: \`mergeColumnOrder\`, \`moveAcrossColumns\`, \`reorderOnDrop\`, \`consolidateColumns\`, \`requiredColumns\`.

### Use it when

- A home / patient-summary / reports page where each user should arrange and hide widgets and have that remembered (browser or server).
- Portlets are independent tiles (ideally \`DashboardWidget\`s) whose order carries no meaning to the app.

### Don't use it when

- The layout is fixed by design — a CSS grid of \`DashboardWidget\` / \`Card\`, or \`ReportDashboard\` for the analytics page.
- You need a flat, single-column reorder — the lighter \`useDragReorder\` hook (HTML5 DnD) instead of pulling in dnd-kit sensors.
- Widgets must resize, span columns or free-float — this is three equal columns with vertical sorting only.
- You only want the show/hide panel with your own shell — \`DashboardCustomizePanel\` standalone.

### Example

\`\`\`tsx
// server-persisted layout: controlled order + hidden ids, no storageKey
const { data: prefs } = useDashboardPrefs(userId);
const save = useMutation(saveDashboardPrefs);
const [toolbarEl, setToolbarEl] = useState<HTMLElement | null>(null);

<PageHeader title="Home" actions={<div ref={setToolbarEl} className="flex items-center gap-3" />} />
<CustomizableDashboard
  ariaLabel="Home dashboard"
  toolbarSlot={toolbarEl}
  columns={[[demographics, vitals], [encounters, meds], [quickLinks]]}
  widgets={WIDGET_CATALOG}
  order={prefs?.order ?? undefined}
  onOrderChange={(order) => save.mutate({ ...prefs, order })}
  layout={prefs?.layout ?? 3}
  onLayoutChange={(layout) => save.mutate({ ...prefs, layout })}
  hiddenIds={prefs?.hidden ?? []}
  onHiddenChange={(hidden) => save.mutate({ ...prefs, hidden })}
/>
\`\`\`

\`onOrderChange\` fires only at commit points (drop, layout consolidation), not per pixel; drop the controlled props and pass \`storageKey\` for browser-only persistence.

### Limitations

- Accessibility: grid is \`role="region"\` labelled by \`ariaLabel\` (default \`"Dashboard"\`); each column is \`role="group"\` \`"Dashboard column N"\`; the layout toggle is a \`role="radiogroup"\` of \`role="radio"\` buttons (\`aria-checked\`, \`aria-label="N column layout"\`) with **no arrow-key handling** (Tab to each). Drag handles are buttons labelled \`"Drag to reorder"\`; keyboard sorting is dnd-kit's: focus the handle, Space/Enter to lift, arrows to move, Space/Enter to drop, Escape to cancel — announcements come from dnd-kit's **default English live region** ("Picked up draggable item …"), not customised or localisable here. The handle is appended **into your header DOM** and adds layout classes to it (\`flex flex-row flex-nowrap items-center [&>:nth-child(2)]:ms-auto\`).
- Layout: the column toggle is hidden below \`md\` (\`max-md:hidden\`) and the grid is single-column there anyway. In 3-column mode at \`< lg\` the logical columns are flattened with \`display: contents\`, so **dropping into an empty column does not work** at those widths. Trailing empty columns auto-shrink the layout; gaps do not.
- Persistence: \`localStorage\` only (try/catch on failure); distinct dashboards need distinct \`storageKey\`s; ids removed from \`columns\` vanish from saved order, new ids append to their props column.
- i18n: hard-coded \`"Dashboard"\`, \`"Dashboard column N"\`, \`"Column layout"\`, \`"N column layout"\`, \`"N column(s)"\` title, \`"Drag to reorder"\`; only \`customizeLabel\` (\`"Customize"\`) and the panel's \`title\` / \`description\` are props.
- RTL: logical \`me-auto\` / \`ms-auto\` / \`end-2\`; dnd-kit transforms are physical but symmetric. Theming: semantic tokens throughout.
- Dependencies: \`@dnd-kit/core\`, \`@dnd-kit/sortable\`, \`@dnd-kit/utilities\` (regular dependencies of \`@mieweb/ui\`, not peers), \`lucide-react\` icons, \`Button\`, \`Sheet\` + \`Switch\` via the panel, \`react-dom\` \`createPortal\`. See \`MAINTAINERS.md\` in the component folder for the header contract and drag math.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'dashboards-dashboardwidget',
          why: 'DashboardWidget is the expected portlet node: its data-slot="dashboard-widget-header" is where CustomizableDashboard appends the drag handle.',
        },
        {
          type: 'contains',
          target: 'dashboards-dashboardcustomizepanel',
          why: 'When widgets is provided, the toolbar Customize button opens a DashboardCustomizePanel wired to the hidden-id state.',
        },
        {
          type: 'alternative to',
          target: 'dashboards-reportdashboard',
          why: 'CustomizableDashboard is an empty grid the user arranges; ReportDashboard is a fixed analytics page (metrics, bar chart, top lists) driven by data props.',
        },
        {
          type: 'composes with',
          target: 'layout-pageheader',
          why: 'CustomizableDashboard portals its title + layout toggle into a toolbarSlot element placed in the PageHeader actions row.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    columns: {
      description:
        'Portlets grouped into three columns — the default arrangement before user reordering.',
      control: false,
    },
    title: {
      description: 'Toolbar heading rendered before the layout toggle.',
      control: 'text',
    },
    storageKey: {
      description:
        'Base localStorage key for persisting order and layout. Omit to disable persistence.',
      control: 'text',
    },
    layout: {
      description: 'Controlled column layout mode.',
      control: 'select',
      options: [1, 2, 3],
    },
    dragHandleSelector: {
      description:
        'Selector for the header element that receives the drag handle (defaults to the DashboardWidget header slot).',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function widget(
  title: string,
  icon: ReactNode,
  items: { label: string; value: string }[]
) {
  return (
    <DashboardWidget title={title} icon={icon}>
      <DashboardWidgetInfo items={items} />
    </DashboardWidget>
  );
}

const demoColumns: DashboardColumns = [
  [
    {
      id: 'demographics',
      node: widget(
        'Demographics',
        <Users aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'Name', value: 'Hart, William' },
          { label: 'DOB', value: '1962-03-14' },
          { label: 'MRN', value: 'WC-10382' },
        ]
      ),
    },
    {
      id: 'vitals',
      node: widget(
        'Vitals',
        <Activity aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'BP', value: '124/82' },
          { label: 'Pulse', value: '68 bpm' },
        ]
      ),
    },
  ],
  [
    {
      id: 'medications',
      node: widget(
        'Medications',
        <Pill aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'Lisinopril', value: '10 mg daily' },
          { label: 'Metformin', value: '500 mg BID' },
        ]
      ),
    },
  ],
  [
    {
      id: 'orders',
      node: widget(
        'Open Orders',
        <ClipboardList aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'CBC Panel', value: 'Pending' },
          { label: 'Chest X-Ray', value: 'Scheduled' },
        ]
      ),
    },
  ],
];

export const Default: Story = {
  args: {
    columns: demoColumns,
    title: 'Patient Summary',
  },
};

export const TwoColumnLayout: Story = {
  args: {
    columns: demoColumns,
    layout: 2,
  },
};

export const Persisted: Story = {
  args: {
    columns: demoColumns,
    title: 'Home',
    storageKey: 'storybook-customizable-dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drag a portlet or change the layout, then reload the page — the arrangement is restored from localStorage.',
      },
    },
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  args: { columns: demoColumns },
  parameters: {
    docs: {
      description: {
        story:
          'Order and layout held in host state — the pattern for persisting to a server-side store.',
      },
    },
  },
};

function ControlledExample(args: ComponentProps<typeof CustomizableDashboard>) {
  const [order, setOrder] = useState<DashboardOrder>([
    ['demographics', 'vitals'],
    ['medications'],
    ['orders'],
  ]);
  const [layout, setLayout] = useState<1 | 2 | 3>(3);
  return (
    <div className="flex flex-col gap-4">
      <CustomizableDashboard
        {...args}
        order={order}
        onOrderChange={setOrder}
        layout={layout}
        onLayoutChange={setLayout}
      />
      <pre className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
        {JSON.stringify({ layout, order }, null, 2)}
      </pre>
    </div>
  );
}

export const WithWidgetCatalog: Story = {
  args: {
    columns: demoColumns,
    title: 'Patient Summary',
    widgets: [
      {
        id: 'demographics',
        title: 'Demographics',
        description: 'Patient identity and contact details',
        icon: <Users aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'vitals',
        title: 'Vitals',
        description: 'Latest recorded vital signs',
        icon: <Activity aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'medications',
        title: 'Medications',
        description: 'Active medication list',
        icon: <Pill aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'orders',
        title: 'Open Orders',
        description: 'Pending and scheduled orders',
        icon: <ClipboardList aria-hidden="true" className="h-4 w-4" />,
        category: 'Workflow',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'With a `widgets` catalog, the toolbar gains a Customize button opening the add/remove panel where widgets can be shown, hidden, and the layout reset.',
      },
    },
  },
};

export const ToolbarInPageHeader: Story = {
  render: (args) => <ToolbarSlotExample {...args} />,
  args: { columns: demoColumns },
  parameters: {
    docs: {
      description: {
        story:
          'The toolbar portaled into a host page header via `toolbarSlot`, so the layout toggle sits beside the page actions.',
      },
    },
  },
};

function ToolbarSlotExample(
  args: ComponentProps<typeof CustomizableDashboard>
) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(slotRef.current), []);
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border flex items-center justify-between border-b pb-2">
        <h1 className="text-foreground text-xl font-bold">Reports</h1>
        <div ref={slotRef} className="flex items-center" />
      </div>
      <CustomizableDashboard {...args} toolbarSlot={slot} />
    </div>
  );
}
