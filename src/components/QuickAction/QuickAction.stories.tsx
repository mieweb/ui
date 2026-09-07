import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuickAction, QuickActionGroup } from './QuickAction';
import {
  CalendarIcon,
  ClipboardIcon,
  UserIcon,
  FileTextIcon,
  SearchIcon,
  BellIcon,
  SettingsIcon,
  HelpCircleIcon,
  HomeIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  HeartIcon,
  StarIcon,
  BookmarkIcon,
  FolderIcon,
  DownloadIcon,
  UploadIcon,
  ShareIcon,
  LinkIcon,
  ImageIcon,
  CameraIcon,
  ChartIcon,
  ActivityIcon,
  ZapIcon,
  GlobeIcon,
  BuildingIcon,
  BriefcaseIcon,
  type LucideIcon,
} from '../Icons';

// Map of available icons for the dropdown
const iconMap: Record<string, LucideIcon> = {
  calendar: CalendarIcon,
  clipboard: ClipboardIcon,
  user: UserIcon,
  fileText: FileTextIcon,
  search: SearchIcon,
  bell: BellIcon,
  settings: SettingsIcon,
  helpCircle: HelpCircleIcon,
  home: HomeIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  mapPin: MapPinIcon,
  creditCard: CreditCardIcon,
  heart: HeartIcon,
  star: StarIcon,
  bookmark: BookmarkIcon,
  folder: FolderIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  share: ShareIcon,
  link: LinkIcon,
  image: ImageIcon,
  camera: CameraIcon,
  chart: ChartIcon,
  activity: ActivityIcon,
  zap: ZapIcon,
  globe: GlobeIcon,
  building: BuildingIcon,
  briefcase: BriefcaseIcon,
};

// Extended args type that includes our custom iconName prop
type QuickActionStoryArgs = Omit<
  React.ComponentProps<typeof QuickAction>,
  'icon'
> & {
  iconName?: keyof typeof iconMap;
};

