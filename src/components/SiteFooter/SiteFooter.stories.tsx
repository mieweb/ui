import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  SiteFooter,
  SocialMediaLinks,
  NewsletterForm,
  SimpleFooter,
  type FooterLinkGroup,
  type SocialLink,
} from './SiteFooter';

const defaultSocialLinks: SocialLink[] = [
  { platform: 'instagram', href: 'https://instagram.com/bluehivehealth' },
  { platform: 'linkedin', href: 'https://linkedin.com/company/bluehivehealth' },
  { platform: 'twitter', href: 'https://x.com/bluehivehealth' },
  { platform: 'facebook', href: 'https://facebook.com/bluehiveapp' },
];

const defaultLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Drug Testing', href: '/services/drug-testing' },
      { label: 'DOT Physicals', href: '/services/dot-physicals' },
      { label: 'Occupational Health', href: '/services/occupational-health' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Blog', href: '/blog' },
      {
        label: 'Documentation',
        href: 'https://docs.bluehive.com',
        external: true,
      },
    ],
  },
];

const meta: Meta<typeof SiteFooter> = {
  title: 'Layout/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof SiteFooter>;

// Default full footer
export const Default: Story = {
  args: {
    logo: { name: 'BlueHive', href: '/' },
    description:
      'Connecting employers, providers, and patients for better healthcare outcomes.',
    linkGroups: defaultLinkGroups,
    socialLinks: defaultSocialLinks,
    emergencyDisclaimer: true,
  },
};

// Dark variant
export const DarkVariant: Story = {
  args: {
    variant: 'dark',
    logo: { name: 'BlueHive', href: '/' },
    description:
      'Connecting employers, providers, and patients for better healthcare outcomes.',
    linkGroups: defaultLinkGroups,
    socialLinks: defaultSocialLinks,
    emergencyDisclaimer: true,
  },
};

// With newsletter signup
export const WithNewsletter: Story = {
  args: {
    variant: 'dark',
    logo: { name: 'BlueHive', href: '/' },
    description: 'Stay updated with the latest in healthcare technology.',
    linkGroups: defaultLinkGroups,
    socialLinks: defaultSocialLinks,
    showNewsletter: true,
    onNewsletterSubmit: (email) => alert(`Subscribed: ${email}`),
  },
};

// Minimal footer
export const Minimal: Story = {
  args: {
    companyName: 'BlueHive Health LLC',
    socialLinks: defaultSocialLinks,
  },
};

// Simple footer (for dashboards)
export const Simple: StoryObj<typeof SimpleFooter> = {
  render: () => <SimpleFooter />,
};

// Sub-components
export const SocialLinksDemo: StoryObj<typeof SocialMediaLinks> = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="rounded-lg bg-gray-900 p-6">
        <SocialMediaLinks
          links={defaultSocialLinks}
          variant="light"
          size="lg"
        />
      </div>
      <div className="rounded-lg border bg-white p-6">
        <SocialMediaLinks links={defaultSocialLinks} variant="dark" size="md" />
      </div>
    </div>
  ),
};

export const NewsletterDemo: StoryObj<typeof NewsletterForm> = {
  render: () => (
    <div className="max-w-md space-y-4 p-4">
      <div className="bg-primary-600 rounded-lg p-6">
        <NewsletterForm
          variant="light"
          onSubmit={(email) => alert(`Subscribed: ${email}`)}
        />
      </div>
      <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-900">
        <NewsletterForm
          variant="dark"
          onSubmit={(email) => alert(`Subscribed: ${email}`)}
        />
      </div>
    </div>
  ),
};

// Full page context
export const FullPageDemo: Story = {
  render: () => (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-gray-50 p-8 dark:bg-gray-950">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Page Content
          </h1>
        </div>
      </main>
      <SiteFooter
        variant="dark"
        logo={{ name: 'BlueHive', href: '/' }}
        description="The leading healthcare marketplace."
        linkGroups={defaultLinkGroups}
        socialLinks={defaultSocialLinks}
        showNewsletter={true}
        onNewsletterSubmit={(email) => console.log('Subscribed:', email)}
        emergencyDisclaimer={true}
      />
    </div>
  ),
};
