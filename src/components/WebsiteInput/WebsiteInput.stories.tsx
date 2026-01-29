import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  WebsiteInput,
  WebsiteInputGroup,
  type WebsiteEntry,
} from './WebsiteInput';

// =============================================================================
// WebsiteInput Stories
// =============================================================================

const meta: Meta<typeof WebsiteInput> = {
  title: 'Forms/WebsiteInput',
  component: WebsiteInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'URL input component with validation for websites and social media links.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The URL value',
    },
    validateOnBlur: {
      control: 'boolean',
      description: 'Whether to validate and show error state for invalid URLs',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    label: {
      control: 'text',
      description: 'Label for the input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WebsiteInput>;

// Basic WebsiteInput Stories

export const Default: Story = {
  args: {
    label: 'Website URL',
    placeholder: 'https://example.com',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Website URL',
    value: 'https://bluehivehealth.com',
  },
};

export const WithValidation: Story = {
  args: {
    label: 'Website URL',
    validateOnBlur: true,
    value: 'invalid-url',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Website URL',
    value: 'https://example.com',
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Website URL',
    required: true,
  },
};

// =============================================================================
// WebsiteInputGroup Stories
// =============================================================================

type GroupStory = StoryObj<typeof WebsiteInputGroup>;

function DefaultGroupDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: '', type: 'website' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="Websites & Social Media"
        value={websites}
        onChange={setWebsites}
        validateOnBlur
      />
      <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
        <h4 className="mb-2 text-sm font-medium">Current Value:</h4>
        <pre className="text-xs">{JSON.stringify(websites, null, 2)}</pre>
      </div>
    </div>
  );
}

export const DefaultGroup: GroupStory = {
  render: () => <DefaultGroupDemo />,
};

function WithExistingDataDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: 'https://bluehivehealth.com', type: 'website' },
    { url: 'https://facebook.com/bluehive', type: 'facebook' },
    { url: 'https://linkedin.com/company/bluehive', type: 'linkedin' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="Websites & Social Media"
        value={websites}
        onChange={setWebsites}
        validateOnBlur
      />
    </div>
  );
}

export const WithExistingData: GroupStory = {
  render: () => <WithExistingDataDemo />,
};

function AllSocialTypesDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: 'https://myblog.com', type: 'blog' },
    { url: 'https://facebook.com/mypage', type: 'facebook' },
    { url: 'https://instagram.com/myhandle', type: 'instagram' },
    { url: 'https://linkedin.com/in/myprofile', type: 'linkedin' },
    { url: 'https://pinterest.com/myprofile', type: 'pinterest' },
    { url: 'https://twitter.com/myhandle', type: 'twitter' },
    { url: 'https://mywebsite.com', type: 'website' },
    { url: 'https://yelp.com/biz/mybusiness', type: 'yelp' },
    { url: 'https://youtube.com/c/mychannel', type: 'youtube' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="All Social Media Types"
        value={websites}
        onChange={setWebsites}
        maxEntries={10}
      />
    </div>
  );
}

export const AllSocialTypes: GroupStory = {
  render: () => <AllSocialTypesDemo />,
};

function DisabledGroupDemo() {
  const [websites] = React.useState<WebsiteEntry[]>([
    { url: 'https://example.com', type: 'website' },
    { url: 'https://facebook.com/example', type: 'facebook' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="Websites (Disabled)"
        value={websites}
        onChange={() => {}}
        disabled
      />
    </div>
  );
}

export const DisabledGroup: GroupStory = {
  render: () => <DisabledGroupDemo />,
};

function MinMaxEntriesDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: '', type: 'website' },
    { url: '', type: 'facebook' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="Websites (Min: 2, Max: 4)"
        value={websites}
        onChange={setWebsites}
        minEntries={2}
        maxEntries={4}
      />
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Minimum 2 entries required, maximum 4 allowed.
      </p>
    </div>
  );
}

export const MinMaxEntries: GroupStory = {
  render: () => <MinMaxEntriesDemo />,
};

function WithCustomLabelsDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: '', type: 'website' },
  ]);

  return (
    <div className="w-full max-w-2xl">
      <WebsiteInputGroup
        label="Enlaces Web"
        value={websites}
        onChange={setWebsites}
        typeLabels={{
          website: 'Sitio Web',
          blog: 'Blog',
          facebook: 'Facebook',
          instagram: 'Instagram',
          linkedin: 'LinkedIn',
          pinterest: 'Pinterest',
          twitter: 'Twitter/X',
          yelp: 'Yelp',
          youtube: 'YouTube',
        }}
      />
    </div>
  );
}

export const WithCustomLabels: GroupStory = {
  render: () => <WithCustomLabelsDemo />,
};

function MobileViewDemo() {
  const [websites, setWebsites] = React.useState<WebsiteEntry[]>([
    { url: 'https://example.com', type: 'website' },
    { url: 'https://instagram.com/example', type: 'instagram' },
  ]);

  return (
    <div className="w-full max-w-sm">
      <WebsiteInputGroup
        label="Websites"
        value={websites}
        onChange={setWebsites}
        validateOnBlur
      />
    </div>
  );
}

export const MobileView: GroupStory = {
  render: () => <MobileViewDemo />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
