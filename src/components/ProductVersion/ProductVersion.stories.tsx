import type { Meta, StoryObj } from '@storybook/react';

import { Card } from '../Card';
import { ProductVersion, ProductVersionBadge } from './ProductVersion';

const meta: Meta<typeof ProductVersion> = {
  id: 'layout-productversion',
  title: 'Components/Layout/ProductVersion',
  component: ProductVersion,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

**The "BlueHive v2.1.0 (abc1234) · © 2026 MIE" line** for footers, About dialogs and settings pages. \`ProductVersion\` takes \`name\`, \`version\` (a \`v\` prefix is added if missing), optional \`build\`, \`environment\` (\`development\` | \`staging\` | \`production\` | any string — known values get yellow / blue / green pills), copyright via \`author\` + \`year\` (default current year) or a literal \`copyright\`, \`variant\` (\`inline\` | \`stacked\` | \`minimal\`), \`size\` (\`sm\` | \`md\` | \`lg\`). With \`changelogUrl\` it renders as an \`<a target="_blank">\`; with only \`onClick\` as a \`<button>\`; otherwise a \`div\`. \`ProductVersionBadge\` is the compact monospace chip: \`version\`, \`build\` (first 7 chars), \`environment\` (first 3 letters, upper-cased) on a tinted border.

### Use it when

- A site or app footer, About sheet or diagnostics panel must show what is deployed, ideally linking to release notes.
- A header or status bar needs a small environment indicator (\`ProductVersionBadge\` with \`environment="staging"\`) so testers know where they are.

### Don't use it when

- You need the whole footer — \`SiteFooter\` / \`SimpleFooter\` (they render their own \`CopyrightText\`; drop \`ProductVersion\` into the footer's content instead of duplicating the © line).
- The label is a generic status, not a version — \`Badge\`.
- Copy must be localised — the separators and "Build:" prefix are fixed English (see Limitations).

### Example

\`\`\`tsx
// values come from the build, not from state
const { name, version, commit, env } = window.__APP_INFO__;

<SimpleFooter companyName="MIE" />
<div className="container mx-auto flex justify-center py-2">
  <ProductVersion
    name={name}
    version={version}
    build={commit.slice(0, 7)}
    environment={env}
    changelogUrl={\`https://github.com/mieweb/ui/releases/tag/v\${version}\`}
    variant="minimal"
    size="sm"
  />
</div>
\`\`\`

\`minimal\` omits the environment pill and copyright; use \`inline\` when the footer has no separate © line.

### Limitations

- Accessibility: the link form opens a new tab (\`target="_blank" rel="noopener noreferrer"\`) with **no visible or spoken "opens in new tab" hint**; when \`changelogUrl\` and \`onClick\` are both set the anchor gets the click handler too. The \`<button>\` form has no \`aria-label\` beyond its text. \`ProductVersionBadge\` truncates \`environment\` to three letters (\`"pro"\`, \`"sta"\`) with no expansion for AT.
- i18n: hard-coded English \`"Build:"\`, \`"©"\` + year ordering, the \`•\` separator and the \`v\` prefix; \`year\` is not formatted with \`Intl\`.
- RTL: \`minimal\` uses physical \`ml-1\` for the build suffix; other variants use symmetric flex gaps. \`stacked\` always centres.
- Theming: text uses \`text-muted-foreground\`; environment pills and badge borders are hard-coded \`yellow-*\` / \`blue-*\` / \`green-*\` (with \`dark:\` variants), not brand tokens. No dependencies beyond \`cn\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-sitefooter',
          why: 'ProductVersion sits in or under SiteFooter / SimpleFooter to show the deployed version next to the copyright line.',
        },
        {
          type: 'alternative to',
          target: 'data-display-badge',
          why: 'ProductVersionBadge is a fixed monospace version + environment chip; Badge is the generic status label with variants you choose.',
        },
      ],
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
    <footer className="bg-muted/30 border-t border-border px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <ProductVersion
          name="BlueHive"
          version="2.1.0"
          author="MIE"
          variant="minimal"
          size="sm"
        />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <button type="button" className="hover:underline">
            Privacy Policy
          </button>
          <button type="button" className="hover:underline">
            Terms of Service
          </button>
          <button type="button" className="hover:underline">
            Help
          </button>
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
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="font-medium">Consumer Portal</span>
        <ProductVersionBadge version="2.1.0" environment="production" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="font-medium">Provider Portal</span>
        <ProductVersionBadge version="2.0.5" environment="production" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="font-medium">Employer Portal</span>
        <ProductVersionBadge version="2.2.0-beta" environment="staging" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
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
    onClick: () => window.alert('Version clicked! (Could show debug info)'),
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
