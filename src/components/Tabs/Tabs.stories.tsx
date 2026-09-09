import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Card, CardContent } from '../Card';
import {
  UserIcon,
  SettingsIcon,
  BellIcon,
  HomeIcon,
  ChartIcon,
  MailIcon,
  CalendarIcon,
  FileTextIcon,
} from '../Icons';
import { Badge } from '../Badge';

const meta: Meta<typeof Tabs> = {
  id: 'navigation-tabs',
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**Switching between peer views of the same thing** inside one page — Overview / History / Documents on a record. \`Tabs\` holds the selection (\`value\` + \`onValueChange\` controlled, or \`defaultValue\` uncontrolled) and the \`variant\` (\`underline\` | \`pills\` | \`enclosed\`); \`TabsList\` is the \`role="tablist"\` strip with arrow-key handling; each \`TabsTrigger value\` (optional \`icon\`, \`disabled\`) toggles the matching \`TabsContent value\`. Inactive panels are **unmounted** unless \`forceMount\` (then hidden with \`hidden\`). \`tabsListVariants\` / \`tabsTriggerVariants\` are exported.

### Use it when

- 2–7 sibling views share one context and only one needs to be visible at a time; the selection is local UI state, not a route.
- The content of each panel is cheap enough to mount on switch, or you pass \`forceMount\` to keep expensive panels alive.

### Don't use it when

- The choice is **app-level navigation** across pages — \`Sidebar\` (persistent rail with routes) or \`Breadcrumb\` for position in a hierarchy.
- The switch is a compact **filter or sort** in a toolbar — \`PillSelect\`; a value saved with a form — \`Radio\` / \`Select\`.
- Sections should be readable one after another and several open at once — \`Accordion\` / \`Collapsible\`.
- The steps are ordered and gated — \`StepIndicator\`.

### Example

\`\`\`tsx
const [tab, setTab] = useState<'summary' | 'history' | 'files'>('summary');

<Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} variant="underline">
  <TabsList aria-label="Encounter sections">
    <TabsTrigger value="summary" icon={<FileTextIcon size={16} />}>Summary</TabsTrigger>
    <TabsTrigger value="history">History <Badge size="sm" variant="secondary">{events.length}</Badge></TabsTrigger>
    <TabsTrigger value="files" disabled={!canViewFiles}>Files</TabsTrigger>
  </TabsList>
  <TabsContent value="summary"><EncounterSummary id={id} /></TabsContent>
  <TabsContent value="history"><TimelineEventList events={events} /></TabsContent>
  <TabsContent value="files" forceMount><FileGrid id={id} /></TabsContent>
</Tabs>
\`\`\`

Controlled here so the tab can be synced to a URL query param; \`defaultValue\` alone is fine for purely local state.

### Limitations

- Accessibility: \`TabsList\` is \`role="tablist"\`; triggers are \`<button role="tab" aria-selected aria-controls="tabpanel-{value}" id="tab-{value}">\` with roving \`tabIndex\` (selected 0, others −1); panels are \`role="tabpanel" aria-labelledby tabIndex={0}\`. Arrow Left/Right and Up/Down move focus (wrapping), Home/End jump — but **focus does not select**: the user must press Enter/Space (manual activation). \`TabsList\` itself also has \`tabIndex={0}\`, so Tab stops once on the list before the active tab. Pass \`aria-label\` to \`TabsList\` yourself; none is set. Ids are derived from \`value\`, so two \`Tabs\` on one page with the same values produce duplicate ids.
- No \`orientation\` prop: the list is always horizontal, though arrow keys accept both axes. No overflow handling — many tabs wrap or overflow the container; \`whitespace-nowrap\` on triggers.
- The \`variant\` is read from context, so all triggers share one style; \`TabsContent\` adds \`mt-4\`.
- RTL: symmetric flex; ArrowRight always moves to the *next* DOM tab, which is visually leftward in RTL.
- Theming: semantic tokens (\`border-border\`, \`bg-muted\`, \`bg-background\`, \`text-muted-foreground\`) plus \`primary-700/800\` for the active underline. No built-in strings. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-sidebar',
          why: 'Tabs switch peer views inside one page (local state); Sidebar is the persistent app navigation rail between routes.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-pillselect',
          why: 'Tabs expose every view as a labelled panel with tablist semantics; PillSelect collapses a one-of-N view/sort choice into a single toolbar pill.',
        },
        {
          type: 'composes with',
          target: 'layout-pageheader',
          why: 'A TabsList in PageHeader children sits under the title as the section switcher for the page.',
        },
        {
          type: 'alternative to',
          target: 'navigation-breadcrumb',
          why: 'Tabs switch between peer views inside one page; Breadcrumb shows the ancestor path of the current page.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'enclosed'],
    },
    children: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Playground Story with Controls
// ============================================================================

interface PlaygroundArgs {
  variant: 'underline' | 'pills' | 'enclosed';
  tabCount: number;
  showIcons: boolean;
  showBadges: boolean;
  disabledTabs: number[];
  fullWidth: boolean;
  showContent: boolean;
  contentStyle: 'plain' | 'card';
}

const allTabs = [
  {
    value: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    badge: null,
    content: 'View your dashboard metrics, recent activity, and quick actions.',
  },
  {
    value: 'analytics',
    label: 'Analytics',
    icon: ChartIcon,
    badge: 'New',
    content:
      'Explore detailed analytics, charts, and performance metrics for your account.',
  },
  {
    value: 'messages',
    label: 'Messages',
    icon: MailIcon,
    badge: '5',
    content:
      'Read and respond to your messages. Manage your inbox and sent items.',
  },
  {
    value: 'calendar',
    label: 'Calendar',
    icon: CalendarIcon,
    badge: null,
    content: 'View and manage your schedule. Create events and set reminders.',
  },
  {
    value: 'documents',
    label: 'Documents',
    icon: FileTextIcon,
    badge: '12',
    content: 'Access your files and documents. Upload, download, and organize.',
  },
  {
    value: 'profile',
    label: 'Profile',
    icon: UserIcon,
    badge: null,
    content: 'Manage your personal information and account settings.',
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: SettingsIcon,
    badge: null,
    content: 'Configure application settings, preferences, and integrations.',
  },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    badge: '3',
    content: 'Manage your notification preferences and view recent alerts.',
  },
];

function PlaygroundTabs({
  variant,
  tabCount,
  showIcons,
  showBadges,
  disabledTabs,
  fullWidth,
  showContent,
  contentStyle,
}: PlaygroundArgs) {
  const [selectedTab, setSelectedTab] = React.useState(allTabs[0].value);
  const tabs = allTabs.slice(0, tabCount);

  // Reset to first tab if current tab is removed
  React.useEffect(() => {
    if (!tabs.find((t) => t.value === selectedTab)) {
      setSelectedTab(tabs[0]?.value || '');
    }
  }, [tabCount, selectedTab, tabs]);

  return (
    <div className="w-full max-w-2xl">
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        variant={variant}
      >
        <TabsList className={fullWidth ? 'w-full' : ''}>
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            const isDisabled = disabledTabs.includes(index);
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={isDisabled}
                icon={
                  showIcons ? <IconComponent className="h-4 w-4" /> : undefined
                }
                className={fullWidth ? 'flex-1' : ''}
              >
                {tab.label}
                {showBadges && tab.badge && (
                  <Badge
                    variant={tab.badge === 'New' ? 'success' : 'secondary'}
                    size="sm"
                    className="ml-1.5"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {showContent &&
          tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {contentStyle === 'card' ? (
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="text-foreground mb-2 font-semibold">
                      {tab.label}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {tab.content}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="py-4">
                  <h3 className="text-foreground mb-2 font-semibold">
                    {tab.label}
                  </h3>
                  <p className="text-muted-foreground text-sm">{tab.content}</p>
                </div>
              )}
            </TabsContent>
          ))}
      </Tabs>
      <p className="text-muted-foreground mt-4 text-xs">
        Selected tab:{' '}
        <code className="bg-muted text-foreground rounded px-1 py-0.5 font-mono">
          {selectedTab}
        </code>
      </p>
    </div>
  );
}

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    variant: 'underline',
    tabCount: 4,
    showIcons: true,
    showBadges: true,
    disabledTabs: [],
    fullWidth: false,
    showContent: true,
    contentStyle: 'card',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'enclosed'],
      description: 'Visual style of the tabs',
    },
    tabCount: {
      control: { type: 'range', min: 2, max: 8, step: 1 },
      description: 'Number of tabs to display (2-8)',
    },
    showIcons: {
      control: 'boolean',
      description: 'Show icons in tab triggers',
    },
    showBadges: {
      control: 'boolean',
      description: 'Show badges/counts on applicable tabs',
    },
    disabledTabs: {
      control: 'multi-select',
      options: [0, 1, 2, 3, 4, 5, 6, 7],
      description: 'Tab indices to disable (0-indexed)',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretch tabs to fill full width',
    },
    showContent: {
      control: 'boolean',
      description: 'Show tab content panels',
    },
    contentStyle: {
      control: 'select',
      options: ['plain', 'card'],
      description: 'Style of the content area',
    },
  },
  render: (args) => <PlaygroundTabs {...args} />,
};

export const Underline: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="account" variant="underline">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Make changes to your account settings here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Change your password here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Manage your notification preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const Pills: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="all" variant="pills">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <p className="text-muted-foreground text-sm">Showing all items.</p>
        </TabsContent>
        <TabsContent value="active">
          <p className="text-muted-foreground text-sm">
            Showing active items only.
          </p>
        </TabsContent>
        <TabsContent value="completed">
          <p className="text-muted-foreground text-sm">
            Showing completed items only.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const Enclosed: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="overview" variant="enclosed">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Overview dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Analytics dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardContent className="pt-4">
              <p className="text-muted-foreground text-sm">
                Reports dashboard content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="profile" variant="underline">
        <TabsList>
          <TabsTrigger value="profile" icon={<UserIcon className="h-4 w-4" />}>
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            icon={<SettingsIcon className="h-4 w-4" />}
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            icon={<BellIcon className="h-4 w-4" />}
          >
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <p className="text-muted-foreground text-sm">Profile settings.</p>
        </TabsContent>
        <TabsContent value="settings">
          <p className="text-muted-foreground text-sm">General settings.</p>
        </TabsContent>
        <TabsContent value="notifications">
          <p className="text-muted-foreground text-sm">
            Notification preferences.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="tab1" variant="underline">
        <TabsList>
          <TabsTrigger value="tab1">Enabled</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Disabled
          </TabsTrigger>
          <TabsTrigger value="tab3">Also Enabled</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <p className="text-muted-foreground text-sm">
            This tab is enabled and can be selected.
          </p>
        </TabsContent>
        <TabsContent value="tab2">
          <p className="text-muted-foreground text-sm">
            This tab is disabled and cannot be selected.
          </p>
        </TabsContent>
        <TabsContent value="tab3">
          <p className="text-muted-foreground text-sm">
            This tab is also enabled.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

function ControlledTabsDemo() {
  const [value, setValue] = React.useState('tab1');

  return (
    <div className="w-[400px] space-y-4">
      <Tabs value={value} onValueChange={setValue} variant="pills">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content for Tab 1</TabsContent>
        <TabsContent value="tab2">Content for Tab 2</TabsContent>
        <TabsContent value="tab3">Content for Tab 3</TabsContent>
      </Tabs>
      <p className="text-muted-foreground text-xs">
        Current tab: <code className="font-mono">{value}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTabsDemo />,
};
