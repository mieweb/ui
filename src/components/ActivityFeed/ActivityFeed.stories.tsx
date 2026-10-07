import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Badge } from '../Badge';
import { ActivityFeed, type ActivityFeedProps } from './ActivityFeed';
import {
  activities,
  activityAccessors,
  activityCategories,
  activityNow,
  activityZone,
  type Activity,
} from './storyData';

type Props = ActivityFeedProps<Activity>;

const meta: Meta<typeof ActivityFeed<Activity>> = {
  id: 'records-activityfeed',
  title: 'Modules/Records/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **activity history of one record** — calls, emails, notes, meetings — as a newest-first feed grouped by day under sticky "Today", "Yesterday" and localized date headers. It adds the controls a busy feed needs: multi-select category chips, a compact density, pinned items in their own section, deep-link highlighting and a "Load more" footer.

Headless and generic: \`ActivityFeed<T>\` reads your own records through \`getId\`, \`getDate\`, \`getCategory\`, \`getTitle\`, \`getDescription\` and \`getActor\`. It never fetches; pinning and paging leave as callbacks.

### Use it when

- A record page needs "what happened here, and when" across several activity types.
- Users skim by day and filter by type, and a few items deserve pinning above the flow.
- Domain extras — call outcomes, sentiment, an AI day summary — should sit on the row or under a day header through \`renderItemMeta\` and \`renderDaySummary\` rather than in the library.

### Don't use it when

- You are showing progress through ordered steps — [Timeline](?path=/docs/data-display-timeline--docs) is a step tracker, not a log.
- The entries are field edits ("Status: Open → Won") — [FieldHistory](?path=/docs/records-fieldhistory--docs) shows old and new values.
- Users need to sort, page or export rows — use a data grid.

### Example

\`\`\`tsx
<ActivityFeed
  items={activities}
  getId={(a) => a.id}
  getDate={(a) => a.occurredAt}
  getCategory={(a) => a.type}
  getTitle={(a) => a.subject}
  getActor={(a) => a.owner}
  categories={[{ id: 'call', label: 'Calls', icon: Phone, color: 'success' }]}
  pinnedIds={pinned}
  onTogglePin={(id, next) => savePin(id, next)}
  highlightedId={searchParams.get('activity')}
  hasMore={hasNextPage}
  onLoadMore={fetchNextPage}
  storageKey="account-activity"
  onOpen={(id) => openDrawer(id)}
/>;
\`\`\`

The page owns the records, the pinned ids and paging; the feed owns grouping, filters and density.

### Limitations

- Accessibility: each day is a \`<section>\` labelled by its heading (\`h3\` by default, \`headingLevel\` to change) holding a \`<ul>\`. Category chips are toggle buttons (\`aria-pressed\`) in a labelled group, and the visible count is announced politely after every filter change. Rows are anchors with \`getHref\`, buttons with only \`onOpen\`, and inert otherwise; anchors also open on Space. The pin toggle is a separate button (\`aria-pressed\`) described by the row title, so rows never nest controls.
- Pinning is optimistic: the row moves to **Pinned** at once and moves back if \`onTogglePin\`'s promise rejects. Pinned rows appear only in that section, not again under their day.
- Filters and density are uncontrolled. \`storageKey\` persists both in \`localStorage\` after mount, so server and first client render match.
- \`highlightedId\` scrolls the row into view (instantly under reduced motion) and keeps a ring on it until you clear the prop.
- Day boundaries come from \`timeZone\` (IANA, default local) and labels from \`locale\` through Luxon. Strings are English defaults, overridable through \`labels\`. Every row renders — page with \`onLoadMore\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'alternative to',
          target: 'records-fieldhistory',
          why: 'FieldHistory is the change log of field values; the feed is the log of what people did.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Each row shows the actor’s avatar.',
        },
      ],
    },
  },
  argTypes: {
    items: {
      description: 'The activity records. The caller owns fetching them.',
      table: { category: 'Data' },
    },
    categories: {
      description:
        'Filter chips, icons and colour tokens (`success`, `info`, …) per category id.',
      table: { category: 'Data' },
      control: false,
    },
    pinnedIds: {
      description: 'Ids shown in the Pinned section.',
      table: { category: 'Data' },
    },
    highlightedId: {
      description: 'Scrolls to and highlights a row (deep links).',
      table: { category: 'Data' },
    },
    loading: {
      description: 'Initial load state.',
      table: { category: 'Data' },
    },
    error: {
      description: 'Show the error state.',
      table: { category: 'Data' },
      control: false,
    },
    hasMore: {
      description: 'Show the Load more footer (needs `onLoadMore`).',
      table: { category: 'Data' },
    },
    locale: {
      description: 'BCP 47 locale for headers and times.',
      table: { category: 'Data' },
    },
    timeZone: {
      description: 'IANA zone that decides the day an item falls on.',
      table: { category: 'Data' },
    },
    storageKey: {
      description: 'Persists filters and density in localStorage.',
      table: { category: 'Data' },
    },
    defaultDensity: {
      description: 'Starting density.',
      control: 'radio',
      options: ['comfortable', 'compact'],
      table: { category: 'Data' },
    },
    getId: {
      description: 'Reads the id.',
      table: { category: 'Data' },
      control: false,
    },
    getDate: {
      description: 'Reads the ISO string or Date.',
      table: { category: 'Data' },
      control: false,
    },
    getCategory: {
      description: 'Reads the category id.',
      table: { category: 'Data' },
      control: false,
    },
    getTitle: {
      description: 'Reads the title.',
      table: { category: 'Data' },
      control: false,
    },
    getDescription: {
      description: 'Reads the body; hidden in compact density.',
      table: { category: 'Data' },
      control: false,
    },
    getActor: {
      description: 'Reads `{ name, avatarUrl? }`.',
      table: { category: 'Data' },
      control: false,
    },
    onOpen: {
      description: 'Row activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Renders rows as real anchors.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onTogglePin: {
      description:
        '`(id, pinned) => void | Promise<void>`; optimistic, restored on rejection.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onLoadMore: {
      description:
        'Loads the next page; the button is pending until it settles.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRetry: {
      description: 'Retries a failed load.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description: 'Replaces the row body.',
      table: { category: 'Slots' },
      control: false,
    },
    renderItemMeta: {
      description: 'Extra content on the row’s meta line.',
      table: { category: 'Slots' },
      control: false,
    },
    renderDaySummary: {
      description: 'Content under each day header.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the empty state.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English strings.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides keyed by slot: toolbar, filter, section, dayHeader, item, highlightedItem, state, loadMore.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof ActivityFeed<Activity>>;

const base = {
  items: activities,
  ...activityAccessors,
  categories: activityCategories,
  now: activityNow,
  timeZone: activityZone,
} satisfies Partial<Props>;

export const Default: Story = { args: { ...base } };

function PinnableFeed(args: Props) {
  const [pinned, setPinned] = React.useState<string[]>(['a3']);
  return (
    <ActivityFeed
      {...args}
      pinnedIds={pinned}
      onTogglePin={async (id, next) => {
        await new Promise((r) => setTimeout(r, 400));
        setPinned((p) => (next ? [...p, id] : p.filter((x) => x !== id)));
      }}
    />
  );
}

export const Pinned: Story = {
  render: (args) => <PinnableFeed {...args} />,
  args: { ...base },
};

export const Compact: Story = {
  args: { ...base, defaultDensity: 'compact' },
};

export const DeepLinkHighlight: Story = {
  name: 'Deep-link highlight',
  args: { ...base, highlightedId: 'a4', onOpen: () => {} },
};

export const WithSlots: Story = {
  name: 'Meta and day-summary slots',
  args: {
    ...base,
    renderItemMeta: (a) =>
      a.durationMinutes ? (
        <Badge size="sm" variant="secondary">
          {a.durationMinutes} min
        </Badge>
      ) : null,
    renderDaySummary: (_day, items) => (
      <p className="text-muted-foreground border-border border-b px-3 py-2 text-xs">
        {items.filter((a) => a.kind === 'call').length} calls ·{' '}
        {items.filter((a) => a.kind === 'email').length} emails
      </p>
    ),
  },
};

function PagedFeed(args: Props) {
  const [count, setCount] = React.useState(3);
  return (
    <ActivityFeed
      {...args}
      items={activities.slice(0, count)}
      hasMore={count < activities.length}
      onLoadMore={async () => {
        await new Promise((r) => setTimeout(r, 600));
        setCount((c) => c + 3);
      }}
    />
  );
}

export const LoadMore: Story = {
  name: 'Load more',
  render: (args) => <PagedFeed {...args} />,
  args: { ...base },
};

export const Localized: Story = {
  args: {
    ...base,
    locale: 'fr',
    labels: { today: "Aujourd'hui", yesterday: 'Hier', allCategories: 'Tout' },
  },
};

export const Empty: Story = { args: { ...base, items: [] } };

export const Loading: Story = { args: { ...base, items: [], loading: true } };

export const Error: Story = {
  args: {
    ...base,
    items: [],
    error: new globalThis.Error('Request failed'),
    onRetry: () => {},
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { ...base, pinnedIds: ['a1'] },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <ActivityFeed {...args} />
    </div>
  ),
  args: { ...base },
};
