import type { Meta, StoryObj } from '@storybook/react';
import { ProductVersion, ProductVersionBadge } from './ProductVersion';
import { Card } from '../Card';

const meta: Meta<typeof ProductVersion> = {
  title: 'Components/ProductVersion',
  component: ProductVersion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays product version information, typically used in footers, settings pages, or about dialogs.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'stacked', 'minimal'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    environment: {
      control: 'select',
      options: ['development', 'staging', 'production', undefined],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProductVersion>;

// Default inline display
export const Default: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    author: 'MIE',
  },
};

// Minimal variant
export const Minimal: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    variant: 'minimal',
  },
};

// With build number
export const WithBuild: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    build: 'abc1234',
    author: 'MIE',
  },
};

// With environment
export const WithEnvironment: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0-beta',
    environment: 'staging',
    author: 'MIE',
  },
};

// Development environment
export const Development: Story = {
  args: {
    name: 'BlueHive',
    version: '2.2.0-dev',
    build: 'xyz7890',
    environment: 'development',
    author: 'MIE',
  },
};

// Production environment
export const Production: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    environment: 'production',
    author: 'MIE',
    year: 2024,
  },
};

// Stacked variant
export const Stacked: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    build: 'abc1234',
    environment: 'production',
    author: 'MIE',
    variant: 'stacked',
  },
};

// With changelog link
export const WithChangelog: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    author: 'MIE',
    changelogUrl: 'https://github.com/example/releases',
  },
};

// Small size
export const SmallSize: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    author: 'MIE',
    size: 'sm',
  },
};

// Large size
export const LargeSize: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    author: 'MIE',
    size: 'lg',
  },
};

// In a footer context
export const InFooter: Story = {
  render: () => (
    <footer className="border-border bg-muted/30 border-t px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <ProductVersion
          name="BlueHive"
          version="2.1.0"
          author="MIE"
          variant="minimal"
          size="sm"
        />
        <div className="text-muted-foreground flex gap-4 text-xs">
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Terms of Service
          </a>
          <a href="#" className="hover:underline">
            Help
          </a>
        </div>
      </div>
    </footer>
  ),
};

// In a settings/about page
export const InSettingsPage: Story = {
  render: () => (
    <Card className="mx-auto max-w-md p-6">
      <h3 className="mb-4 font-semibold">About</h3>
      <ProductVersion
        name="BlueHive Healthcare Marketplace"
        version="2.1.0"
        build="a1b2c3d"
        environment="production"
        author="Medical Informatics Engineering"
        year={2024}
        variant="stacked"
      />
    </Card>
  ),
};

// ProductVersionBadge stories
export const Badge: StoryObj<typeof ProductVersionBadge> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <ProductVersionBadge version="2.1.0" />
      <ProductVersionBadge version="2.1.0" build="abc1234" />
      <ProductVersionBadge version="2.1.0" environment="production" />
      <ProductVersionBadge version="2.2.0-beta" environment="staging" />
      <ProductVersionBadge
        version="2.2.0-dev"
        environment="development"
        build="xyz7890"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Compact badge variant for showing version in headers or navigation.',
      },
    },
  },
};

// Multiple products
export const MultipleProducts: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="border-border flex items-center justify-between rounded-lg border p-3">
        <span className="font-medium">Consumer Portal</span>
        <ProductVersionBadge version="2.1.0" environment="production" />
      </div>
      <div className="border-border flex items-center justify-between rounded-lg border p-3">
        <span className="font-medium">Provider Portal</span>
        <ProductVersionBadge version="2.0.5" environment="production" />
      </div>
      <div className="border-border flex items-center justify-between rounded-lg border p-3">
        <span className="font-medium">Employer Portal</span>
        <ProductVersionBadge version="2.2.0-beta" environment="staging" />
      </div>
      <div className="border-border flex items-center justify-between rounded-lg border p-3">
        <span className="font-medium">API Server</span>
        <ProductVersionBadge
          version="1.5.0"
          build="def4567"
          environment="production"
        />
      </div>
    </div>
  ),
};

// Clickable version (for easter egg or debug info)
export const Clickable: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    variant: 'minimal',
    onClick: () => alert('Version clicked! (Could show debug info)'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clickable version - useful for easter eggs or showing debug information.',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    build: 'abc1234',
    environment: 'production',
    author: 'MIE',
    variant: 'stacked',
    size: 'sm',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

// Custom copyright
export const CustomCopyright: Story = {
  args: {
    name: 'BlueHive',
    version: '2.1.0',
    copyright: 'All rights reserved. Healthcare Division.',
    variant: 'stacked',
  },
};