const meta: Meta<typeof QuickAction> = {
  id: 'actions-quickaction',
  title: 'Inputs/Actions/QuickAction',
  component: QuickAction,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A card-shaped shortcut button: a tinted icon tile, a \`title\` and a \`subtitle\`, in one of eight \`color\` accents. It is a native \`<button>\`, so it is keyboard-operable and focus-visible out of the box, and \`disabled\` sets \`aria-disabled\`.

### Use it when

- A dashboard or landing page offers a handful of primary destinations or tasks ("Schedule exam", "Import employees") that deserve more presence than a text button.
- The action needs a one-line explanation under its name.

### Don't use it when

- The control sits inline with content or in a form — use \`Button\`.
- You are listing links that only need a label — \`QuickLinksCard\` groups plain links compactly.
- There are more than about six actions; a grid of large tiles stops being "quick". Consider a \`CommandPalette\` or navigation.

### Example

\`\`\`tsx
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  <QuickAction icon={<CalendarPlus />} color="primary" title="Schedule exam" subtitle="Book a DOT physical" onClick={openScheduler} />
  <QuickAction icon={<Upload />} color="green" title="Import employees" subtitle="CSV or HRIS sync" onClick={openImport} />
</div>
\`\`\`

### Limitations

- The icon is decorative (\`aria-hidden\`); the accessible name is the visible title + subtitle, so keep both meaningful.
- \`color\` picks from fixed palettes (primary + seven named hues) with \`dark:\` variants; only \`primary\` follows the brand, the others are constant.
- Width is governed by the parent grid; the tile does not truncate long subtitles.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'actions-button',
          why: 'Button is the inline control; QuickAction is a large, explained shortcut for dashboards.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title text',
    },
    subtitle: {
      control: 'text',
      description: 'The subtitle/description text',
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'green',
        'purple',
        'orange',
        'blue',
        'red',
        'amber',
        'neutral',
      ],
      description: 'Color theme for the icon background',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the action is disabled',
    },
    as: {
      control: 'select',
      options: ['button', 'a'],
      description: 'Render as button or anchor',
    },
    href: {
      control: 'text',
      description: 'URL when rendered as a link',
      if: { arg: 'as', eq: 'a' },
    },
    icon: {
      table: { disable: true }, // Hide the raw icon prop
    },
    iconName: {
      control: 'select',
      options: Object.keys(iconMap),
      description: 'Select an icon from the Lucide icon library',
    },
  } as Meta<QuickActionStoryArgs>['argTypes'],
  // Convert iconName to actual icon element in render
  render: ({ iconName = 'calendar', ...args }: QuickActionStoryArgs) => {
    const IconComponent = iconMap[iconName];
    return (
      <QuickAction {...args} icon={<IconComponent className="h-5 w-5" />} />
    );
  },
};

export default meta;
type Story = StoryObj<QuickActionStoryArgs>;

export const Default: Story = {
  args: {
    title: 'Schedule Exam',
    subtitle: 'Find providers nearby',
    iconName: 'calendar',
    color: 'primary',
    disabled: false,
  },
};

export const Green: Story = {
  args: {
    ...Default.args,
    title: 'My Orders',
    subtitle: 'View history',
    iconName: 'clipboard',
    color: 'green',
  },
};

export const Purple: Story = {
  args: {
    ...Default.args,
    title: 'My Profile',
    subtitle: 'Update your info',
    iconName: 'user',
    color: 'purple',
  },
};

export const Orange: Story = {
  args: {
    ...Default.args,
    title: 'Documents',
    subtitle: 'Medical cards & records',
    iconName: 'fileText',
    color: 'orange',
  },
};

export const Blue: Story = {
  args: {
    ...Default.args,
    title: 'Search',
    subtitle: 'Find anything',
    iconName: 'search',
    color: 'blue',
  },
};

export const Red: Story = {
  args: {
    ...Default.args,
    title: 'Alerts',
    subtitle: 'Critical issues',
    iconName: 'bell',
    color: 'red',
  },
};

export const Amber: Story = {
  args: {
    ...Default.args,
    title: 'Notifications',
    subtitle: 'View all',
    iconName: 'bell',
    color: 'amber',
  },
};

export const Neutral: Story = {
  args: {
    ...Default.args,
    title: 'Settings',
    subtitle: 'Configure options',
    iconName: 'settings',
    color: 'neutral',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    title: 'Disabled Action',
    subtitle: 'This action is disabled',
    iconName: 'calendar',
    color: 'primary',
    disabled: true,
  },
};

export const AsLink: Story = {
  args: {
    ...Default.args,
    title: 'Documentation',
    subtitle: 'View the docs',
    iconName: 'fileText',
    color: 'purple',
    as: 'a',
    href: '#docs',
  },
};

// Showcase stories with custom render
export const AllColors: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      style={{ width: '800px' }}
    >
      <QuickAction
        title="Schedule Exam"
        subtitle="Find providers nearby"
        icon={<CalendarIcon className="h-5 w-5" />}
        color="primary"
      />
      <QuickAction
        title="My Orders"
        subtitle="View history"
        icon={<ClipboardIcon className="h-5 w-5" />}
        color="green"
      />
      <QuickAction
        title="My Profile"
        subtitle="Update your info"
        icon={<UserIcon className="h-5 w-5" />}
        color="purple"
      />
      <QuickAction
        title="Documents"
        subtitle="Medical cards & records"
        icon={<FileTextIcon className="h-5 w-5" />}
        color="orange"
      />
      <QuickAction
        title="Search"
        subtitle="Find anything"
        icon={<SearchIcon className="h-5 w-5" />}
        color="blue"
      />
      <QuickAction
        title="Alerts"
        subtitle="Critical issues"
        icon={<BellIcon className="h-5 w-5" />}
        color="red"
      />
      <QuickAction
        title="Notifications"
        subtitle="View all"
        icon={<BellIcon className="h-5 w-5" />}
        color="amber"
      />
      <QuickAction
        title="Settings"
        subtitle="Configure options"
        icon={<SettingsIcon className="h-5 w-5" />}
        color="neutral"
      />
    </div>
  ),
};

export const GroupWithTitle: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ width: '900px' }}>
      <QuickActionGroup title="Quick Actions">
        <QuickAction
          title="Schedule Exam"
          subtitle="Find providers nearby"
          icon={<CalendarIcon className="h-5 w-5" />}
          color="primary"
        />
        <QuickAction
          title="My Orders"
          subtitle="View history"
          icon={<ClipboardIcon className="h-5 w-5" />}
          color="green"
        />
        <QuickAction
          title="My Profile"
          subtitle="Update your info"
          icon={<UserIcon className="h-5 w-5" />}
          color="purple"
        />
        <QuickAction
          title="Documents"
          subtitle="Medical cards & records"
          icon={<FileTextIcon className="h-5 w-5" />}
          color="orange"
        />
      </QuickActionGroup>
    </div>
  ),
};

export const GroupTwoColumns: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ width: '600px' }}>
      <QuickActionGroup title="Settings" columns={{ sm: 2, lg: 2 }}>
        <QuickAction
          title="Settings"
          subtitle="Configure options"
          icon={<SettingsIcon className="h-5 w-5" />}
          color="neutral"
        />
        <QuickAction
          title="Help"
          subtitle="Get support"
          icon={<HelpCircleIcon className="h-5 w-5" />}
          color="blue"
        />
      </QuickActionGroup>
    </div>
  ),
};

export const DashboardExample: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div style={{ width: '900px' }} className="space-y-8">
      <QuickActionGroup title="Quick Actions">
        <QuickAction
          title="Schedule Exam"
          subtitle="Find providers nearby"
          icon={<CalendarIcon className="h-5 w-5" />}
          color="primary"
        />
        <QuickAction
          title="My Orders"
          subtitle="3 pending"
          icon={<ClipboardIcon className="h-5 w-5" />}
          color="green"
        />
        <QuickAction
          title="My Profile"
          subtitle="Update your info"
          icon={<UserIcon className="h-5 w-5" />}
          color="purple"
        />
        <QuickAction
          title="Documents"
          subtitle="Medical cards & records"
          icon={<FileTextIcon className="h-5 w-5" />}
          color="orange"
        />
      </QuickActionGroup>
    </div>
  ),
};
