import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import { Badge } from '../Badge';
import { Button } from '../Button';
import { ReorderableList, type ReorderableListProps } from './ReorderableList';
import {
  groupedStoryTasks,
  inOrder,
  isDivider,
  sectionStoryRows,
  storyTasks,
  type StorySectionRow,
  type StoryTask,
} from './storyData';

type Props = ReorderableListProps<StoryTask>;

const statusVariant = {
  todo: 'secondary',
  doing: 'warning',
  done: 'success',
} as const;

const listClass =
  'border-border divide-border w-[min(28rem,calc(100vw-2rem))] divide-y rounded-lg border';

function renderTask(
  task: StoryTask,
  { handle, moveButtons }: Parameters<Props['renderItem']>[1]
) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      {handle}
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm">{task.title}</div>
        <div className="text-muted-foreground text-xs">{task.owner}</div>
      </div>
      <Badge variant={statusVariant[task.status]} size="sm">
        {task.status}
      </Badge>
      {moveButtons}
    </div>
  );
}

/** Owns the order in state (`onReorder` out, `items` back in), so the feature stories start fresh on every load. */
function TaskList(props: Partial<Props>) {
  const [tasks, setTasks] = React.useState(storyTasks);
  return (
    <ReorderableList
      aria-label="Tasks"
      items={tasks}
      getId={(task) => task.id}
      onReorder={(ids) => setTasks((prev) => inOrder(prev, ids))}
      className={listClass}
      renderItem={renderTask}
      {...props}
    />
  );
}

