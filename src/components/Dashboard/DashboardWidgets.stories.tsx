import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  DashboardWidget,
  DashboardWidgetInfo,
  DashboardWidgetTable,
  DashboardWidgetActions,
  DashboardWidgetDataCards,
} from '../DashboardWidget';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { CountBadge } from '../CountBadge';
import { PatientHeader, type PatientData } from '../PatientHeader';
import { Text } from '../Text';
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
  DollarSignIcon,
  UsersIcon,
  ActivityIcon,
  FileTextIcon,
  MailIcon,
  BellIcon,
} from '../Icons';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta = {
  title: 'Examples/Dashboard (Widgets)',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// =============================================================================
// Mock Data
// =============================================================================

const noop = () => {};

const samplePatient: PatientData = {
  name: { first: 'William', last: 'Hart', middle: 'S' },
  mrn: 'MRN-000001',
  dob: '04-03-1948',
  age: 77,
  sex: 'M',
  status: 'active',
  email: 'whart@example.com',
  phone: '555-867-5309',
  employer: 'Acme Corp.',
  attendingProvider: 'Dr. Sarah Chen',
};

const sampleAllergies = [
  { name: 'Penicillin', severity: 'moderate' as const },
  { name: 'Sulfa Drugs', severity: 'mild' as const },
];

const sampleMedications = [
  { name: 'Lisinopril' },
  { name: 'Atorvastatin' },
  { name: 'Metformin' },
];

// -- Stats
const statsItems = [
  { label: 'Total Revenue', value: '$45,231.89' },
  { label: 'Subscriptions', value: '+2,350' },
  { label: 'Sales', value: '+12,234' },
  { label: 'Active Now', value: '+573' },
];

// -- Orders
type Order = {
  id: string;
  customer: string;
  status: string;
  amount: string;
  date: string;
};

const orderData: Order[] = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    status: 'completed',
    amount: '$250.00',
    date: '2024-01-15',
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    status: 'pending',
    amount: '$150.00',
    date: '2024-01-14',
  },
  {
    id: 'ORD-003',
    customer: 'Bob Johnson',
    status: 'cancelled',
    amount: '$75.00',
    date: '2024-01-13',
  },
  {
    id: 'ORD-004',
    customer: 'Alice Brown',
    status: 'completed',
    amount: '$320.00',
    date: '2024-01-12',
  },
  {
    id: 'ORD-005',
    customer: 'Charlie Wilson',
    status: 'processing',
    amount: '$180.00',
    date: '2024-01-11',
  },
];

const statusVariant = (s: string) =>
  s === 'completed'
    ? 'success'
    : s === 'pending'
      ? 'warning'
      : s === 'processing'
        ? 'secondary'
        : ('danger' as const);

// -- Activity
type ActivityItem = { user: string; action: string; time: string };

const activityData: ActivityItem[] = [
  { user: 'John Doe', action: 'updated profile', time: '2 min ago' },
  { user: 'Jane Smith', action: 'added new project', time: '1 hour ago' },
  { user: 'Bob Johnson', action: 'completed task', time: '3 hours ago' },
  { user: 'Alice Brown', action: 'left a comment', time: '5 hours ago' },
];

// -- Quick Actions
const quickActions = [
  {
    label: 'Add User',
    icon: <UsersIcon className="h-3.5 w-3.5" />,
    color: 'blue' as const,
    onClick: noop,
  },
  {
    label: 'New Order',
    icon: <DollarSignIcon className="h-3.5 w-3.5" />,
    color: 'green' as const,
    onClick: noop,
  },
  {
    label: 'View Reports',
    icon: <ActivityIcon className="h-3.5 w-3.5" />,
    color: 'purple' as const,
    onClick: noop,
  },
  {
    label: 'Send Email',
    icon: <MailIcon className="h-3.5 w-3.5" />,
    color: 'orange' as const,
    onClick: noop,
  },
  {
    label: 'Notifications',
    icon: <BellIcon className="h-3.5 w-3.5" />,
    color: 'amber' as const,
    onClick: noop,
  },
  {
    label: 'Settings',
    icon: <FileTextIcon className="h-3.5 w-3.5" />,
    color: 'neutral' as const,
    onClick: noop,
  },
];

// -- Patient summary (clinical flavor)
const patientInfo = [
  { label: 'Name', value: 'Hart, William' },
  { label: 'DOB', value: '1948-04-03 (77 y/o)' },
  { label: 'Gender', value: 'male' },
  { label: 'MRN', value: 'MRN-000001' },
  { label: 'Phone', value: '555-867-5309' },
  { label: 'Email', value: 'whart@example.com' },
  {
    label: 'Address',
    value: '123 Main St, Fort Wayne, IN 46802',
    fullWidth: true,
  },
];

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

