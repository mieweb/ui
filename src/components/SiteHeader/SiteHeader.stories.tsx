import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SiteHeader,
  SiteLogo,
  NavLinks,
  AuthButtons,
  UserMenu,
  type NavLink,
  type UserProfile,
} from './SiteHeader';

const defaultLinks: NavLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Employers', href: '/employers' },
  { label: 'Providers', href: '/providers' },
];

const sampleUser: UserProfile = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=john',
};

const meta: Meta<typeof SiteHeader> = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'white', 'transparent', 'glass'],
      description: 'Visual style variant',
    },
    showSignUp: {
      control: 'boolean',
      description: 'Show sign up button',
    },
    loginHref: { control: 'text' },
    signUpHref: { control: 'text' },
    user: { control: false, table: { disable: true } },
    logo: { control: false, table: { disable: true } },
    links: { control: false, table: { disable: true } },
    userMenuItems: { control: false, table: { disable: true } },
    onLogin: { action: 'login-clicked' },
    onSignUp: { action: 'sign-up-clicked' },
    onLogout: { action: 'logout-clicked' },
    onProfile: { action: 'profile-clicked' },
  },
  args: {
    logo: { name: 'BlueHive' },
    links: defaultLinks,
    variant: 'primary',
    showSignUp: true,
  },
  decorators: [
    (Story) => (
      <div className="min-h-[300px] bg-gray-100 dark:bg-gray-950">
        <Story />
        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-400">
            Page content below header
          </p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SiteHeader>;

// Default header (logged out)
export const Default: Story = {};

// Logged in user
export const LoggedIn: Story = {
  args: {
    user: sampleUser,
  },
};

// White variant
export const WhiteVariant: Story = {
  args: {
    variant: 'white',
  },
};

// Glass variant (for hero backgrounds)
export const GlassVariant: Story = {
  args: {
    variant: 'glass',
  },
  decorators: [
    (Story) => (
      <div className="from-primary-500 min-h-[300px] bg-gradient-to-br to-purple-600">
        <Story />
        <div className="p-8 pt-24">
          <p className="text-white">Glass variant with backdrop blur effect</p>
        </div>
      </div>
    ),
  ],
};

// Sub-components
export const LogoVariants: StoryObj<typeof SiteLogo> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-600 rounded-lg p-4">
        <SiteLogo name="BlueHive" variant="light" />
      </div>
      <div className="rounded-lg border bg-white p-4">
        <SiteLogo name="BlueHive" variant="dark" />
      </div>
    </div>
  ),
};

export const NavLinksDemo: StoryObj<typeof NavLinks> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-600 rounded-lg p-4">
        <NavLinks links={defaultLinks} variant="light" />
      </div>
      <div className="rounded-lg border bg-white p-4">
        <NavLinks links={defaultLinks} variant="dark" />
      </div>
    </div>
  ),
};

export const AuthButtonsDemo: StoryObj<typeof AuthButtons> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-600 rounded-lg p-4">
        <AuthButtons variant="light" onLogin={() => {}} onSignUp={() => {}} />
      </div>
      <div className="rounded-lg border bg-white p-4">
        <AuthButtons variant="dark" onLogin={() => {}} onSignUp={() => {}} />
      </div>
    </div>
  ),
};

export const UserMenuDemo: StoryObj<typeof UserMenu> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-600 flex justify-end rounded-lg p-4">
        <UserMenu user={sampleUser} variant="light" onLogout={() => {}} />
      </div>
      <div className="flex justify-end rounded-lg border bg-white p-4">
        <UserMenu user={sampleUser} variant="dark" onLogout={() => {}} />
      </div>
      <div className="flex justify-end rounded-lg border bg-white p-4">
        <UserMenu
          user={{ ...sampleUser, avatarUrl: undefined }}
          variant="dark"
          onLogout={() => {}}
        />
      </div>
    </div>
  ),
};
