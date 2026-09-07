import type { Meta, StoryObj } from '@storybook/react';
import { QuickLinksCard } from './QuickLinksCard';

const meta: Meta<typeof QuickLinksCard> = {
  component: QuickLinksCard,
  id: 'dashboards-quicklinkscard',
  title: 'Modules/Dashboards/QuickLinksCard',
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A titled \`Card\` of shortcut rows.** \`links: QuickLink[]\` (\`{ id, label, icon?, href?, onClick?, badge?, description?, disabled? }\`) render as ghost \`Button\`s — icon, label + \`description\`, then a \`badge\` chip or a chevron. \`layout\` \`vertical\` (default, one per row) or \`grid\` (\`columns\` 2–4, icon above label, description hidden). \`title\` defaults to **"Quick Links"**. Clicking calls \`onClick\` if present, otherwise assigns \`window.location.href = href\`.

### Use it when

- A dashboard sidebar or home page needs "Add employee · New order · Reports" style shortcuts with optional counts, and you do not want to build the card yourself.
- Shortcuts are few (≤ ~8) and either navigate or open something.

### Don't use it when

- The shortcut deserves a large tile with a tinted icon and a subtitle — \`QuickAction\` (a real button per action; you supply the grid).
- The shortcuts sit inside a portlet with the standard widget header, count and "+" — \`DashboardWidget\` + \`DashboardWidgetActions\`.
- Links must be real \`<a href>\` for the router, middle-click or crawlers — every item is a \`<button>\`; \`href\` is a JS navigation.
- You need a different card header (actions, icon) — compose \`Card\` yourself.

### Example

\`\`\`tsx
const navigate = useNavigate();
const { data: pending } = usePendingOrdersCount();

<QuickLinksCard
  title="Shortcuts"
  links={[
    { id: 'new-order', label: 'New order', icon: <PlusIcon className="h-5 w-5" />, onClick: () => setOrderOpen(true) },
    { id: 'pending', label: 'Pending orders', description: 'Awaiting results', badge: pending, onClick: () => navigate('/orders?status=pending') },
    { id: 'reports', label: 'Reports', onClick: () => navigate('/reports'), disabled: !can('reports.view') },
  ]}
/>
\`\`\`

Prefer \`onClick\` with your router over \`href\` so navigation stays client-side.

### Limitations

- Accessibility: items are \`Button\`s (keyboard / focus handled); \`disabled\` disables the button. \`href\` items are **buttons, not links** — no link semantics, no new-tab, no prefetch. Icons are not \`aria-hidden\` (pass decorative icons yourself). The chevron is \`aria-hidden\`. \`badge\` is an unlabelled span ("12" read without context). The card title is a \`CardTitle\` \`<h3>\` with no level prop.
- Layout: in \`grid\` each item is a fixed \`h-20\` tile and \`description\` is dropped; in \`vertical\` long labels wrap, nothing truncates.
- i18n: default \`title\` \`"Quick Links"\`; no number formatting on \`badge\`.
- RTL: physical \`mr-3\` (icon), \`ml-2\` (badge), \`text-left\`, and the chevron points right without mirroring.
- Theming: semantic tokens plus \`bg-primary/10\` and \`--mieweb-primary-900/400\` for the badge. Classes are concatenated with template strings, so \`className\` on the Card cannot merge-override. Uses \`Card\` and \`Button\`; no third-party dependencies.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'layout-card',
          why: 'Renders a Card with CardHeader / CardTitle / CardContent around the link list.',
        },
        {
          type: 'alternative to',
          target: 'actions-quickaction',
          why: 'QuickLinksCard is a compact titled list of plain link rows with badges; QuickAction is a large explained tile you arrange in your own grid.',
        },
        {
          type: 'alternative to',
          target: 'dashboards-dashboardwidget',
          why: 'DashboardWidgetActions is a coloured shortcut grid inside a widget; QuickLinksCard is a standalone Card listing plain link rows with badges.',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QuickLinksCard>;

const PlusIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const UsersIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const DocumentIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const ChartIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SettingsIcon = (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export const Default: Story = {
  args: {
    title: 'Quick Links',
    links: [
      { id: '1', label: 'New Order', icon: PlusIcon },
      { id: '2', label: 'Manage Users', icon: UsersIcon, badge: 3 },
      { id: '3', label: 'View Reports', icon: DocumentIcon },
      { id: '4', label: 'Analytics', icon: ChartIcon },
    ],
  },
};

export const WithDescriptions: Story = {
  args: {
    title: 'Quick Actions',
    links: [
      {
        id: '1',
        label: 'Create Order',
        icon: PlusIcon,
        description: 'Start a new service order',
      },
      {
        id: '2',
        label: 'Invite Users',
        icon: UsersIcon,
        description: 'Add team members to your account',
      },
      {
        id: '3',
        label: 'Generate Report',
        icon: DocumentIcon,
        description: 'Export data and analytics',
      },
      {
        id: '4',
        label: 'Settings',
        icon: SettingsIcon,
        description: 'Configure your preferences',
      },
    ],
  },
};

export const GridLayout: Story = {
  args: {
    title: 'Quick Actions',
    layout: 'grid',
    columns: 2,
    links: [
      { id: '1', label: 'New Order', icon: PlusIcon },
      { id: '2', label: 'Users', icon: UsersIcon },
      { id: '3', label: 'Reports', icon: DocumentIcon },
      { id: '4', label: 'Analytics', icon: ChartIcon },
    ],
  },
};

export const WithBadges: Story = {
  args: {
    title: 'Notifications',
    links: [
      { id: '1', label: 'Pending Orders', icon: DocumentIcon, badge: 12 },
      { id: '2', label: 'User Requests', icon: UsersIcon, badge: 5 },
      { id: '3', label: 'New Messages', icon: PlusIcon, badge: 'New' },
    ],
  },
};

export const WithDisabled: Story = {
  args: {
    title: 'Actions',
    links: [
      { id: '1', label: 'View Orders', icon: DocumentIcon },
      { id: '2', label: 'Create Report', icon: ChartIcon, disabled: true },
      {
        id: '3',
        label: 'Admin Settings',
        icon: SettingsIcon,
        disabled: true,
        description: 'Requires admin access',
      },
    ],
  },
};
