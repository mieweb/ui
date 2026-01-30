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
  title: 'Components/QuickAction',
  component: QuickAction,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
