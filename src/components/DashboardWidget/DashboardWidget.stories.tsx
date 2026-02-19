import type { Meta, StoryObj } from '@storybook/react-vite';
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
  title: 'Data Display/DashboardWidget',
  component: DashboardWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

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
    const key = ((args as Record<string, unknown>).variant ??
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
