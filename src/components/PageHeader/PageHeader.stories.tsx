import type { Meta, StoryObj } from '@storybook/react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '../Button/Button';
import {
  BellIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  ClipboardListIcon,
  FileTextIcon,
  HomeIcon,
  HospitalIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  StethoscopeIcon,
  UserIcon,
  UsersIcon,
} from '../Icons';
import { PageHeader } from './PageHeader';

const iconMap: Record<string, LucideIcon> = {
  Home: HomeIcon,
  Settings: SettingsIcon,
  User: UserIcon,
  Users: UsersIcon,
  Calendar: CalendarIcon,
  FileText: FileTextIcon,
  Building: BuildingIcon,
  Briefcase: BriefcaseIcon,
  Chart: ChartIcon,
  Shield: ShieldIcon,
  Bell: BellIcon,
  Search: SearchIcon,
  Stethoscope: StethoscopeIcon,
  Hospital: HospitalIcon,
  ClipboardList: ClipboardListIcon,
};

const meta: Meta<typeof PageHeader> = {
  id: 'layout-pageheader',
  title: 'Components/Layout/PageHeader',
  component: PageHeader,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    actions: { control: false },
    icon: {
      control: 'select',
      options: ['None', ...Object.keys(iconMap)],
      mapping: {
        None: undefined,
        ...Object.fromEntries(
          Object.entries(iconMap).map(([name, Icon]) => [
            name,
            <Icon key={name} className="h-6 w-6" />,
          ])
        ),
      },
    },
    iconAlign: {
      control: 'radio',
      options: ['top', 'center'],
    },
    children: { control: false },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**The title block at the top of a page or section**: an \`<h1>\` \`title\` (truncated), optional \`subtitle\`, a leading \`icon\` (\`iconAlign\` \`center\` | \`top\`), an \`actions\` slot on the end side, and \`children\` rendered underneath for a \`Breadcrumb\`, a \`TabsList\` or filters. \`size\` (\`sm\` | \`md\` | \`lg\`) scales padding and title; \`bordered\` (default \`true\`) draws the bottom rule. One component, no sub-components, no state.

### Use it when

- Every page in an app should open the same way: title, one-line context, primary buttons on the right, then tabs or breadcrumb.
- A large section within a page (a settings group, a report) needs the same treatment at \`size="sm"\`.

### Don't use it when

- It is the **app-wide bar** with brand, search and account — \`AppHeader\`; the **public site bar** — \`SiteHeader\`.
- The header describes a **record** with identity chips and banners — \`PatientHeader\`, \`CaseManagementHeader\`, \`ProviderDetailHeader\`.
- The title belongs to a tile, not a page — \`CardHeader\` / \`CardTitle\` or \`DashboardWidget title\`.
- You need a portalled toolbar target — wrap \`actions\` in your own element with a ref (\`CustomizableDashboard toolbarSlot\`), PageHeader exposes no ref.

### Example

\`\`\`tsx
const [tab, setTab] = useState<'summary' | 'orders'>('summary');

<PageHeader
  title={employer.name}
  subtitle={\`\${employer.employeeCount} employees · \${employer.city}\`}
  icon={<BuildingIcon className="h-6 w-6" />}
  actions={
    <>
      <Button variant="outline" onClick={exportCsv}>Export</Button>
      <Button onClick={() => setOrderOpen(true)}>New order</Button>
    </>
  }
>
  <Breadcrumb items={[{ label: 'Employers', href: '/employers' }, { label: employer.name }]} />
  <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-3">
    <TabsList aria-label="Employer sections">
      <TabsTrigger value="summary">Summary</TabsTrigger>
      <TabsTrigger value="orders">Orders</TabsTrigger>
    </TabsList>
  </Tabs>
</PageHeader>
\`\`\`

Tab state stays in the page; the header is a pure layout wrapper.

### Limitations

- Accessibility: \`title\` is **always an \`<h1>\`** with no level prop — two PageHeaders on one page (or one plus \`AppHeaderTitle\`) yield duplicate \`h1\`s; use \`CardTitle as="h2"\` for sub-sections instead. The root is a \`div\`, not a \`<header>\` landmark. \`icon\` is not \`aria-hidden\` — pass a decorative icon yourself. Title and subtitle \`truncate\` to one line with no tooltip.
- Responsive: the row is a single flex line — long titles truncate and \`actions\` never wrap below on narrow screens (\`flex-shrink-0\`).
- RTL: symmetric flex and \`gap\`; nothing physical. No strings.
- Theming: title uses hard-coded \`text-gray-900 dark:text-white\` and the border \`gray-200 / gray-700\`, not \`text-foreground\` / \`border-border\`; subtitle uses \`text-muted-foreground\`. Classes are concatenated with template strings (no \`cn\`), so \`className\` cannot override earlier utilities via merge. No dependencies.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'navigation-tabs',
          why: 'A TabsList in PageHeader children sits under the title as the section switcher for the page.',
        },
        {
          type: 'composes with',
          target: 'navigation-breadcrumb',
          why: 'Breadcrumb in PageHeader children shows where the titled page sits in the hierarchy.',
        },
        {
          type: 'alternative to',
          target: 'layout-appheader',
          why: 'PageHeader is the title block inside one page with its actions, breadcrumb and tabs; AppHeader is the app-wide top bar (brand, search, user).',
        },
        {
          type: 'composes with',
          target: 'dashboards-customizabledashboard',
          why: 'CustomizableDashboard portals its title + layout toggle into a toolbarSlot element placed in the PageHeader actions row.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-patientheader',
          why: 'PageHeader titles a generic page with breadcrumb and tabs; PatientHeader is the chart banner with demographics, safety rows and a patient action menu.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-casemanagementheader',
          why: 'PageHeader titles a generic page with breadcrumb and tabs; CaseManagementHeader is the record banner for a case with its own context bar and details grid.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Orders',
    subtitle: 'Manage your referrals and orders',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Provider Services',
    subtitle: 'Configure services offered by this provider',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Export
        </Button>
        <Button size="sm">Add Service</Button>
      </div>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Overview of your provider activity',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
};

export const Small: Story = {
  args: {
    title: 'Recent Activity',
    size: 'sm',
    bordered: false,
  },
};

export const Large: Story = {
  args: {
    title: 'Welcome Back',
    subtitle: 'Here is what is happening with your providers today',
    size: 'lg',
    actions: <Button>Get Started</Button>,
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Invoices',
    subtitle: 'View and manage invoices',
    children: (
      <div className="flex gap-4 text-sm">
        <button className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600 dark:text-blue-400">
          All
        </button>
        <button className="pb-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          Draft
        </button>
        <button className="pb-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          Sent
        </button>
        <button className="pb-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          Paid
        </button>
      </div>
    ),
  },
};

export const NoBorder: Story = {
  args: {
    title: 'Settings',
    subtitle: 'Manage your account preferences',
    bordered: false,
    actions: <Button variant="outline">Save Changes</Button>,
  },
};

export const ProviderExample: Story = {
  args: {
    title: 'Redimed Downtown',
    subtitle: '123 Main St, Indianapolis, IN 46202',
    icon: (
      <div className="justify-content-center flex h-10 w-10 items-center rounded-full bg-blue-100 dark:bg-blue-900">
        <svg
          className="h-6 w-6 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
    ),
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="outline" size="sm">
          View Public
        </Button>
      </div>
    ),
  },
};
