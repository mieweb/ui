import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, BreadcrumbProps, BreadcrumbSlash } from './Breadcrumb';
import { ChevronRight } from 'lucide-react';
import React from 'react';

// Map of separator names to React elements
const separatorMap: Record<string, React.ReactNode> = {
  chevron: <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />,
  slash: <BreadcrumbSlash />,
  arrow: <span className="text-muted-foreground">→</span>,
  guillemet: <span className="text-muted-foreground">›</span>,
  pipe: <span className="text-muted-foreground">|</span>,
  dot: <span className="text-muted-foreground">•</span>,
};

// Custom args type that uses separatorName instead of separator ReactNode
type BreadcrumbStoryArgs = Omit<BreadcrumbProps, 'separator'> & {
  separatorName?: keyof typeof separatorMap;
};

const meta: Meta<BreadcrumbStoryArgs> = {
  id: 'navigation-breadcrumb',
  title: 'Components/Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**"You are here" in a hierarchy**: a \`<nav aria-label="Breadcrumb">\` with an ordered list of ancestors ending in the current page. Pass \`items: BreadcrumbItem[]\` (\`{ label, href?, icon? }\`); every item with an \`href\` except the last renders as a link, the last (or any item without \`href\`) renders as the current page with \`aria-current="page"\`. \`separator\` swaps the chevron (\`BreadcrumbSlash\` is provided), \`maxItems\` collapses the middle into "…" (first item, ellipsis, then the last \`maxItems − 1\`), and \`renderLink(item, index)\` lets you substitute your router's \`<Link>\`.

### Use it when

- The page sits two or more levels deep in a tree the user can climb back up (Employers › Acme Inc › Locations › Fort Wayne).
- Paths can get long and you want them bounded — \`maxItems\`.

### Don't use it when

- The user is switching between **peer views** of one page — \`Tabs\`.
- It is the site's **primary navigation** — \`Sidebar\` / \`AppHeader\`; breadcrumbs are secondary wayfinding.
- The path is one level deep — a "Back" \`Button\` or the \`PageHeader\` title alone is clearer.
- You need in-page section navigation — \`TableOfContents\` / \`SectionSpyNav\`.

### Example

\`\`\`tsx
const crumbs = useMatches().map((m) => ({ label: m.handle.title, href: m.pathname }));

<PageHeader title={employer.name}>
  <Breadcrumb
    items={[{ label: 'Home', href: '/', icon: <HomeIcon size={14} /> }, ...crumbs]}
    maxItems={4}
    renderLink={(item) => <Link to={item.href!}>{item.icon}{item.label}</Link>}
  />
</PageHeader>
\`\`\`

Stateless: the host derives the items from its router.

### Limitations

- Accessibility: \`<nav aria-label="Breadcrumb">\` › \`<ol>\` › \`<li>\`; separators are \`aria-hidden\`; the current page is a \`<span aria-current="page">\` (not a link). The collapsed "…" is a plain \`<span>\` — **not a button**, so hidden ancestors are unreachable; use a \`Dropdown\` in \`renderLink\` or a larger \`maxItems\` when they matter. The hard-coded English \`aria-label="Breadcrumb"\` is not a prop.
- Default links are plain \`<a href>\` (full navigation); pass \`renderLink\` for client-side routing. \`renderLink\` is *not* used for the last item.
- \`maxItems\` below 2 still shows at least the first item and the ellipsis; \`icon\` is rendered as-is (add \`aria-hidden\` yourself).
- RTL: the default chevron separator mirrors (\`rtl:-scale-x-100\`); custom \`separator\` content is your responsibility. Items \`flex-wrap\` onto new lines rather than truncating.
- Theming: semantic tokens only (\`text-muted-foreground\`, \`text-foreground\`, \`ring-ring\`). No dependencies beyond \`cn\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'layout-pageheader',
          why: 'Breadcrumb in PageHeader children shows where the titled page sits in the hierarchy.',
        },
        {
          type: 'alternative to',
          target: 'navigation-tabs',
          why: 'Breadcrumb shows the ancestor path of the current page; Tabs switch between peer views inside one page.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    separatorName: {
      control: 'select',
      options: Object.keys(separatorMap),
      description: 'The separator between breadcrumb items',
      table: {
        defaultValue: { summary: 'chevron' },
      },
    },
    separator: {
      table: { disable: true },
    },
    renderLink: {
      control: false,
      description: 'Custom render function for links',
    },
  } as Meta<BreadcrumbStoryArgs>['argTypes'],
  // Convert separatorName to separator ReactNode
  render: ({ separatorName = 'chevron', ...args }) => (
    <Breadcrumb {...args} separator={separatorMap[separatorName]} />
  ),
};

export default meta;
type Story = StoryObj<BreadcrumbStoryArgs>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Smartphones' },
    ],
    separatorName: 'chevron',
  },
};

export const TwoItems: Story = {
  args: {
    items: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }],
    separatorName: 'chevron',
  },
};

export const WithSlashSeparator: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'Data' },
    ],
    separatorName: 'slash',
  },
};

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export const WithIcons: Story = {
  args: {
    items: [
      { label: 'Home', href: '/', icon: <HomeIcon /> },
      { label: 'Documents', href: '/documents', icon: <FolderIcon /> },
      { label: 'Reports', href: '/documents/reports', icon: <FolderIcon /> },
      { label: 'Annual Report.pdf', icon: <FileIcon /> },
    ],
  },
};

export const Collapsed: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Computers', href: '/products/electronics/computers' },
      { label: 'Laptops', href: '/products/electronics/computers/laptops' },
      { label: 'Gaming Laptops' },
    ],
    maxItems: 4,
  },
};

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Category', href: '/category' },
        { label: 'Subcategory' },
      ]}
      separator={<span className="text-muted-foreground mx-2">→</span>}
    />
  ),
};

export const WithCustomLink: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics' },
      ]}
      renderLink={(item) => (
        <a
          href={item.href}
          className="text-primary-800 hover:text-primary-800 text-sm underline"
        >
          {item.label}
        </a>
      )}
    />
  ),
};

export const LongLabels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Very Long Category Name That Might Wrap', href: '/category' },
      { label: 'Another Long Subcategory Name' },
    ],
  },
};
