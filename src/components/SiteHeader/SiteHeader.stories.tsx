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
  id: 'layout-siteheader',
  title: 'Components/Layout/SiteHeader',
  component: SiteHeader,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The public / marketing site bar**: a \`fixed\` top \`<header>\` (with a 64px spacer so content is not covered) in \`variant\` \`primary\` (brand blue) | \`white\` | \`transparent\` | \`glass\`, containing \`logo\` (\`{ src, alt, textSrc, name, href }\`), desktop \`links: NavLink[]\` (\`{ label, href, external?, hideOnMobile? }\`), and on the end side either \`AuthButtons\` (Log In / Sign Up via \`onLogin\` / \`onSignUp\` or \`loginHref\` / \`signUpHref\`, \`showSignUp\`) or, when \`user\` is set, a self-contained \`UserMenu\` (\`onProfile\`, \`onLogout\`, \`userMenuItems\`). Below \`md\` the links collapse behind \`MobileMenuButton\` into \`MobileMenuPanel\`, whose open state the component owns. Pieces are exported for custom bars: \`SiteLogo\`, \`NavLinks\`, \`AuthButtons\`, \`UserMenu\`, \`MobileMenuButton\`, \`MobileMenuPanel\`, plus \`CompactHeader\` (\`title\`, \`backHref\` / \`onBack\`, \`rightContent\`) for focused sub-pages.

### Use it when

- Landing, pricing, help or sign-up pages: a handful of top-level links, brand logo, and a logged-out / logged-in switch.
- You want the mobile menu, auth buttons and user dropdown handled for you with plain \`href\`s (server-rendered, no router needed).

### Don't use it when

- The **signed-in application** shell with search, notification and account triggers next to a \`Sidebar\` — \`AppHeader\` (sticky, slot-based, no nav links).
- A **title block within a page** — \`PageHeader\`.
- Navigation needs active-route styling, nested groups or a persistent rail — \`Sidebar\`; links are React Router / Next links — \`NavLinks\` renders plain \`<a>\` only.
- More than ~5 links or mega-menus — there is no dropdown navigation.

### Example

\`\`\`tsx
const { user, logout } = useSession();

<SiteHeader
  variant="white"
  logo={{ name: 'BlueHive', src: '/logo.svg', alt: 'BlueHive', href: '/' }}
  links={[
    { label: 'Employers', href: '/employers' },
    { label: 'Providers', href: '/providers' },
    { label: 'Docs', href: 'https://docs.bluehive.com', external: true },
  ]}
  user={user ? { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } : null}
  loginHref="/login"
  signUpHref="/signup"
  onProfile={() => navigate('/account')}
  onLogout={logout}
  userMenuItems={[{ label: 'Billing', href: '/billing' }]}
/>
<main>…</main>
<SiteFooter … />
\`\`\`

Session state is the host's; the component switches between \`AuthButtons\` and \`UserMenu\` on \`user\`.

### Limitations

- Accessibility: \`NavLinks\` is a \`<nav aria-label="Main navigation">\` (label prop available on the piece, not on \`SiteHeader\`); \`MobileMenuButton\` has \`aria-expanded\` + \`aria-label="Toggle menu"\`; \`UserMenu\`'s trigger has \`aria-expanded\` / \`aria-haspopup\` but the popup has **no \`role="menu"\`, no arrow-key navigation, no Escape handling** (click-outside only), and focus is not moved or returned. \`MobileMenuPanel\` is a fixed panel **without \`role="dialog"\`, focus trap, Escape or scroll lock**; its \`<nav>\` is unlabelled. The header does not mark the current page (\`aria-current\`). No \`<h1>\` except in \`CompactHeader\`. \`hideOnMobile\` on a link is **not implemented** (the type exists, nothing reads it).
- Fixed positioning: the \`h-16\` spacer (\`h-14\` for \`CompactHeader\`) is rendered by the component, so do not add your own offset; ancestors with \`transform\` break the fixed bar.
- i18n: hard-coded English \`"Log In"\`, \`"Sign Up"\`, \`"Log Out"\`, \`"Profile"\`, \`"Settings"\`, \`"Menu"\`, \`"Toggle menu"\`, \`"Close menu"\`, \`"Main navigation"\`; logo fallback letter is \`name[0] || 'B'\`.
- RTL: logical classes throughout — dropdown and mobile panel use \`end-0\`, external icon \`ms-1\`, and the \`CompactHeader\` back chevron mirrors (\`rtl:-scale-x-100\`).
- Theming: \`primary\` variant uses \`bg-primary-800\`; everything else is hard-coded \`white\` / \`gray-*\` / \`red-*\` with \`dark:\` variants — not brand tokens. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-appheader',
          why: 'SiteHeader is the fixed, brand-coloured public-site bar with nav links and auth buttons; AppHeader is the sticky, slot-based chrome of a signed-in app beside a Sidebar.',
        },
        {
          type: 'composes with',
          target: 'layout-sitefooter',
          why: 'SiteHeader and SiteFooter frame a public page: same logo/name props, same light/dark colour variants.',
        },
      ],
    },
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
          <p className="text-neutral-600 dark:text-neutral-400">
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
      <div className="bg-primary-800 rounded-lg p-4">
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
      <div className="bg-primary-800 rounded-lg p-4">
        <NavLinks
          links={defaultLinks}
          variant="light"
          aria-label="Light variant navigation"
        />
      </div>
      <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <NavLinks
          links={defaultLinks}
          variant="dark"
          aria-label="Dark variant navigation"
        />
      </div>
    </div>
  ),
};

export const AuthButtonsDemo: StoryObj<typeof AuthButtons> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-800 rounded-lg p-4">
        <AuthButtons variant="light" onLogin={() => {}} onSignUp={() => {}} />
      </div>
      <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <AuthButtons variant="dark" onLogin={() => {}} onSignUp={() => {}} />
      </div>
    </div>
  ),
};

export const UserMenuDemo: StoryObj<typeof UserMenu> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="bg-primary-800 flex justify-end rounded-lg p-4">
        <UserMenu user={sampleUser} variant="light" onLogout={() => {}} />
      </div>
      <div className="flex justify-end rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <UserMenu user={sampleUser} variant="dark" onLogout={() => {}} />
      </div>
      <div className="flex justify-end rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <UserMenu
          user={{ ...sampleUser, avatarUrl: undefined }}
          variant="dark"
          onLogout={() => {}}
        />
      </div>
    </div>
  ),
};
