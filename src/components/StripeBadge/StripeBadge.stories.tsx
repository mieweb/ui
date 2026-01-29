import type { Meta, StoryObj } from '@storybook/react';
import { StripeBadge, StripeSecureBadge } from './StripeBadge';
import { Card } from '../Card';
import { Input } from '../Input';
import { Button } from '../Button';

const meta: Meta<typeof StripeBadge> = {
  title: 'Components/StripeBadge',
  component: StripeBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Badge indicating Stripe payment processing. Used in payment forms and checkout pages to build trust and indicate security.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'minimal'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showPoweredBy: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StripeBadge>;

// Default badge
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    showPoweredBy: true,
  },
};

// Outline variant
export const Outline: Story = {
  args: {
    variant: 'outline',
    showPoweredBy: true,
  },
};

// Minimal variant
export const Minimal: Story = {
  args: {
    variant: 'minimal',
    showPoweredBy: true,
  },
};

// Logo only (no "Powered by" text)
export const LogoOnly: Story = {
  args: {
    variant: 'default',
    showPoweredBy: false,
  },
};

// Small size
export const Small: Story = {
  args: {
    variant: 'default',
    size: 'sm',
    showPoweredBy: true,
  },
};

// Large size
export const Large: Story = {
  args: {
    variant: 'default',
    size: 'lg',
    showPoweredBy: true,
  },
};

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <StripeBadge size="sm" />
      <StripeBadge size="md" />
      <StripeBadge size="lg" />
    </div>
  ),
};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <StripeBadge variant="default" />
      <StripeBadge variant="outline" />
      <StripeBadge variant="minimal" />
    </div>
  ),
};

// Secure badge variant
export const SecureBadge: StoryObj<typeof StripeSecureBadge> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StripeSecureBadge size="sm" />
      <StripeSecureBadge size="md" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Security-focused badge variant with lock icon, ideal for placement near sensitive form fields.',
      },
    },
  },
};

// In payment form context
export const InPaymentForm: Story = {
  render: () => (
    <Card className="mx-auto max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="card-number" className="mb-1 block text-sm font-medium">Card Number</label>
          <Input id="card-number" placeholder="4242 4242 4242 4242" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="card-expiry" className="mb-1 block text-sm font-medium">Expiry</label>
            <Input id="card-expiry" placeholder="MM / YY" />
          </div>
          <div>
            <label htmlFor="card-cvc" className="mb-1 block text-sm font-medium">CVC</label>
            <Input id="card-cvc" placeholder="123" />
          </div>
        </div>

        <Button className="w-full">Pay $99.00</Button>

        <div className="flex justify-center">
          <StripeBadge variant="minimal" size="sm" />
        </div>
      </div>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of StripeBadge placement in a payment form.',
      },
    },
  },
};

// In checkout footer
export const InCheckoutFooter: Story = {
  render: () => (
    <div className="border-border flex items-center justify-between border-t pt-4">
      <StripeSecureBadge size="sm" />
      <div className="text-muted-foreground flex items-center gap-4 text-xs">
        <span>256-bit SSL encryption</span>
        <span>•</span>
        <button type="button" className="hover:underline">
          Privacy Policy
        </button>
      </div>
    </div>
  ),
};

// In subscription card
export const InSubscriptionCard: Story = {
  render: () => (
    <Card className="max-w-sm p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Pro Plan</h3>
          <p className="text-2xl font-bold">
            $29
            <span className="text-muted-foreground text-sm font-normal">
              /month
            </span>
          </p>
        </div>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Unlimited appointments
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Priority support
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Advanced analytics
          </li>
        </ul>

        <Button className="w-full">Subscribe</Button>

        <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
          <span>Cancel anytime</span>
          <span>•</span>
          <StripeBadge variant="minimal" size="sm" showPoweredBy={false} />
        </div>
      </div>
    </Card>
  ),
};

// Without link
export const WithoutLink: Story = {
  args: {
    href: undefined,
    showPoweredBy: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge without link - rendered as a div instead of anchor.',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    variant: 'default',
    size: 'sm',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="flex justify-center p-4">
        <Story />
      </div>
    ),
  ],
};

// Dark mode showcase
export const DarkModeShowcase: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-white p-4">
        <p className="mb-2 text-sm text-gray-600">Light mode</p>
        <div className="space-y-2">
          <StripeBadge variant="default" />
          <StripeBadge variant="outline" />
          <StripeSecureBadge />
        </div>
      </Card>
      <Card className="bg-slate-900 p-4">
        <p className="mb-2 text-sm text-slate-400">Dark mode</p>
        <div className="dark space-y-2">
          <StripeBadge variant="default" />
          <StripeBadge variant="outline" />
          <StripeSecureBadge />
        </div>
      </Card>
    </div>
  ),
};
