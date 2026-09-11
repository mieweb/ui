import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import {
  type WebsiteEntry,
  WebsiteInput,
  WebsiteInputGroup,
} from './WebsiteInput';

// =============================================================================
// WebsiteInput Stories
// =============================================================================

const meta: Meta<typeof WebsiteInput> = {
  id: 'text-inputs-websiteinput',
  title: 'Inputs/Text inputs/WebsiteInput',
  component: WebsiteInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The URL field. \`WebsiteInput\` is an \`Input\` with \`type="url"\`, \`inputMode="url"\`, \`autoComplete="url"\` and a \`https://example.com\` placeholder; \`onChange(value: string)\` hands back the raw string, and \`validateOnBlur\` shows an error when the text cannot be parsed as a URL even after prefixing \`https://\`. All other \`Input\` props pass through. The folder also exports \`WebsiteInputGroup\` (a repeater with a \`WebsiteType\` select — \`website\`, \`blog\`, \`facebook\`, \`instagram\`, \`linkedin\`, \`pinterest\`, \`twitter\`, \`yelp\`, \`youtube\` — and add/remove buttons, \`minEntries\` 1 / \`maxEntries\` 10), the \`WEBSITE_TYPES\` option list, the \`isValidUrl\` helper and the \`WebsiteEntry\` / \`WebsiteType\` types.

### Use it when

- A form collects a website or social-profile link and should reject obvious non-URLs.
- A record holds several links with a type — \`WebsiteInputGroup\`, which picks a type-specific placeholder per row.

### Don't use it when

- The value is not a URL — plain \`Input\` (never a raw \`type="url"\`).
- You must guarantee a scheme or a reachable host — validation is syntactic only; normalise (\`https://\` prefix) and verify on the server.
- The list is of phone numbers — \`PhoneInputGroup\`.

### Example

\`\`\`tsx
const [site, setSite] = React.useState('');

<WebsiteInput
  label="Practice website"
  value={site}
  onChange={setSite}
  validateOnBlur
  helperText="Include https:// if you have it."
/>
\`\`\`

Both components are controlled: \`WebsiteInput\` defaults \`value\` to \`''\`; \`WebsiteInputGroup\` requires \`value: WebsiteEntry[]\` and \`onChange\` and pads the array to \`minEntries\`.

### Limitations

- Inherits \`Input\`'s wiring (\`<label htmlFor>\`, \`aria-invalid\`, \`aria-describedby\` → \`<p role="alert">\` error / helper text). Because \`type="url"\`, the browser's own constraint validation may also fire on form submit if the value has no scheme.
- \`isValidUrl\` accepts anything \`new URL()\` can parse with \`https://\` prepended — \`"example"\` passes; \`""\` is treated as valid. The value is **not** rewritten with the scheme; the host decides.
- Hard-coded English: the blur error \`"Please enter a valid URL"\`, the default placeholders, the group's sr-only \`"URL type"\` label and the \`"Add website"\` / \`"Remove website"\` button labels. Only option labels are translatable, via \`typeLabels\`.
- In the group only the first row gets the visible \`label\`; later rows are unlabelled. Type select ids are \`website-type-{index}\` (duplicates across two groups). Removing a row does not manage focus or announce.
- The group's select and buttons use hard-coded palette classes (\`border-gray-300\`, \`text-brand-600\`, \`text-red-600\`, \`dark:bg-gray-800\`) rather than semantic tokens. Layouts are flex/\`gap-2\` — RTL-safe. No external dependencies.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-input',
          why: 'WebsiteInput validates URLs on blur; never use a raw Input type="url".',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'Renders an Input with type="url" and inherits its label/error wiring.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The URL value (controlled; defaults to an empty string)',
    },
    validateOnBlur: {
      control: 'boolean',
      description:
        'Show "Please enter a valid URL" on blur when the value cannot be parsed even with https:// prefixed',
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
      <p className="text-muted-foreground mt-2 text-sm">
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
