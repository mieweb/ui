import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination, SimplePagination } from './Pagination';

// Wrapper component that manages state while passing through all props
function PaginationWithState({
  page: initialPage = 1,
  totalPages = 10,
  onPageChange,
  ...props
}: Omit<React.ComponentProps<typeof Pagination>, 'onPageChange'> & {
  onPageChange?: (page: number) => void;
}) {
  const [page, setPage] = React.useState(initialPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange?.(newPage);
  };

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      {...props}
    />
  );
}

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    page: {
      control: { type: 'number', min: 1 },
      description: 'Current page (1-indexed)',
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of pagination buttons',
    },
    showFirstLast: {
      control: 'boolean',
      description: 'Show first/last page buttons',
    },
    showPrevNext: {
      control: 'boolean',
      description: 'Show previous/next buttons',
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'Number of sibling pages to show on each side',
    },
    onPageChange: {
      action: 'pageChanged',
      description: 'Callback when page changes',
    },
  },
  // Use render function that wraps with state management
  render: (args) => <PaginationWithState {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    page: 1,
    totalPages: 10,
    variant: 'default',
    size: 'md',
    showFirstLast: true,
    showPrevNext: true,
    siblingCount: 1,
  },
};

export const Outline: Story = {
  args: {
    ...Default.args,
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    ...Default.args,
    variant: 'ghost',
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

export const ManyPages: Story = {
  args: {
    ...Default.args,
    page: 15,
    totalPages: 50,
  },
};

export const FewPages: Story = {
  args: {
    ...Default.args,
    totalPages: 3,
  },
};

export const WithoutFirstLast: Story = {
  args: {
    ...Default.args,
    showFirstLast: false,
  },
};

export const WithoutPrevNext: Story = {
  args: {
    ...Default.args,
    showPrevNext: false,
  },
};

export const MinimalNavigation: Story = {
  args: {
    ...Default.args,
    showFirstLast: false,
    showPrevNext: false,
  },
};

export const MoreSiblings: Story = {
  args: {
    ...Default.args,
    page: 10,
    totalPages: 20,
    siblingCount: 2,
  },
};

// SimplePagination stories
function SimplePaginationWithState({
  page: initialPage = 1,
  totalPages = 10,
  onPageChange,
  ...props
}: Omit<React.ComponentProps<typeof SimplePagination>, 'onPageChange'> & {
  onPageChange?: (page: number) => void;
}) {
  const [page, setPage] = React.useState(initialPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange?.(newPage);
  };

  return (
    <SimplePagination
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      {...props}
    />
  );
}

export const Simple: Story = {
  args: {
    page: 1,
    totalPages: 10,
    variant: 'default',
    size: 'md',
  },
  render: (args) => <SimplePaginationWithState {...args} />,
};

export const SimpleOutline: Story = {
  args: {
    ...Simple.args,
    variant: 'outline',
  },
  render: (args) => <SimplePaginationWithState {...args} />,
};

export const SimpleWithoutPageInfo: Story = {
  args: {
    ...Simple.args,
  },
  render: (args) => (
    <SimplePaginationWithState {...args} showPageInfo={false} />
  ),
};

// Showcase stories with custom render
export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Default</p>
        <PaginationWithState page={5} totalPages={10} variant="default" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Outline</p>
        <PaginationWithState page={5} totalPages={10} variant="outline" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Ghost</p>
        <PaginationWithState page={5} totalPages={10} variant="ghost" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Small</p>
        <PaginationWithState page={5} totalPages={10} size="sm" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Medium</p>
        <PaginationWithState page={5} totalPages={10} size="md" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Large</p>
        <PaginationWithState page={5} totalPages={10} size="lg" />
      </div>
    </div>
  ),
};
