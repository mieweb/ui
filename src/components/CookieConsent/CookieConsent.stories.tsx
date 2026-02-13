import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  CookieConsentBanner,
  CompactCookieBanner,
  useCookieConsent,
} from './CookieConsent';

const meta: Meta<typeof CookieConsentBanner> = {
  title: 'Feedback & Overlays/CookieConsent',
  component: CookieConsentBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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
          <p className="text-gray-600 dark:text-gray-400">
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
        <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
          Consent Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
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
