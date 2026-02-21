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
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