const meta: Meta<typeof ReorderableList> = {
  id: 'views-reorderablelist',
  title: 'Modules/Views/ReorderableList',
  component: ReorderableList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **list the user puts in order**. Rows can be dragged, moved with Alt+↑ / Alt+↓ on a focused row, or moved with optional up and down buttons. It renders your rows through \`renderItem\` and hands each one a ready \`handle\` and \`moveButtons\` to place. Give it a \`storageKey\` and it saves the order in the browser and restores it on the next visit — that's the whole setup. To save the order somewhere else (a server, so it follows the user to other devices), leave \`storageKey\` out: \`onReorder\` reports the full new id order and you pass \`items\` back in that order.

### Use it when

- People choose the order and the order is the point: priorities, a running order, a personal list of tickets.
- The list is short enough to see whole, and each row is your own markup.
- You want drag, keyboard and announcements to behave the same in every app, without wiring \`useDragReorder\` yourself.

### Don't use it when

- Rows come from a collection with stages, groups and selection — \`ListView\` renders those; it has no manual order.
- Items move **between** named stages — \`BoardView\`.
- Users sort, filter, page or export rows — DataVis NITRO; a column sort and a hand-made order don't mix.
- Widgets are arranged in a dashboard grid — \`CustomizableDashboard\`.

### Example

\`\`\`tsx
<ReorderableList
  aria-label="Tasks"
  items={tasks}
  getId={(task) => task.id}
  storageKey="my-tasks" // saved in this browser; survives a reload
  handle
  showMoveButtons
  renderItem={(task, { handle, moveButtons }) => (
    <div className="flex items-center gap-3">
      {handle}
      <span className="flex-1">{task.title}</span>
      {moveButtons}
    </div>
  )}
/>
\`\`\`

To save on a server instead, drop \`storageKey\`, keep \`items\` in state, and save in \`onReorder\`:

\`\`\`tsx
const [tasks, setTasks] = useState(initialTasks);

<ReorderableList
  items={tasks}
  getId={(task) => task.id}
  onReorder={(ids) => {
    setTasks((prev) => ids.map((id) => prev.find((t) => t.id === id)!));
    api.saveOrder(ids);
  }}
  renderItem={…}
/>
\`\`\`

### Limitations

- Accessibility: with reordering on, each row is focusable and takes Alt+↑ / Alt+↓ (\`aria-keyshortcuts\`). Every keyboard or button move is announced in a polite live region rendered after the list. The grip is pointer-only and hidden from assistive technology; the keyboard path is the row itself and the move buttons.
- Dragging uses \`@dnd-kit/sortable\` (a dependency of the library already): other rows slide aside to make room, and the transition is off when the user prefers reduced motion. On touch, the grip drags at once; without \`handle\`, a row drags after a short press-and-hold so the page still scrolls. Keyboard and button moves use \`useDragReorder\`, like the library's clinical lists.
- Rows move within one list only. For sections inside one list (e.g. Pinned and the rest), make the boundary a row that \`canDrag\` refuses; rows crossing it change section (story: *Sections*). The move announcement counts that row as a position — override \`labels.moved\` to word it for your sections.
- \`storageKey\` uses localStorage: the order stays in that browser only, and is read once when the list mounts. New ids go to the end and removed ids drop out. If the key can change (another list or user), render \`<ReorderableList key={storageKey} storageKey={storageKey} … />\` so the list remounts; otherwise the previous list's order can be saved under the new key. Blocked storage falls back to an in-memory order.
- With \`handle\`, only the grip starts a drag, so buttons, links and selectable text inside a row keep working. Without it, the whole row drags (after a 5 px move, so clicks still click) and its text can't be selected.
- RTL: the layout is yours; the built-in parts use no left/right styling and up/down don't flip.
- i18n: \`labels\` overrides every string (move up, move down, the moved announcement, the grip's title); the defaults are English.
- Theming: the dragged row lifts with \`bg-background\` and a shadow; the grip uses \`text-muted-foreground\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'views-listview',
          why: 'ListView renders a collection with stages, groups and selection but no manual order; ReorderableList is a plain list the user orders.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  argTypes: {
    items: {
      description: 'The rows, in their current order.',
      table: { category: 'Data' },
      control: false,
    },
    getId: {
      description: 'A stable id for each row.',
      table: { category: 'Data' },
      control: false,
    },
    storageKey: {
      description:
        'Save the order in this browser under this key and restore it on the next visit. Turns reordering on by itself. If the key can change, also pass it as `key` so the list remounts.',
      table: { category: 'Data' },
      control: false,
    },
    onReorder: {
      description:
        'Called with the full new id order after a drop or move. Without `storageKey`, pass `items` back in that order; leaving both out turns reordering off.',
      table: { category: 'Callbacks' },
      control: false,
    },
    canDrag: {
      description:
        "Whether a row can be picked up. A row that can't — a section header or divider — stays put for other rows to move past.",
      table: { category: 'Callbacks' },
      control: false,
    },
    canDropOn: {
      description:
        'Allow or refuse a drop or move, e.g. to keep rows within their group.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderItem: {
      description:
        "A row's content. Receives `{ handle, moveButtons, index, dragging }` to place where the row wants.",
      table: { category: 'Slots' },
      control: false,
    },
    handle: {
      description:
        'Only the grip starts a drag, so controls inside a row keep working.',
    },
    showMoveButtons: {
      description: 'Give each row up and down buttons (`moveButtons`).',
    },
    keyboard: {
      description: 'Alt+↑ / Alt+↓ on a focused row.',
    },
    as: {
      description: 'The list element: `ul` (default), `ol` or `div`.',
      control: 'select',
      options: ['ul', 'ol', 'div'],
    },
    labels: {
      description: 'Every user-facing string, for translation.',
      control: false,
    },
    classNames: {
      description:
        'Extra classes keyed by slot: `list`, `item`, `handle`, `moveButtons`, `announcement`.',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The whole setup: `storageKey` saves the order in this browser. Drag a row (or focus one and press Alt+↑ / Alt+↓), then reload — the order stays. */
export const Basic: Story = {
  render: (args) => (
    <ReorderableList
      aria-label="Tasks"
      items={storyTasks}
      getId={(task) => task.id}
      storageKey="storybook-reorderable-list-basic"
      renderItem={renderTask}
      className={listClass}
      {...(args as Partial<Props>)}
    />
  ),
};

function WithHandleDemo() {
  const [opened, setOpened] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <TaskList
        handle
        renderItem={(task, { handle }) => (
          <div className="flex items-center gap-3 px-3 py-2">
            {handle}
            <span className="text-foreground min-w-0 flex-1 truncate text-sm">
              {task.title}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpened(task.title)}
            >
              Open
            </Button>
          </div>
        )}
      />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {opened ? `Opened: ${opened}` : 'Nothing opened yet.'}
      </p>
    </div>
  );
}

/** No grip icon: leave `handle` out of `renderItem` and the whole row is the drag target. Rows still focus for Alt+↑ / Alt+↓; a short press-and-hold starts a drag on touch. */
export const WithoutGrip: Story = {
  render: () => (
    <TaskList
      renderItem={(task) => (
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="text-foreground truncate text-sm">{task.title}</div>
            <div className="text-muted-foreground text-xs">{task.owner}</div>
          </div>
          <Badge variant={statusVariant[task.status]} size="sm">
            {task.status}
          </Badge>
        </div>
      )}
    />
  ),
};

/** Only the grip drags; the Open button in each row still clicks. */
export const WithHandle: Story = {
  render: () => <WithHandleDemo />,
};

/** Up and down buttons: a visible way to reorder without dragging, for keyboard, switch and screen-reader users. */
export const WithMoveButtons: Story = {
  render: () => <TaskList handle showMoveButtons />,
};

const groupOf = new Map(
  groupedStoryTasks.map((task) => [task.id, task.status])
);

function GroupedDemo() {
  const [tasks, setTasks] = React.useState(groupedStoryTasks);
  return (
    <TaskList
      items={tasks}
      onReorder={(ids) => setTasks((prev) => inOrder(prev, ids))}
      handle
      showMoveButtons
      canDropOn={(dragged, target) =>
        groupOf.get(dragged) === groupOf.get(target)
      }
    />
  );
}

/** `canDropOn` keeps each row within its group: drags skip other groups, and the move buttons stop at a group's edge. */
export const Grouped: Story = {
  render: () => <GroupedDemo />,
};

function SavedOnServerDemo() {
  const [tasks, setTasks] = React.useState(storyTasks);
  const [status, setStatus] = React.useState('Nothing saved yet.');
  return (
    <div className="flex flex-col gap-3">
      <TaskList
        items={tasks}
        handle
        showMoveButtons
        onReorder={(ids) => {
          setTasks((prev) => inOrder(prev, ids));
          // Stands in for an API call that saves this member's order.
          setStatus(`Saved to the server: ${ids.join(', ')}`);
        }}
      />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

/** No `storageKey`: you own the order. `onReorder` hands you every new order to save where it belongs (a server, so it follows the user to other devices), and you pass `items` back in that order. */
export const SavedOnServer: Story = {
  render: () => <SavedOnServerDemo />,
};

function SectionsDemo() {
  const [rows, setRows] = React.useState(sectionStoryRows);
  const split = rows.findIndex((row) => row.id === 'rest');
  // The Pinned header is always first, so pinned rows sit between the headers.
  const pinned = rows.slice(1, split) as StoryTask[];
  const count = { pinned: pinned.length, rest: rows.length - split - 1 };
  const title = { pinned: 'Pinned', rest: 'Rest of the list' };
  return (
    <div className="flex flex-col gap-3">
      <ReorderableList<StorySectionRow>
        aria-label="Board"
        items={rows}
        getId={(row) => row.id}
        canDrag={(row) => !isDivider(row)}
        // Nothing lands above the Pinned header, so it stays at the top.
        canDropOn={(_, target) => target !== 'pinned'}
        onReorder={(ids) => setRows((prev) => inOrder(prev, ids))}
        className={listClass}
        renderItem={(row, parts) =>
          isDivider(row) ? (
            <div className="bg-muted text-foreground px-3 py-2 text-xs font-semibold tracking-wide uppercase">
              {title[row.id]} ({count[row.id]})
            </div>
          ) : (
            renderTask(row, { ...parts, handle: null })
          )
        }
      />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {pinned.length
          ? `Pinned: ${pinned.map((task) => task.title).join(', ')}`
          : 'Nothing pinned.'}
      </p>
    </div>
  );
}

/** Soft sections in one list: both headers are rows that can't be picked up (`canDrag`), so dragging a task across "Rest of the list" pins or unpins it, and Alt+↑ / Alt+↓ cross it too. `canDropOn` refuses drops on the Pinned header so it stays at the top. The app reads the sections from where the headers sit. */
export const Sections: Story = {
  render: () => <SectionsDemo />,
};

/** Phone width. The grip drags at once on touch; without `handle`, a row needs a press-and-hold so the page still scrolls. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <TaskList handle showMoveButtons />,
};

/** Right-to-left: the grip sits at the start edge and the row flows from the right. Up and down don't flip. */
export const RTL: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <TaskList handle showMoveButtons />
    </div>
  ),
};
