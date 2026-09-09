import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  CookieConsentBanner,
  CompactCookieBanner,
  useCookieConsent,
} from './CookieConsent';

const meta: Meta<typeof CookieConsentBanner> = {
  id: 'overlays-cookieconsent',
  title: 'Components/Overlays/CookieConsent',
  component: CookieConsentBanner,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A fixed-position consent banner (\`role="dialog"\`, \`aria-live="polite"\`) with Accept and optional Decline / Customize buttons and links to terms, privacy and cookie policies. \`position\` (\`bottom\`, \`top\`, \`bottom-left\`, \`bottom-right\`) and \`variant\` (\`default\`, \`minimal\`, \`branded\`) control the presentation; \`isVisible\` is controlled by the host, which also persists the choice.

### Use it when

- A public-facing site or app must obtain cookie/tracking consent before setting non-essential cookies.
- You need the standard accept / decline / customise trio with policy links.

### Don't use it when

- The message is not a consent request — use \`Alert\` (inline) or \`Toast\` (transient).
- Consent needs a full preferences form — open a \`Modal\` from \`onCustomize\`.
- Inside an authenticated clinical app where consent is handled contractually; do not show it out of habit.

### Example

\`\`\`tsx
const [consent, setConsent] = useStoredConsent();

<CookieConsentBanner
  isVisible={consent === undefined}
  onAccept={() => setConsent('all')}
  onDecline={() => setConsent('essential')}
  showDecline
  privacyLink={{ label: 'Privacy policy', href: '/privacy' }}
  cookieLink={{ label: 'Cookie policy', href: '/cookies' }}
/>
\`\`\`

### Limitations

- Non-modal: no focus trap or scroll lock, so the page stays usable; the polite live region announces it once.
- Default \`message\` and button labels are English — pass translated strings.
- Positioned with physical \`left/right\` classes; check the corner variants in RTL.
- Fixed \`z-50\`, the same layer as \`Modal\`; open a Modal after the banner is dismissed or stacking will follow DOM order.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'feedback-alert',
          why: 'Alert is inline content; CookieConsent is a fixed consent banner with accept/decline actions.',
        },
      ],
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom', 'top', 'bottom-left', 'bottom-right'],
      description: 'Position of the banner on the screen',
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'branded'],
      description: 'Visual style variant',
    },
    isVisible: {
      control: 'boolean',
      description: 'Whether the banner is visible',
    },
    showDecline: {
      control: 'boolean',
      description: 'Whether to show the decline button',
    },
    showCustomize: {
      control: 'boolean',
      description: 'Whether to show the customize button',
    },
    message: {
      control: 'text',
      description: 'Main message text',
    },
    acceptText: {
      control: 'text',
      description: 'Text for the accept button',
    },
    declineText: {
      control: 'text',
      description: 'Text for the decline button',
    },
    customizeText: {
      control: 'text',
      description: 'Text for the customize button',
    },
    appName: {
      control: 'text',
      description: 'App name to display in message',
    },
    isMobileApp: {
      control: 'boolean',
      description: 'Whether this is a mobile/app context',
    },
    termsLink: {
      control: false,
      description: 'Link to terms and conditions',
    },
    privacyLink: {
      control: false,
      description: 'Link to privacy policy',
    },
    cookieLink: {
      control: false,
      description: 'Link to cookie policy',
    },
    onAccept: { action: 'onAccept' },
    onDecline: { action: 'onDecline' },
    onCustomize: { action: 'onCustomize' },
  },
  args: {
    isVisible: true,
    showDecline: false,
    showCustomize: false,
    termsLink: { label: 'Terms and Conditions', href: '/terms' },
    privacyLink: { label: 'Privacy Policy', href: '/privacy' },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-gray-100 p-4 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to BlueHive
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Page content to demonstrate the cookie consent banner.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CookieConsentBanner>;

/**
 * Interactive playground with all controls available.
 * Use the Controls panel to toggle showDecline and showCustomize.
 */
export const Playground: Story = {};

// Default banner with controls
export const Default: Story = {
  args: {
    showDecline: false,
    showCustomize: false,
  },
};

// Banner with all options (accept, decline, customize)
export const WithAllOptions: Story = {
  args: {
    showDecline: true,
    showCustomize: true,
    cookieLink: { label: 'Cookie Policy', href: '/cookies' },
  },
};

// Corner position card
export const CornerCard: Story = {
  args: {
    position: 'bottom-right',
  },
};

// Compact one-line banner
export const Compact: StoryObj<typeof CompactCookieBanner> = {
  render: () => (
    <CompactCookieBanner
      isVisible={true}
      onAccept={() => window.alert('Accepted')}
      privacyHref="/privacy"
    />
  ),
};

// Interactive demo with hook
function InteractiveDemo() {
  const {
    showBanner,
    acceptCookies,
    declineCookies,
    resetConsent,
    hasConsented,
  } = useCookieConsent();

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
        <h2 className="mb-2 font-medium text-gray-900 dark:text-white">
          Consent Status
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Has consented: <strong>{hasConsented ? 'Yes' : 'No'}</strong>
        </p>
        <button
          onClick={resetConsent}
          className="mt-2 rounded bg-gray-200 px-3 py-1 text-sm dark:bg-gray-700"
        >
          Reset Consent
        </button>
      </div>

      <CookieConsentBanner
        isVisible={showBanner}
        onAccept={acceptCookies}
        onDecline={declineCookies}
        showDecline
        termsLink={{ label: 'Terms', href: '/terms' }}
        privacyLink={{ label: 'Privacy', href: '/privacy' }}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
