import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { BoardView } from './BoardView';
import {
  workItemAccessors,
  workItems,
  workItemStages,
  type WorkItem,
} from '../ListView/storyData';

const meta: Meta<typeof BoardView<WorkItem>> = {
  id: 'views-boardview',
  title: 'Modules/Views/BoardView',
  component: BoardView,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **board layout** of a collection: one column per \`Stage\`, cards bucketed by \`accessors.getStatus\`, and a card moved between columns by dragging or by keyboard. It reads records through the same \`ViewAccessors<T>\` as every other view in the family, so one adapter drives the board, the list and the rest.

Headless: it never fetches and never writes. A move leaves through \`onMove(id, toStage, item)\`; the board shows the card in its new column while that is pending and puts it back if the promise rejects.

### Use it when

- Items move between named stages and **the stage is the primary fact** — a pipeline, a triage queue, a sprint.
- You want the same records as a list and as a board: pass one \`stages\` array and one \`accessors\` object to both.

### Don't use it when

- Stages are fixed and items never move — [ListView](?path=/docs/views-listview--docs) grouped by status says the same thing in less space.
- The order _within_ a column carries meaning. This release moves cards between columns but does not reorder inside one.
- Records need sorting, filtering, paging or export — [DataVis NITRO](?path=/docs/grids-datavis-nitro--docs).

### Example

\`\`\`tsx
<BoardView
  items={items}
  accessors={accessors}
  stages={WORK_ITEM_STAGES}
  onMove={(id, toStage) => updateStatus({ id, status: toStage })}
  onOpen={(id) => navigate(\`/work/\${id}\`)}
  selectedId={openId}
/>;
\`\`\`

\`onMove\` may return a promise; the board awaits it, so an optimistic re-render in the caller is unnecessary and a rejection needs no cleanup.

### Limitations

- Accessibility: columns are \`<section>\`s whose \`<ul>\` is labelled by the column heading, so a screen reader reads "In progress, list, 2 items". A card is an \`<a>\` when \`getHref\` is given (modifier-clicks left to the browser) and a \`<button>\`-roled \`<div>\` when only \`onOpen\` is; it carries \`aria-current\` when selected and \`aria-busy\` while a move is in flight, and is described by a hint naming the keyboard command. **Moving by keyboard is its own command, not a simulated drag**: with a card focused, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>←</kbd>/<kbd>→</kbd> steps it between adjacent stages, and the result is announced in a polite live region separate from dnd-kit's drag region.
- One move per card at a time. A second is ignored while the first is still in flight, because the two would race over the same pending stage and the card could snap home while the later mutation was still running.
- Pointer drag needs a 5px movement before it starts, so a click that opens a card is not mistaken for a drag.
- Items whose status matches no stage get a trailing column of their own rather than disappearing; an empty stage keeps its header and a zero count, because a column that vanishes hides that the stage exists.
- Every card renders; there is no virtualization, so very long columns should be paged by the caller.
- Responsive: columns stack vertically below \`sm\` and become a horizontally scrolling row above it — five 288px columns on a phone is a maze, not a board.
- Motion: the board does not use the [motion](?path=/docs/foundations-motion--docs) layer. Card movement is dnd-kit's own transform, and a stage change is a re-bucket rather than an open/closed transition.
- Theming: column tint and the card accent dot resolve from the \`Accent\` token names on \`Stage\` and \`getAccent\`. Default strings are English and overridable through \`labels\`, including the two announcements (\`{item}\` and \`{stage}\` are substituted).
- Dependencies: \`@dnd-kit/core\` (a regular dependency of \`@mieweb/ui\`, not a peer).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'composes with',
          target: 'views-viewswitcher',
          why: 'The switcher chooses this layout among the others.',
        },
        {
          type: 'alternative to',
          target: 'views-listview',
          why: 'Reach for the list when items do not move between stages; the board exists for the move.',
        },
      ],
    },
  },
  argTypes: {
    items: {
      description: 'The collection to render. The caller owns fetching it.',
      table: { category: 'Data' },
    },
    accessors: {
      description:
        '`ViewAccessors<T>`. `getStatus` decides the column; `getAccent` tints the card.',
      table: { category: 'Data' },
      control: false,
    },
    stages: {
      description: 'Columns, in order. Empty stages still render.',
      table: { category: 'Data' },
    },
    loading: {
      description: 'Show the loading state.',
      table: { category: 'Data' },
    },
    error: {
      description: 'Show the error state.',
      table: { category: 'Data' },
      control: false,
    },
    selectedId: {
      description: 'Marks a card as current.',
      table: { category: 'Data' },
    },
    density: {
      description: 'Card padding.',
      control: 'radio',
      options: ['comfortable', 'compact'],
      table: { category: 'Data' },
    },
    onMove: {
      description:
        'Commits a stage change. Omit to make the board read-only — cards then have no drag handle and no keyboard command.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onOpen: {
      description: 'Called when a card is activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description: 'Replaces the built-in card body.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the whole board when there are no items at all.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description:
        'Overrides the English strings, including the move announcements.',
      table: { category: 'Slots' },
    },
    classNames: {
      description:
        'Class overrides for `column`, `columnHeader`, `card`, `selectedCard` and `state`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof BoardView<WorkItem>>;

const base = {
  items: workItems,
  accessors: workItemAccessors,
  stages: workItemStages,
} satisfies Partial<React.ComponentProps<typeof BoardView<WorkItem>>>;

/** A host that owns the records, which is where a move actually lands. */
function LiveBoard({
  fail,
  ...args
}: Partial<React.ComponentProps<typeof BoardView<WorkItem>>> & {
  fail?: boolean;
}) {
  const [items, setItems] = React.useState(workItems);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  return (
    <BoardView
      {...base}
      {...args}
      items={items}
      selectedId={selectedId}
      onOpen={(id) => setSelectedId(id)}
      onMove={async (id, toStage) => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        // `Error` is shadowed by this module's story export of the same name.
        if (fail) throw new globalThis.Error('Rejected by the server');
        setItems((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status: toStage } : w))
        );
      }}
    />
  );
}

export const Default: Story = {
  render: () => <LiveBoard />,
};

export const ReadOnly: Story = {
  name: 'Read-only',
  args: { ...base },
};

export const Compact: Story = {
  render: () => <LiveBoard density="compact" />,
};

export const MoveFails: Story = {
  name: 'Move fails',
  render: () => <LiveBoard fail />,
};

export const UnknownStage: Story = {
  name: 'Unknown stage',
  args: {
    ...base,
    items: [
      ...workItems,
      { ...workItems[0], id: 'WGL-107', status: 'archived' },
    ],
  },
};

export const CustomCard: Story = {
  name: 'Custom card',
  args: {
    ...base,
    renderItem: (item) => (
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {item.owner}
        </p>
      </div>
    ),
  },
};

export const Empty: Story = {
  args: { ...base, items: [] },
};

export const Loading: Story = {
  args: { ...base, items: [], loading: true },
};

export const Error: Story = {
  args: { ...base, items: [], error: new globalThis.Error('Request failed') },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <LiveBoard />,
};

export const RTL: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <LiveBoard />
    </div>
  ),
};