type Allergy = { allergen: string; reaction: string; severity: string };
const allergyData: Allergy[] = [
  { allergen: 'Penicillin', reaction: 'Hives', severity: 'moderate' },
  { allergen: 'Sulfa Drugs', reaction: 'Rash', severity: 'mild' },
];

type Medication = { name: string; details: string };
const medicationData: Medication[] = [
  { name: 'Lisinopril', details: '10 mg oral, Once daily' },
  { name: 'Atorvastatin', details: '20 mg oral, Once daily at bedtime' },
  { name: 'Metformin', details: '500 mg oral, Twice daily' },
];

type Condition = { name: string; code: string; status: string };
const conditionData: Condition[] = [
  { name: 'Essential Hypertension', code: 'I10', status: 'active' },
  { name: 'Type 2 Diabetes Mellitus', code: 'E11.9', status: 'active' },
  { name: 'Hyperlipidemia', code: 'E78.5', status: 'active' },
];

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

const clinicalActions = [
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
    icon: <FileTextIcon className="h-3.5 w-3.5" />,
    color: 'neutral' as const,
    onClick: noop,
  },
];

// =============================================================================
// Story: Business Dashboard
// =============================================================================

/**
 * A business-style dashboard with stats, orders table, activity feed,
 * and quick actions — all composed from DashboardWidget variants.
 */
export const BusinessDashboard: StoryObj = {
  render: () => (
    <div className="bg-muted/30 min-h-screen p-6">
      <div className="mx-auto max-w-[1200px] space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, John</p>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsItems.map((stat) => (
            <DashboardWidget
              key={stat.label}
              title={stat.label}
              icon={<ActivityIcon className="h-4 w-4" />}
            >
              <Text size="3xl" weight="bold">
                {stat.value}
              </Text>
              <Badge variant="success" className="mt-2">
                +20.1% from last month
              </Badge>
            </DashboardWidget>
          ))}
        </div>

        {/* Main grid: Orders + Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardWidget
              title="Recent Orders"
              icon={<DollarSignIcon className="h-4 w-4" />}
              count={orderData.length}
            >
              <DashboardWidgetTable<Order>
                showHeader
                columns={[
                  {
                    key: 'id',
                    header: 'Order ID',
                    render: (r) => <span className="font-medium">{r.id}</span>,
                  },
                  { key: 'customer', header: 'Customer' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (r) => (
                      <Badge variant={statusVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
                    ),
                  },
                  { key: 'amount', header: 'Amount', align: 'right' },
                ]}
                data={orderData}
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

          <DashboardWidget
            title="Recent Activity"
            icon={<ActivityIcon className="h-4 w-4" />}
            count={activityData.length}
          >
            <DashboardWidgetTable<ActivityItem>
              columns={[
                {
                  key: 'user',
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <Avatar name={row.user} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {row.user}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {row.action}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'time',
                  align: 'right',
                  className: 'text-xs text-muted-foreground whitespace-nowrap',
                },
              ]}
              data={activityData}
            />
          </DashboardWidget>
        </div>

        {/* Quick Actions */}
        <DashboardWidget
          title="Quick Actions"
          icon={<ZapIcon className="h-4 w-4" />}
        >
          <DashboardWidgetActions columns={3} actions={quickActions} />
        </DashboardWidget>
      </div>
    </div>
  ),
};

// =============================================================================
// Story: Patient Summary (Clinical)
// =============================================================================

/**
 * A clinical patient summary dashboard matching the reference screenshot —
 * demographics, encounters, vitals, quick links, allergies, medications,
 * and medical history.
 */
export const PatientSummary: StoryObj = {
  render: () => (
    <div className="bg-muted/30 min-h-screen">
      {/* Patient Header */}
      <PatientHeader
        patient={samplePatient}
        allergies={sampleAllergies}
        medications={sampleMedications}
        showAllergyBanner
        showMedicationBanner
        showDetails
        sticky={false}
        actions={
          <div className="flex flex-wrap gap-2">
            <CountBadge label="Tasks" count={3} />
            <CountBadge label="Open Enc" count={5} />
            <CountBadge label="Due List" count={4} />
          </div>
        }
      />

      <div className="mx-auto max-w-[1800px] space-y-6 p-6">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>*]:min-w-0">
          {/* Column 1 — Demographics */}
          <div className="space-y-4">
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
              <DashboardWidgetInfo columns={2} items={patientInfo} />
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
                        <span className="text-muted-foreground">
                          {' '}
                          — {row.type}
                        </span>
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
              <DashboardWidgetActions columns={2} actions={clinicalActions} />
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
                        <span className="text-muted-foreground">
                          {row.details}
                        </span>
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
                        <span className="text-muted-foreground">
                          ({row.code})
                        </span>
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
      </div>
    </div>
  ),
};
