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
    colorClass: 'text-primary-800',
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
      <p className="text-muted-foreground text-sm">
        Press{' '}
        <kbd className="rounded bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          ⌘K
        </kbd>{' '}
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
      className="bg-primary-800 hover:bg-primary-900 rounded-lg px-4 py-2 text-white transition-colors"
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
  id: 'navigation-commandpalette',
  title: 'Components/Navigation/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'centered',
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'overlays-keyboardshortcutsoverlay',
          why: 'KeyboardShortcutsOverlay documents the keys; CommandPalette lets users search and run commands.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-dropdown',
          why: 'CommandPalette searches and runs commands app-wide from a keyboard shortcut; Dropdown is a short anchored menu for one context.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-autocomplete',
          why: 'CommandPalette is a global ⌘K overlay that runs a command or opens a record; Autocomplete is a form field that puts a chosen value into the form.',
        },
        {
          type: 'composes with',
          target: 'layout-appheader',
          why: 'AppHeaderSearch is the ⌘K placeholder button whose onClick opens the CommandPalette.',
        },
      ],
    },
    docs: {
      description: {
        component: `### What it's for

**App-wide search-and-run from the keyboard** (⌘K / Ctrl+K): a centred overlay with a search box, optional category filter chips, grouped results and a hint footer. Three pieces: \`CommandPaletteProvider\` owns open state, \`query\`, \`selectedIndex\`, \`activeCategory\`, \`items\` and \`categories\` and registers the shortcut (\`enableShortcut\`, optional \`customEventName\`); \`useCommandPalette()\` exposes \`open\` / \`close\` / \`toggle\` / \`setItems\` / \`setCategories\` so any part of the app can contribute \`CommandPaletteItem\`s (\`{ id, label, subtitle?, description?, category?, icon?, shortcut?, disabled?, metadata? }\`); \`CommandPalette\` renders the overlay and calls \`onSelect(item)\`. \`CommandPaletteTrigger\` is the "Search… ⌘K" button for a header. Results are filtered client-side on label / subtitle / description unless \`serverFiltered\`; \`onQueryChange\` lets you fetch async results; \`pinnedItems\` stay at the top (grouped under \`pinnedCategoryLabel\`), \`recentItems\` show when the query is empty and nothing else matches (\`recentCategoryLabel\`); \`renderItem\`, \`emptyState\` and \`footer\` are render overrides; \`isLoading\` shows a spinner.

### Use it when

- Power users need to jump to any record, page or action by typing, from anywhere in the app.
- Several features register commands independently and one global entry point should aggregate them.

### Don't use it when

- The actions belong to **one element** (a row, a card) — \`Dropdown\` anchored to it.
- The user is **choosing a value for a form** — \`Autocomplete\` / \`Select\`.
- You only need to **show** the shortcuts — \`KeyboardShortcutsOverlay\`.
- It is a domain search with its own filters and results page — e.g. \`ProviderSearchBar\`.

### Example

\`\`\`tsx
// App root
<CommandPaletteProvider>
  <AppShell />
  <CommandPalette placeholder="Search patients, orders, pages…" onSelect={(item) => run(item)} onQueryChange={setSearch} isLoading={isFetching} serverFiltered />
</CommandPaletteProvider>

// Any feature registers what it can do
function PatientsFeature() {
  const { setItems, setCategories } = useCommandPalette();
  const { data: patients } = usePatientSearch(search);
  useEffect(() => {
    setCategories([{ id: 'patients', label: 'Patients' }, { id: 'pages', label: 'Pages' }]);
    setItems([
      ...pages.map((p) => ({ id: p.path, label: p.title, category: 'pages' })),
      ...(patients ?? []).map((p) => ({ id: p.id, label: p.name, subtitle: p.mrn, category: 'patients' })),
    ]);
  }, [patients]);
  return null;
}

// Header
<CommandPaletteTrigger placeholder="Search…" />
\`\`\`

The provider owns open/query/selection; the host owns items and what \`onSelect\` does. \`setItems\` replaces the whole list — merge across features yourself.

### Limitations

- Accessibility: the overlay is a fixed \`<div>\` — **no \`role="dialog"\`, \`aria-modal\`, focus trap or scroll lock**; the backdrop is \`aria-hidden\`. The input has no \`aria-label\` (only \`placeholder\`) and no combobox/listbox roles; results are plain \`<button>\`s (or \`role="button"\` divs with \`renderItem\`) and the highlighted row is visual only (no \`aria-activedescendant\`). Keyboard on the input: ArrowUp/Down move the highlight (no wrap), Enter selects, Escape closes (\`useEscapeKey\`), **Tab / Shift+Tab cycle category filters** instead of moving focus. Focus is moved into the input 50ms after open and not returned to the trigger on close.
- Selection resets to the first item whenever the item count changes; disabled items are skipped only on Enter/click (arrows still land on them).
- i18n: \`placeholder\`, \`pinnedCategoryLabel\`, \`recentCategoryLabel\` are props; "All", "Other" (uncategorised group), "Start typing to search...", "No results for …", "Searching for …", the footer hints ("navigate", "select", "close", "N results") and "Clear search" are hard-coded English. The trigger shows ⌘ on Apple platforms (via \`navigator.platform\`) else Ctrl.
- Layout: not portaled — \`fixed inset-x-0 top-20 z-50\`, max-width 2xl, results capped at 60vh. Renders \`null\` when closed.
- RTL: uses physical \`left-4\` / \`right-12\` / \`pl-12 pr-12\` / \`mr-2\` / \`text-left\`, so the search icon, clear button and shortcut chips sit on the wrong side.
- Theming: hard-coded \`gray-*\` / \`bg-white\` surfaces with \`dark:\` variants; \`primary-800\` for active chips and \`primary-50\` for the highlighted row — brands recolour only the accents. Depends on \`useKeyboardShortcut\` (\`useCommandK\`), \`useEscapeKey\`, \`useClickOutside\`.`,
      },
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for search input',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether search is loading',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the modal',
    },
    emptyState: {
      control: false,
      description: 'Custom empty state content (React node)',
    },
    renderItem: {
      control: false,
      description: 'Custom render function for items',
    },
    footer: {
      control: false,
      description: 'Custom footer content (React node)',
    },
    onSelect: { action: 'onSelect' },
  },
  args: {
    placeholder: 'Search pages, users, settings...',
    isLoading: false,
  },
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
// Playground Story (for Controls)
// =============================================================================

