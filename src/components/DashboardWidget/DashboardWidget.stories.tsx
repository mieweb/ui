import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import {
  DashboardWidget,
  DashboardWidgetInfo,
  DashboardWidgetTable,
  DashboardWidgetActions,
  DashboardWidgetDataCards,
} from './DashboardWidget';
import { Badge } from '../Badge';
import {
  UserIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  AlertTriangleIcon,
  PillIcon,
  ClipboardListIcon,
  ZapIcon,
  StethoscopeIcon,
  HeartPulseIcon,
} from '../Icons';
import { Printer } from 'lucide-react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof DashboardWidget> = {
  id: 'dashboards-dashboardwidget',
  title: 'Modules/Dashboards/DashboardWidget',
  component: DashboardWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**The portlet tile of a dashboard**: a \`Card\` (\`padding="none"\`) with a fixed header — \`icon\`, upper-case \`title\` in a \`headingLevel\` heading (default \`h3\`), \`count\` pill, and either a ghost "+" button (\`onAdd\`, \`addLabel\`) or your own \`headerAction\` — a body for \`children\`, optional \`footer\`, \`loading\` overlay and \`accent\` bar. Four body components for the common widget shapes: \`DashboardWidgetInfo\` (\`<dl>\` label/value grid, \`items\`, \`columns\` 1–4, \`layout\` \`stacked\` | \`inline\`), \`DashboardWidgetTable\` (generic \`columns\` / \`data\` / row \`actions\` overflow menu, \`showHeader\`, \`onRowClick\`, \`emptyMessage\`, \`rowKey\`), \`DashboardWidgetActions\` (\`actions\` grid of shortcut buttons/links, \`columns\` 1–3, per-item \`color\`) and \`DashboardWidgetDataCards\` (\`<dl>\` stat blocks with \`unit\`, \`columns\` 2–4, \`footer\`). The header carries \`data-slot="dashboard-widget-header"\`, which \`CustomizableDashboard\` uses to attach its drag handle.

### Use it when

- A home / patient-summary / reports page is a grid of same-looking tiles, each titled, countable and optionally addable.
- The tile's content is one of: a fact sheet (Info), a short list with row actions (Table), a shortcut grid (Actions) or vitals-style metrics (DataCards).

### Don't use it when

- The surface needs free-form layout, media or selection states — \`Card\` and its slots.
- You want a plain list of links with a title — \`QuickLinksCard\`; large explained shortcut tiles outside a widget — \`QuickAction\`.
- The list is long, sortable, filterable or paginated — \`Table\` / \`DataVisNitroGrid\` in a \`Card\`; \`DashboardWidgetTable\` is a static slice.
- The whole page is a fixed report layout — \`ReportDashboard\`.

### Example

\`\`\`tsx
const { data: allergies = [], isLoading } = useAllergies(patientId);

<DashboardWidget
  title="Allergies"
  icon={<AlertTriangleIcon className="h-4 w-4" />}
  count={allergies.length}
  loading={isLoading}
  accent="warning"
  onAdd={() => openAllergyForm()}
  addLabel="Add allergy"
  headingLevel="h2"
>
  <DashboardWidgetTable<Allergy>
    columns={[
      { key: 'name' },
      { key: 'severity', align: 'right', render: (r) => <Badge size="sm" variant={severityVariant(r.severity)}>{r.severity}</Badge> },
    ]}
    data={allergies}
    rowKey={(r) => r.id}
    actions={[
      { label: 'Edit', icon: <PencilIcon />, onClick: (r) => openAllergyForm(r) },
      { label: 'Delete', icon: <TrashIcon />, variant: 'danger', onClick: (r) => remove(r.id) },
    ]}
    emptyMessage="No known allergies"
  />
</DashboardWidget>
\`\`\`

Data and mutations live in the host; the widget only renders the slice it is given.

### Limitations

- Accessibility: the title heading level is yours (\`headingLevel\`); \`count\` is a bare \`<span>\` with no label ("3" is read without context). The add button gets \`aria-label={addLabel}\` (default \`"Add"\`). \`DashboardWidgetTable\` rows with \`onRowClick\` are clickable \`<tr>\`s with **no keyboard handler, role or tabIndex**; the row overflow menu is a button with \`aria-haspopup="menu"\` / \`aria-expanded\` and a portalled \`role="menu"\` of \`role="menuitem"\` buttons that closes on Escape and outside click but has **no arrow-key navigation or focus management**. \`DashboardWidgetActions\` items are native \`<button>\` / \`<a>\`; disabled ones use \`pointer-events-none\` (links stay focusable). \`DashboardWidgetInfo\` / \`DataCards\` use \`<dl>\` semantics correctly.
- No overflow / \`size\` behaviour: \`size\` (\`sm\` … \`full\`) exists on \`widgetVariants\` but every value maps to an empty class. Body has no max height or scroll — wrap children in \`ScrollArea\`.
- i18n: defaults \`"Add"\`, \`"No items"\`, \`"Actions"\` (sr-only header), \`"Row actions for row N"\`. No number formatting on \`count\`.
- RTL: header/body/footer use physical \`pl-6\` with \`accent\` (the Card's own accent is logical \`ps-4\`); table alignment uses physical \`text-right\`; the row menu is positioned from \`rect.right\` with \`translateX(-100%)\`; DataCards \`unit\` uses \`ml-0.5\`. \`DashboardWidgetTable\` bleeds with \`-mx-4\` assuming the default body padding.
- Theming: header/body use semantic tokens; the count pill and \`DashboardWidgetActions\` colours are fixed palettes (\`primary-*\`, \`emerald\`, \`sky\`, \`violet\`, …); the row menu uses hard-coded \`neutral-*\` / \`bg-white\` / \`red-*\`. Uses \`Card\`, \`Button\`, \`Table\` and \`MoreHorizontalIcon\` (lucide via \`Icons\`); depends on \`class-variance-authority\` and \`react-dom\` \`createPortal\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-card',
          why: 'Card is the free-form surface you lay out yourself; DashboardWidget is a Card with a fixed title bar, count badge and add button for portlet grids.',
        },
        {
          type: 'composes with',
          target: 'dashboards-customizabledashboard',
          why: 'DashboardWidget is the expected portlet node: its data-slot="dashboard-widget-header" is where CustomizableDashboard appends the drag handle.',
        },
        {
          type: 'alternative to',
          target: 'dashboards-quicklinkscard',
          why: 'DashboardWidgetActions is a coloured shortcut grid inside a widget; QuickLinksCard is a standalone Card listing plain link rows with badges.',
        },
        {
          type: 'uses',
          target: 'grids-table',
          why: 'DashboardWidgetTable renders through the Table primitives (responsive wrapper, header, rows).',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    title: { control: 'text' },
    count: { control: 'number' },
    loading: { control: 'boolean' },
    accent: {
      control: 'select',
      options: [
        undefined,
        'primary',
        'success',
        'warning',
        'destructive',
        'info',
      ],
    },
  },
};

export default meta;

const widgetDecorator: Decorator[] = [
  (Story) => (
    <div className="w-[420px]">
      <Story />
    </div>
  ),
];

type Story = StoryObj<typeof DashboardWidget>;

// =============================================================================
// Helpers — mock data
// =============================================================================

const noop = () => {};

// -- Demographics
const demographicItems = [
  { label: 'Name', value: 'Hart, William' },
  { label: 'DOB', value: '1948-04-03 (77 y/o)' },
  { label: 'Gender', value: 'male' },
  {
    label: 'MRN',
    value: (
      <span className="border-border inline-flex rounded border px-1.5 py-0.5 font-mono text-xs">
        MRN-000001
      </span>
    ),
  },
  { label: 'Phone', value: '555-867-5309' },
  { label: 'Email', value: 'whart@example.com' },
  {
    label: 'Address',
    value: (
      <>
        123 Main St
        <br />
        Fort Wayne, IN 46802
      </>
    ),
    fullWidth: true,
  },
];

// -- Encounters
type Encounter = {
  date: string;
  type: string;
  provider: string;
  status: string;
};

const encounterData: Encounter[] = [
  {
    date: '2025-12-15',
    type: 'office-visit',
    provider: 'Dr. Sarah Chen',
    status: 'completed',
  },
  {
    date: '2025-09-10',
    type: 'office-visit',
    provider: 'Dr. Sarah Chen',
    status: 'completed',
  },
  {
    date: '2025-06-02',
    type: 'office-visit',
    provider: 'Dr. Sarah Chen',
    status: 'completed',
  },
];

// -- Allergies
type Allergy = {
  allergen: string;
  reaction: string;
  severity: string;
};

const allergyData: Allergy[] = [
  { allergen: 'Penicillin', reaction: 'Hives', severity: 'moderate' },
  { allergen: 'Sulfa Drugs', reaction: 'Rash', severity: 'mild' },
];

// -- Medications
type Medication = {
  name: string;
  details: string;
};

const medicationData: Medication[] = [
  { name: 'Lisinopril', details: '10 mg oral, Once daily' },
  { name: 'Atorvastatin', details: '20 mg oral, Once daily at bedtime' },
  { name: 'Metformin', details: '500 mg oral, Twice daily' },
];

// -- Medical History
type Condition = {
  name: string;
  code: string;
  status: string;
};

const conditionData: Condition[] = [
  { name: 'Essential Hypertension', code: 'I10', status: 'active' },
  { name: 'Type 2 Diabetes Mellitus', code: 'E11.9', status: 'active' },
  { name: 'Hyperlipidemia', code: 'E78.5', status: 'active' },
];

// -- Vitals
const vitalItems = [
  { label: 'BP', value: '128/82' },
  { label: 'Pulse', value: '72' },
  { label: 'Temp', value: '98.6', unit: '°F' },
  { label: 'Resp', value: '16' },
  { label: 'HT', value: '70', unit: '"' },
  { label: 'WT', value: '195', unit: 'lbs' },
  { label: 'BMI', value: '28' },
  { label: 'O₂ Sat', value: '97', unit: '%' },
];

// -- Quick Links
const quickLinkActions = [
  {
    label: 'Add Encounter',
    icon: <CalendarIcon className="h-3.5 w-3.5" />,
    color: 'primary' as const,
    onClick: noop,
  },
  {
    label: 'Record Vitals',
    icon: <HeartPulseIcon className="h-3.5 w-3.5" />,
    color: 'red' as const,
    onClick: noop,
  },
  {
    label: 'Add Allergy',
    icon: <AlertTriangleIcon className="h-3.5 w-3.5" />,
    color: 'orange' as const,
    onClick: noop,
  },
  {
    label: 'Add Medication',
    icon: <PillIcon className="h-3.5 w-3.5" />,
    color: 'amber' as const,
    onClick: noop,
  },
  {
    label: 'Add Condition',
    icon: <StethoscopeIcon className="h-3.5 w-3.5" />,
    color: 'green' as const,
    onClick: noop,
  },
  {
    label: 'Print Chart',
    icon: <Printer className="h-3.5 w-3.5" />,
    color: 'neutral' as const,
    onClick: noop,
  },
];

// =============================================================================
// Stories — Playground with variant control
// =============================================================================

const variantMap = {
  info: {
    title: 'Demographics',
    icon: <UserIcon className="h-4 w-4" />,
    body: <DashboardWidgetInfo columns={2} items={demographicItems} />,
  },
  table: {
    title: 'Encounters',
    icon: <CalendarIcon className="h-4 w-4" />,
    count: encounterData.length,
    body: (
      <DashboardWidgetTable<Encounter>
        columns={[
          {
            key: 'date',
            render: (row: Encounter) => (
              <div>
                <span className="font-medium">{row.date}</span>
                <span className="text-muted-foreground"> — {row.type}</span>
                <div className="text-muted-foreground text-xs">
                  ({row.provider})
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            align: 'right' as const,
            render: (row: Encounter) => (
              <Badge variant="success" size="sm">
                {row.status}
              </Badge>
            ),
          },
        ]}
        data={encounterData}
        actions={[
          {
            label: 'Edit',
            icon: <PencilIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
          {
            label: 'Delete',
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
        ]}
      />
    ),
  },
  actions: {
    title: 'Quick Links',
    icon: <ZapIcon className="h-4 w-4" />,
    body: <DashboardWidgetActions columns={2} actions={quickLinkActions} />,
  },
  'data-cards': {
    title: 'Vitals',
    icon: <HeartIcon className="h-4 w-4" />,
    count: vitalItems.length,
    body: (
      <DashboardWidgetDataCards
        columns={2}
        items={vitalItems}
        footer={
          <>
            <span>Date: 2025-12-15</span>
            <button
              type="button"
              className="hover:bg-muted rounded p-0.5 transition-colors"
              aria-label="Delete vitals record"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />
    ),
  },
} as const;

type VariantKey = keyof typeof variantMap;

/**
 * Interactive playground — use the **variant** control to switch between
 * `info`, `table`, `actions`, and `data-cards`.
 */
export const Playground: Story = {
  decorators: widgetDecorator,
  args: {
    title: 'Widget Title',
    loading: false,
    accent: undefined,
  },
  argTypes: {
    // extra arg not on DashboardWidgetProps — we cast below
    ...({
      variant: {
        control: 'select',
        options: ['info', 'table', 'actions', 'data-cards'],
        description: 'Which widget body variant to render',
        defaultValue: 'info',
      },
    } as Record<string, unknown>),
  },
  render: (args) => {
    const key = ((args as unknown as Record<string, unknown>).variant ??
      'info') as VariantKey;
    const preset = variantMap[key];

    return (
      <DashboardWidget
        title={args.title ?? preset.title}
        icon={preset.icon}
        count={'count' in preset ? preset.count : args.count}
        loading={args.loading}
        accent={args.accent}
        onAdd={key !== 'actions' && key !== 'info' ? noop : undefined}
      >
        {preset.body}
      </DashboardWidget>
    );
  },
};

// =============================================================================
// Stories — Individual Variants
// =============================================================================

/**
 * Info variant — static label/value pairs for demographics-style data.
 */
export const Info: Story = {
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Demographics"
      icon={<UserIcon className="h-4 w-4" />}
      headerAction={
        <button
          type="button"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
          aria-label="Edit demographics"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      }
    >
      <DashboardWidgetInfo columns={2} items={demographicItems} />
    </DashboardWidget>
  ),
};

/**
 * Table variant — list of encounters with status badges and row actions.
 */
export const TableList: Story = {
  name: 'Table (Encounters)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Encounters"
      icon={<CalendarIcon className="h-4 w-4" />}
      count={encounterData.length}
      onAdd={noop}
      addLabel="Add encounter"
    >
      <DashboardWidgetTable<Encounter>
        columns={[
          {
            key: 'date',
            render: (row) => (
              <div>
                <span className="font-medium">{row.date}</span>
                <span className="text-muted-foreground"> — {row.type}</span>
                <div className="text-muted-foreground text-xs">
                  ({row.provider})
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            align: 'right',
            render: (row) => (
              <Badge variant="success" size="sm">
                {row.status}
              </Badge>
            ),
          },
        ]}
        data={encounterData}
        actions={[
          {
            label: 'Edit',
            icon: <PencilIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
          {
            label: 'Delete',
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
        ]}
      />
    </DashboardWidget>
  ),
};

/**
 * Table variant — allergies with severity badges.
 */
export const AllergyList: Story = {
  name: 'Table (Allergies)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Allergies"
      icon={<AlertTriangleIcon className="h-4 w-4" />}
      count={allergyData.length}
      onAdd={noop}
    >
      <DashboardWidgetTable<Allergy>
        columns={[
          {
            key: 'allergen',
            render: (row) => (
              <span>
                <span className="font-medium">{row.allergen}</span>
                <span className="text-muted-foreground"> — {row.reaction}</span>
              </span>
            ),
          },
          {
            key: 'severity',
            align: 'right',
            render: (row) => (
              <Badge
                variant={row.severity === 'moderate' ? 'warning' : 'secondary'}
                size="sm"
              >
                {row.severity}
              </Badge>
            ),
          },
        ]}
        data={allergyData}
        actions={[
          {
            label: 'Edit',
            icon: <PencilIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
          {
            label: 'Delete',
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
        ]}
      />
    </DashboardWidget>
  ),
};

/**
 * Table variant — medications list.
 */
export const MedicationList: Story = {
  name: 'Table (Medications)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Medications"
      icon={<PillIcon className="h-4 w-4" />}
      count={medicationData.length}
      onAdd={noop}
    >
      <DashboardWidgetTable<Medication>
        columns={[
          {
            key: 'name',
            render: (row) => (
              <span>
                <span className="font-medium">{row.name}</span>{' '}
                <span className="text-muted-foreground">{row.details}</span>
              </span>
            ),
          },
        ]}
        data={medicationData}
        actions={[
          {
            label: 'Edit',
            icon: <PencilIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
          {
            label: 'Delete',
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
        ]}
      />
    </DashboardWidget>
  ),
};

/**
 * Table variant — medical history with condition codes and status badges.
 */
export const MedicalHistory: Story = {
  name: 'Table (Medical History)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Medical History"
      icon={<ClipboardListIcon className="h-4 w-4" />}
      count={conditionData.length}
      onAdd={noop}
    >
      <DashboardWidgetTable<Condition>
        columns={[
          {
            key: 'name',
            render: (row) => (
              <span>
                <span className="font-medium">{row.name}</span>{' '}
                <span className="text-muted-foreground">({row.code})</span>
              </span>
            ),
          },
          {
            key: 'status',
            align: 'right',
            render: (row) => (
              <Badge variant="success" size="sm">
                {row.status}
              </Badge>
            ),
          },
        ]}
        data={conditionData}
        actions={[
          {
            label: 'Edit',
            icon: <PencilIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
          {
            label: 'Delete',
            icon: <TrashIcon className="h-3.5 w-3.5" />,
            onClick: noop,
          },
        ]}
      />
    </DashboardWidget>
  ),
};

/**
 * Actions variant — grid of quick-link action buttons.
 */
export const Actions: Story = {
  name: 'Actions (Quick Links)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget title="Quick Links" icon={<ZapIcon className="h-4 w-4" />}>
      <DashboardWidgetActions columns={2} actions={quickLinkActions} />
    </DashboardWidget>
  ),
};

/**
 * DataCards variant — key/value stat blocks for vitals-style data.
 */
export const DataCards: Story = {
  name: 'Data Cards (Vitals)',
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Vitals"
      icon={<HeartIcon className="h-4 w-4" />}
      count={vitalItems.length}
      onAdd={noop}
    >
      <DashboardWidgetDataCards
        columns={2}
        items={vitalItems}
        footer={
          <>
            <span>Date: 2025-12-15</span>
            <button
              type="button"
              className="hover:bg-muted rounded p-0.5 transition-colors"
              aria-label="Delete vitals record"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />
    </DashboardWidget>
  ),
};

/**
 * Loading state — shows the Card loading overlay.
 */
export const Loading: Story = {
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Encounters"
      icon={<CalendarIcon className="h-4 w-4" />}
      count={3}
      loading
    >
      <DashboardWidgetTable<Encounter>
        columns={[{ key: 'date' }, { key: 'status', align: 'right' }]}
        data={encounterData}
      />
    </DashboardWidget>
  ),
};

/**
 * Empty state — table with no data.
 */
export const Empty: Story = {
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Allergies"
      icon={<AlertTriangleIcon className="h-4 w-4" />}
      count={0}
      onAdd={noop}
    >
      <DashboardWidgetTable
        columns={[{ key: 'name' }]}
        data={[]}
        emptyMessage="No known allergies"
      />
    </DashboardWidget>
  ),
};

/**
 * With accent — a widget with a left-side accent color bar.
 */
export const WithAccent: Story = {
  decorators: widgetDecorator,
  render: () => (
    <DashboardWidget
      title="Vitals"
      icon={<HeartIcon className="h-4 w-4" />}
      accent="destructive"
      count={vitalItems.length}
    >
      <DashboardWidgetDataCards columns={2} items={vitalItems} />
    </DashboardWidget>
  ),
};

// =============================================================================
// Full Dashboard Composition
// =============================================================================

/**
 * A full patient summary dashboard composed from all widget variants,
 * matching the layout in the reference screenshot.
 */
export const FullDashboard: Story = {
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-[1100px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Column 1 — Demographics */}
      <div className="space-y-4">
        <DashboardWidget
          title="Demographics"
          icon={<UserIcon className="h-4 w-4" />}
          headerAction={
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
              aria-label="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          }
        >
          <DashboardWidgetInfo columns={2} items={demographicItems} />
        </DashboardWidget>
      </div>

      {/* Column 2 — Encounters + Vitals */}
      <div className="space-y-4">
        <DashboardWidget
          title="Encounters"
          icon={<CalendarIcon className="h-4 w-4" />}
          count={encounterData.length}
          onAdd={noop}
        >
          <DashboardWidgetTable<Encounter>
            columns={[
              {
                key: 'date',
                render: (row) => (
                  <div>
                    <span className="font-medium">{row.date}</span>
                    <span className="text-muted-foreground"> — {row.type}</span>
                    <div className="text-muted-foreground text-xs">
                      ({row.provider})
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                align: 'right',
                render: (row) => (
                  <Badge variant="success" size="sm">
                    {row.status}
                  </Badge>
                ),
              },
            ]}
            data={encounterData}
            actions={[
              {
                label: 'Edit',
                icon: <PencilIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
              {
                label: 'Delete',
                icon: <TrashIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
            ]}
          />
        </DashboardWidget>

        <DashboardWidget
          title="Vitals"
          icon={<HeartIcon className="h-4 w-4" />}
          count={vitalItems.length}
          onAdd={noop}
        >
          <DashboardWidgetDataCards
            columns={2}
            items={vitalItems}
            footer={
              <>
                <span>Date: 2025-12-15</span>
                <button
                  type="button"
                  className="hover:bg-muted rounded p-0.5 transition-colors"
                  aria-label="Delete"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </>
            }
          />
        </DashboardWidget>
      </div>

      {/* Column 3 — Quick Links, Allergies, Medications, Medical History */}
      <div className="space-y-4">
        <DashboardWidget
          title="Quick Links"
          icon={<ZapIcon className="h-4 w-4" />}
        >
          <DashboardWidgetActions columns={2} actions={quickLinkActions} />
        </DashboardWidget>

        <DashboardWidget
          title="Allergies"
          icon={<AlertTriangleIcon className="h-4 w-4" />}
          count={allergyData.length}
          onAdd={noop}
        >
          <DashboardWidgetTable<Allergy>
            columns={[
              {
                key: 'allergen',
                render: (row) => (
                  <span>
                    <span className="font-medium">{row.allergen}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {row.reaction}
                    </span>
                  </span>
                ),
              },
              {
                key: 'severity',
                align: 'right',
                render: (row) => (
                  <Badge
                    variant={
                      row.severity === 'moderate' ? 'warning' : 'secondary'
                    }
                    size="sm"
                  >
                    {row.severity}
                  </Badge>
                ),
              },
            ]}
            data={allergyData}
            actions={[
              {
                label: 'Edit',
                icon: <PencilIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
              {
                label: 'Delete',
                icon: <TrashIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
            ]}
          />
        </DashboardWidget>

        <DashboardWidget
          title="Medications"
          icon={<PillIcon className="h-4 w-4" />}
          count={medicationData.length}
          onAdd={noop}
        >
          <DashboardWidgetTable<Medication>
            columns={[
              {
                key: 'name',
                render: (row) => (
                  <span>
                    <span className="font-medium">{row.name}</span>{' '}
                    <span className="text-muted-foreground">{row.details}</span>
                  </span>
                ),
              },
            ]}
            data={medicationData}
            actions={[
              {
                label: 'Edit',
                icon: <PencilIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
              {
                label: 'Delete',
                icon: <TrashIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
            ]}
          />
        </DashboardWidget>

        <DashboardWidget
          title="Medical History"
          icon={<ClipboardListIcon className="h-4 w-4" />}
          count={conditionData.length}
          onAdd={noop}
        >
          <DashboardWidgetTable<Condition>
            columns={[
              {
                key: 'name',
                render: (row) => (
                  <span>
                    <span className="font-medium">{row.name}</span>{' '}
                    <span className="text-muted-foreground">({row.code})</span>
                  </span>
                ),
              },
              {
                key: 'status',
                align: 'right',
                render: (row) => (
                  <Badge variant="success" size="sm">
                    {row.status}
                  </Badge>
                ),
              },
            ]}
            data={conditionData}
            actions={[
              {
                label: 'Edit',
                icon: <PencilIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
              {
                label: 'Delete',
                icon: <TrashIcon className="h-3.5 w-3.5" />,
                onClick: noop,
              },
            ]}
          />
        </DashboardWidget>
      </div>
    </div>
  ),
};
