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
  id: 'layout-sitefooter',
  title: 'Components/Layout/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The public-site \`<footer>\`**: brand block (\`logo\`, \`description\`, \`socialLinks\`), up to four \`linkGroups\` (\`{ title, links: [{ label, href, external? }] }\`), an optional newsletter form (\`showNewsletter\`, \`onNewsletterSubmit(email)\`, \`newsletterPlaceholder\`), then a bottom row with \`CopyrightText\` (\`companyName\`, default **"BlueHive Health LLC"**) and \`LegalLinks\` (\`privacyHref\`, \`termsHref\`, \`cookiesHref\`, \`additionalLegalLinks\`), plus \`disclaimer\` and the \`emergencyDisclaimer\` ("call 911") line. \`variant\`: \`default\` (grey) | \`dark\` | \`primary\` | \`white\`. Pieces are exported for custom footers: \`FooterSocialLinks\`, \`NewsletterForm\`, \`FooterLinkSection\`, \`CopyrightText\`, \`LegalLinks\`, \`DisclaimerText\`; \`SimpleFooter\` is the one-line © + Privacy + Terms variant for app or auth pages.

### Use it when

- Marketing / help / legal pages that need the standard columns, social icons and legal strip.
- Signed-in pages that only need a thin © line — \`SimpleFooter\`.

### Don't use it when

- You need only the version / build line — \`ProductVersion\` (drop it next to \`SimpleFooter\`).
- The footer must contain arbitrary content or a sitemap deeper than one level — compose the exported pieces in your own \`<footer>\`.
- Links must be router links — every link is a plain \`<a href>\`.

### Example

\`\`\`tsx
const subscribe = useMutation(subscribeToNewsletter);

<SiteFooter
  variant="dark"
  logo={{ name: 'BlueHive', href: '/' }}
  description="Occupational health, connected."
  socialLinks={[{ platform: 'linkedin', href: 'https://linkedin.com/company/bluehivehealth' }]}
  linkGroups={footerGroups}
  showNewsletter
  onNewsletterSubmit={(email) => subscribe.mutate({ email })}
  companyName="BlueHive Health LLC"
  privacyHref="/privacy"
  termsHref="/terms"
  emergencyDisclaimer
/>
\`\`\`

\`NewsletterForm\` owns the input value and clears it after calling \`onSubmit\`; the host owns the request.

### Limitations

- Accessibility: a \`<footer>\` landmark; \`LegalLinks\` is a \`<nav>\` **without a label**, and link-group columns are plain \`<ul>\`s under \`<h3>\`s (no \`nav\`). Social links get \`aria-label\` (\`label\` or \`"Follow us on {platform}"\`) and open in a new tab with no hint. The newsletter \`<input type="email">\` has **no label** (placeholder only) and no success / error state — \`isLoading\` is on \`NewsletterForm\` but \`SiteFooter\` never passes it. \`external\` links show an icon but no "opens in new tab" text.
- i18n: hard-coded English \`"Subscribe to our newsletter"\`, \`"Enter your email"\`, \`"Sign Up"\`, \`"Sending..."\`, \`"Privacy Policy"\`, \`"Terms & Conditions"\`, \`"Cookie Policy"\`, \`"Privacy"\`, \`"Terms"\`, the 911 sentence and the default company name; \`year\` is the runtime year, not formatted.
- Layout: \`container mx-auto px-4 py-12\`, 1 → 2 → 12-column grid; link groups fill \`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4\` so a fifth group wraps. \`SimpleFooter\` and \`LegalLinks\` separators use physical \`sm:text-left\` and \`ml-1\`; otherwise symmetric.
- Theming: only \`primary\` uses a brand token (\`bg-primary-800\`); grey/dark/white variants and all text are hard-coded \`gray-*\` / \`white/NN\` with \`dark:\` variants. Social icons are inline SVGs (no icon library). Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-siteheader',
          why: 'SiteHeader and SiteFooter frame a public page: same logo/name props, same light/dark colour variants.',
        },
        {
          type: 'composes with',
          target: 'layout-productversion',
          why: 'ProductVersion sits in or under SiteFooter / SimpleFooter to show the deployed version next to the copyright line.',
        },
      ],
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'dark', 'primary', 'white'],
      description: 'Visual style variant',
    },
    description: {
      control: 'text',
      description: 'Footer description text',
    },
    companyName: {
      control: 'text',
      description: 'Company name for copyright',
    },
    showNewsletter: {
      control: 'boolean',
      description: 'Show newsletter signup form',
    },
    emergencyDisclaimer: {
      control: 'boolean',
      description: 'Show emergency 911 disclaimer',
    },
    privacyHref: { control: 'text' },
    termsHref: { control: 'text' },
    cookiesHref: { control: 'text' },
    newsletterPlaceholder: { control: 'text' },
    additionalLegalLinks: { table: { disable: true } },
    disclaimer: { table: { disable: true } },
    logo: { table: { disable: true } },
    linkGroups: { table: { disable: true } },
    socialLinks: { table: { disable: true } },
    onNewsletterSubmit: { action: 'newsletter-submitted' },
  },
  args: {
    logo: { name: 'BlueHive', href: '/' },
    description:
      'Connecting employers, providers, and patients for better healthcare outcomes.',
    linkGroups: defaultLinkGroups,
    socialLinks: defaultSocialLinks,
    emergencyDisclaimer: true,
    variant: 'default',
  },
};

export default meta;
type Story = StoryObj<typeof SiteFooter>;

// Default full footer
export const Default: Story = {};

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
    onNewsletterSubmit: (email) => window.alert(`Subscribed: ${email}`),
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
  parameters: {
    a11y: {
      config: {
        // Newsletter input placeholder text on dark background only needs
        // 3:1 contrast per WCAG (non-text contrast for UI components).
        // axe-core incorrectly applies the 4.5:1 text rule to placeholders.
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  render: () => (
    <div className="max-w-md space-y-4 p-4">
      <div className="bg-primary-800 rounded-lg p-6">
        <NewsletterForm
          variant="light"
          onSubmit={(email) => window.alert(`Subscribed: ${email}`)}
        />
      </div>
      <div className="rounded-lg bg-gray-100 p-6 dark:bg-gray-900">
        <NewsletterForm
          variant="dark"
          onSubmit={(email) => window.alert(`Subscribed: ${email}`)}
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
