import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import {
  CommandPalette,
  CommandPaletteTrigger,
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteItem,
  type CommandPaletteCategory,
} from './index';

// =============================================================================
// Sample Data
// =============================================================================

const sampleCategories: CommandPaletteCategory[] = [
  {
    id: 'pages',
    label: 'Pages',
    icon: <span>📄</span>,
    colorClass: 'text-blue-500',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <span>👤</span>,
    colorClass: 'text-green-500',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <span>⚙️</span>,
    colorClass: 'text-gray-500',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: <span>⚡</span>,
    colorClass: 'text-amber-500',
  },
];

const sampleItems: CommandPaletteItem[] = [
  {
    id: '1',
    label: 'Dashboard',
    subtitle: 'Main overview',
    category: 'pages',
    shortcut: '⌘D',
  },
  {
    id: '2',
    label: 'Analytics',
    subtitle: 'View metrics and reports',
    category: 'pages',
  },
  {
    id: '3',
    label: 'Projects',
    subtitle: 'Manage your projects',
    category: 'pages',
  },
  {
    id: '4',
    label: 'Calendar',
    subtitle: 'Schedule and events',
    category: 'pages',
  },
  {
    id: '5',
    label: 'John Smith',
    subtitle: 'john@example.com',
    description: 'Admin',
    category: 'users',
  },
  {
    id: '6',
    label: 'Jane Doe',
    subtitle: 'jane@example.com',
    description: 'Member',
    category: 'users',
  },
  {
    id: '7',
    label: 'Bob Wilson',
    subtitle: 'bob@example.com',
    description: 'Guest',
    category: 'users',
  },
  {
    id: '8',
    label: 'Profile Settings',
    subtitle: 'Manage your profile',
    category: 'settings',
  },
  {
    id: '9',
    label: 'Notifications',
    subtitle: 'Configure alerts',
    category: 'settings',
  },
  {
    id: '10',
    label: 'Security',
    subtitle: 'Password and 2FA',
    category: 'settings',
    shortcut: '⌘S',
  },
  {
    id: '11',
    label: 'Create New Project',
    category: 'actions',
    shortcut: '⌘N',
  },
  { id: '12', label: 'Invite Team Member', category: 'actions' },
  { id: '13', label: 'Export Data', category: 'actions' },
];

// =============================================================================
// Demo Components (hooks must be in proper components)
// =============================================================================

function CommandPaletteDemo() {
  const { setItems, setCategories } = useCommandPalette();

  useEffect(() => {
    setItems(sampleItems);
    setCategories(sampleCategories);
  }, [setItems, setCategories]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Press{' '}
        <kbd className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">⌘K</kbd>{' '}
        or click the button below
      </p>
      <CommandPaletteTrigger placeholder="Search pages, users, settings..." />
      <CommandPalette placeholder="Search pages, users, settings..." />
    </div>
  );
}

function OpenByDefaultDemo() {
  const { open, setItems, setCategories } = useCommandPalette();

  useEffect(() => {
    setItems(sampleItems);
    setCategories(sampleCategories);
    const timer = setTimeout(() => open(), 100);
    return () => clearTimeout(timer);
  }, [open, setItems, setCategories]);

  return (
    <>
      <CommandPaletteTrigger />
      <CommandPalette />
    </>
  );
}

function CustomTriggerDemo() {
  const { open } = useCommandPalette();
  return (
    <button
      onClick={open}
      className="bg-primary-500 hover:bg-primary-600 rounded-lg px-4 py-2 text-white transition-colors"
    >
      Open Search
    </button>
  );
}

function LoadingDemo() {
  const { setItems, setCategories, open } = useCommandPalette();

  useEffect(() => {
    setItems(sampleItems);
    setCategories(sampleCategories);
    open();
  }, [setItems, setCategories, open]);

  return (
    <>
      <CommandPaletteTrigger />
      <CommandPalette isLoading placeholder="Searching..." />
    </>
  );
}

function EmptyDemo() {
  const { setItems, setCategories, open } = useCommandPalette();

  useEffect(() => {
    setItems([]);
    setCategories([]);
    open();
  }, [setItems, setCategories, open]);

  return (
    <>
      <CommandPaletteTrigger />
      <CommandPalette
        emptyState={
          <div className="py-8 text-center">
            <span className="mb-2 block text-4xl">🔍</span>
            <p className="text-sm text-gray-500">
              No results found. Try a different search.
            </p>
          </div>
        }
      />
    </>
  );
}

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof CommandPalette> = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A command palette / global search component with keyboard navigation, category filtering, and customizable items. Supports Cmd+K (Mac) / Ctrl+K (Windows) keyboard shortcut.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <CommandPaletteProvider>
        <div className="flex min-h-[400px] items-start justify-center pt-8">
          <Story />
        </div>
      </CommandPaletteProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: () => <CommandPaletteDemo />,
};

export const OpenByDefault: Story = {
  render: () => <OpenByDefaultDemo />,
  parameters: {
    docs: {
      description: {
        story: 'The command palette opens automatically when this story loads.',
      },
    },
  },
};

export const TriggerButton: Story = {
  render: () => (
    <CommandPaletteTrigger
      placeholder="Search anything..."
      className="min-w-[350px]"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The trigger button that opens the command palette, showing the keyboard shortcut hint.',
      },
    },
  },
};

export const CustomTrigger: Story = {
  render: () => <CustomTriggerDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'You can use any element as a trigger by using the useCommandPalette hook.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => <LoadingDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows a loading spinner when isLoading is true.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => <EmptyDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Shows a custom empty state when no items match the search.',
      },
    },
  },
};
