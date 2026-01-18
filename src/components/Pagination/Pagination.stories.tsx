import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination, SimplePagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showFirstLast: {
      control: 'boolean',
    },
    showPrevNext: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationDemo(
  props: Partial<React.ComponentProps<typeof Pagination>>
) {
  const [page, setPage] = React.useState(1);
  return (
    <Pagination page={page} totalPages={10} onPageChange={setPage} {...props} />
  );
}

export const Default: Story = {
  render: () => <PaginationDemo />,
};

export const Outline: Story = {
  render: () => <PaginationDemo variant="outline" />,
};

export const Ghost: Story = {
  render: () => <PaginationDemo variant="ghost" />,
};

export const Small: Story = {
  render: () => <PaginationDemo size="sm" />,
};

export const Large: Story = {
  render: () => <PaginationDemo size="lg" />,
};

function ManyPagesDemo() {
  const [page, setPage] = React.useState(15);
  return <Pagination page={page} totalPages={50} onPageChange={setPage} />;
}

export const ManyPages: Story = {
  render: () => <ManyPagesDemo />,
};

function FewPagesDemo() {
  const [page, setPage] = React.useState(1);
  return <Pagination page={page} totalPages={3} onPageChange={setPage} />;
}

export const FewPages: Story = {
  render: () => <FewPagesDemo />,
};

export const WithoutFirstLast: Story = {
  render: () => <PaginationDemo showFirstLast={false} />,
};

export const WithoutPrevNext: Story = {
  render: () => <PaginationDemo showPrevNext={false} />,
};

export const MinimalNavigation: Story = {
  render: () => <PaginationDemo showFirstLast={false} showPrevNext={false} />,
};

function MoreSiblingsDemo() {
  const [page, setPage] = React.useState(10);
  return (
    <Pagination
      page={page}
      totalPages={20}
      onPageChange={setPage}
      siblingCount={2}
    />
  );
}

export const MoreSiblings: Story = {
  render: () => <MoreSiblingsDemo />,
};

function SimplePaginationDemo(
  props: Partial<React.ComponentProps<typeof SimplePagination>>
) {
  const [page, setPage] = React.useState(1);
  return (
    <SimplePagination
      page={page}
      totalPages={10}
      onPageChange={setPage}
      {...props}
    />
  );
}

export const Simple: Story = {
  render: () => <SimplePaginationDemo />,
};

export const SimpleOutline: Story = {
  render: () => <SimplePaginationDemo variant="outline" />,
};

export const SimpleWithoutPageInfo: Story = {
  render: () => <SimplePaginationDemo showPageInfo={false} />,
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Default</p>
        <PaginationDemo variant="default" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Outline</p>
        <PaginationDemo variant="outline" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Ghost</p>
        <PaginationDemo variant="ghost" />
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Small</p>
        <PaginationDemo size="sm" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Medium</p>
        <PaginationDemo size="md" />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm">Large</p>
        <PaginationDemo size="lg" />
      </div>
    </div>
  ),
};
