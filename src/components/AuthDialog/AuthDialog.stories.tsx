import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AuthDialog, DEFAULT_SOCIAL_PROVIDERS } from './AuthDialog';

const meta: Meta<typeof AuthDialog> = {
  title: 'Components/AuthDialog',
  component: AuthDialog,
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
};

export default meta;
type Story = StoryObj<typeof AuthDialog>;

// Helper component for interactive stories
function AuthDialogDemo(
  props: Partial<React.ComponentProps<typeof AuthDialog>>
) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [mode, setMode] = React.useState(props.mode || 'login');

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
        className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-white"
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
        socialProviders={DEFAULT_SOCIAL_PROVIDERS}
        {...props}
      />
    </div>
  );
}

/** Default login state with all social providers */
export const Default: Story = {
  render: () => <AuthDialogDemo />,
};

/** Signup form with terms acceptance */
export const Signup: Story = {
  render: () => <AuthDialogDemo mode="signup" />,
};

/** Forgot password flow */
export const ForgotPassword: Story = {
  render: () => <AuthDialogDemo mode="forgotPassword" />,
};

/** Email only authentication (no social providers) */
export const NoSocialAuth: Story = {
  render: () => <AuthDialogDemo socialProviders={[]} />,
};

/** Custom branding with logo */
export const CustomBranding: Story = {
  render: () => (
    <AuthDialogDemo
      appName="HealthCare Plus"
      logoUrl="https://via.placeholder.com/150x40/4F46E5/ffffff?text=HealthCare+"
    />
  ),
};