function PlaygroundDemo(props: React.ComponentProps<typeof CommandPalette>) {
  const { setItems, setCategories } = useCommandPalette();

  useEffect(() => {
    setItems(sampleItems);
    setCategories(sampleCategories);
  }, [setItems, setCategories]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">
        Press{' '}
        <kbd className="rounded bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          ⌘K
        </kbd>{' '}
        or click the button below
      </p>
      <CommandPaletteTrigger placeholder={props.placeholder} />
      <CommandPalette {...props} />
    </div>
  );
}

/**
 * Interactive playground with all controls available.
 * Use the Controls panel to adjust props dynamically.
 */
export const Playground: Story = {
  render: (args) => <PlaygroundDemo {...args} />,
};

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

// =============================================================================
// Async Search Story
// =============================================================================

function AsyncSearchDemo(): React.JSX.Element {
  const { setItems } = useCommandPalette();
  const [isLoading, setIsLoading] = React.useState(false);

  // Simulate a debounced server search by sleeping briefly on each query.
  const handleQueryChange = React.useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setItems([]);
        return;
      }
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 250));
      setItems([
        {
          id: `call-${q}`,
          label: `Call about "${q}"`,
          subtitle: 'Yesterday • 4 min',
          category: 'Calls',
        },
        {
          id: `vm-${q}`,
          label: `Voicemail mentioning "${q}"`,
          subtitle: '2 days ago',
          category: 'Voicemails',
        },
        {
          id: `contact-${q}`,
          label: q,
          subtitle: '+1 (555) 010-2024',
          category: 'Contacts',
        },
      ]);
      setIsLoading(false);
    },
    [setItems]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <CommandPaletteTrigger placeholder="Search anything…" />
      <CommandPalette
        placeholder="Search anything…"
        isLoading={isLoading}
        onQueryChange={(q) => {
          void handleQueryChange(q);
        }}
        pinnedItems={[
          {
            id: 'ai-answer',
            label: 'Ask AI to answer',
            subtitle: 'Run semantic search across summaries',
          },
        ]}
        pinnedCategoryLabel="Smart actions"
        recentItems={[
          { id: 'r1', label: 'Acme Corp', subtitle: '+1 (555) 010-2024' },
          { id: 'r2', label: 'Billing call recap', subtitle: '12 min ago' },
        ]}
      />
    </div>
  );
}

export const AsyncSearch: Story = {
  render: () => <AsyncSearchDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Hooks `onQueryChange` to a (mock) server, surfaces results grouped by category, pins a smart-action row, and falls back to recents on empty query.',
      },
    },
  },
};
