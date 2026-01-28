import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, BreadcrumbProps, BreadcrumbSlash } from './Breadcrumb';
import { ChevronRight } from 'lucide-react';
import React from 'react';

// Map of separator names to React elements
const separatorMap: Record<string, React.ReactNode> = {
  chevron: <ChevronRight className="h-4 w-4" />,
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
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
          className="text-primary-500 hover:text-primary-600 text-sm underline"
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
