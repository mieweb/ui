import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AuthDialog, AuthMode, DEFAULT_SOCIAL_PROVIDERS } from './AuthDialog';

// Demo-only controls interface
interface DemoControls {
  /** Initial auth mode to display */
  initialMode: AuthMode;
  /** Show social login providers */
  showSocialProviders: boolean;
  /** App name for branding */
  appName: string;
  /** Logo URL for custom branding */
  logoUrl: string;
  /** Terms of service URL */
  termsUrl: string;
  /** Privacy policy URL */
  privacyUrl: string;
  /** Require email verification after signup */
  requireEmailVerification: boolean;
}

// Helper component for interactive stories
// Defined before meta so it can be referenced as the component
function AuthDialogDemo({
  initialMode = 'login',
  showSocialProviders = true,
  appName = 'BlueHive',
  logoUrl,
  termsUrl = '/terms',
  privacyUrl = '/privacy',
  requireEmailVerification = false,
}: DemoControls) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [mode, setMode] = React.useState<AuthMode>(initialMode);

  // Sync mode with initialMode arg changes
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Continuously prevent AuthDialog from locking body scroll in Storybook docs
  // The AuthDialog sets overflow:hidden on body, which breaks docs page scrolling
  React.useEffect(() => {
    const observer = new window.MutationObserver(() => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });
    // Also clear immediately in case it's already set
    document.body.style.overflow = '';
    return () => {
      observer.disconnect();
      document.body.style.overflow = '';
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (email === 'error@test.com') {
      throw new Error('Invalid email or password');
    }
    console.log('Login:', { email, password });
  };

  const handleSignup = async (data: { email: string; password: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Signup:', data);
  };

  const handleSocialLogin = async (providerId: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Social login:', providerId);
  };

  const handleForgotPassword = async (email: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Forgot password:', email);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 dark:bg-gray-900">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary-800 hover:bg-primary-900 rounded-lg px-4 py-2 text-white"
      >
        Open Auth Dialog
      </button>
      <AuthDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={mode}
        onModeChange={setMode}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onSocialLogin={handleSocialLogin}
        onForgotPassword={handleForgotPassword}
        socialProviders={showSocialProviders ? DEFAULT_SOCIAL_PROVIDERS : []}
        appName={appName}
        logoUrl={logoUrl || undefined}
        termsUrl={termsUrl}
        privacyUrl={privacyUrl}
        requireEmailVerification={requireEmailVerification}
      />
    </div>
  );
}

type AuthDialogStoryProps = DemoControls;

const meta: Meta<AuthDialogStoryProps> = {
  title: 'Feedback & Overlays/AuthDialog',
  component: AuthDialogDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive authentication dialog with login, signup, forgot password, and social auth flows.',
      },
    },
  },
  argTypes: {
    // Demo Controls
    initialMode: {
      control: 'select',
      options: ['login', 'signup', 'forgotPassword', 'resetPassword', 'verify'],
      description: 'Initial auth mode to display',
      table: { category: 'Demo Controls' },
    },
    showSocialProviders: {
      control: 'boolean',
      description: 'Show social login providers (Google, Microsoft, etc.)',
      table: { category: 'Demo Controls' },
    },
    // Branding
    appName: {
      control: 'text',
      description: 'App name displayed in the dialog header',
      table: { category: 'Branding' },
    },
    logoUrl: {
      control: 'text',
      description: 'Logo URL for custom branding',
      table: { category: 'Branding' },
    },
    // URLs
    termsUrl: {
      control: 'text',
      description: 'Terms of service URL',
      table: { category: 'URLs' },
    },
    privacyUrl: {
      control: 'text',
      description: 'Privacy policy URL',
      table: { category: 'URLs' },
    },
    // Settings
    requireEmailVerification: {
      control: 'boolean',
      description: 'Require email verification after signup',
      table: { category: 'Settings' },
    },
  },
  args: {
    initialMode: 'login',
    showSocialProviders: true,
    appName: 'BlueHive',
    logoUrl: '',
    termsUrl: '/terms',
    privacyUrl: '/privacy',
    requireEmailVerification: false,
  },
};

export default meta;
type Story = StoryObj<AuthDialogStoryProps>;

/** Default login state with all social providers */
export const Default: Story = {
  render: (args) => <AuthDialogDemo {...args} />,
};

/** Signup form with terms acceptance */
export const Signup: Story = {
  args: {
    initialMode: 'signup',
  },
  render: (args) => <AuthDialogDemo {...args} />,
};

/** Forgot password flow */
export const ForgotPassword: Story = {
  args: {
    initialMode: 'forgotPassword',
  },
  render: (args) => <AuthDialogDemo {...args} />,
};

/** Email only authentication (no social providers) */
export const NoSocialAuth: Story = {
  args: {
    showSocialProviders: false,
  },
  render: (args) => <AuthDialogDemo {...args} />,
};

/** Custom branding with logo */
export const CustomBranding: Story = {
  args: {
    appName: 'HealthCare Plus',
    logoUrl: 'https://placehold.co/150x40/4F46E5/ffffff?text=HealthCare%2B',
  },
  render: (args) => <AuthDialogDemo {...args} />,
};
