import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ViewSet } from '../ViewSet';
import { Badge } from '../Badge';
import { Card } from '../Card';
import type { Stage, ViewAccessors } from '../../views/types';

// =============================================================================
// A different domain, the same module
// =============================================================================

interface Order {
  id: string;
  orderNumber: string;
  employee: string;
  employer: string;
  service: string;
  status: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  submittedAt: string;
  dueAt: string;
}

const NOW = new Date('2026-03-18T12:00:00Z');
const day = (offset: number) =>
  new Date(NOW.getTime() + offset * 86_400_000).toISOString();

const orderStages: Stage[] = [
  { id: 'submitted', label: 'Submitted', accent: 'info' },
  { id: 'confirmed', label: 'Confirmed', accent: 'primary' },
  { id: 'in-progress', label: 'In progress', accent: 'warning' },
  { id: 'results-ready', label: 'Results ready', accent: 'success' },
];

const orders: Order[] = [
  {
    id: 'o1',
    orderNumber: 'ORD-1042',
    employee: 'R. Alvarez',
    employer: 'Northwind Logistics',
    service: 'DOT physical',
    status: 'submitted',
    priority: 'urgent',
    submittedAt: day(-1),
    dueAt: day(1),
  },
  {
    id: 'o2',
    orderNumber: 'ORD-1043',
    employee: 'K. Osei',
    employer: 'Harbor Freight Rail',
    service: 'Respirator clearance',
    status: 'submitted',
    priority: 'medium',
    submittedAt: day(-2),
    dueAt: day(4),
  },
  {
    id: 'o3',
    orderNumber: 'ORD-1044',
    employee: 'J. Whitfield',
    employer: 'Northwind Logistics',
    service: 'Audiogram',
    status: 'confirmed',
    priority: 'high',
    submittedAt: day(-4),
    dueAt: day(2),
  },
  {
    id: 'o4',
    orderNumber: 'ORD-1045',
    employee: 'M. Petrov',
    employer: 'Cascade Utilities',
    service: 'Drug screen (5-panel)',
    status: 'in-progress',
    priority: 'high',
    submittedAt: day(-6),
    dueAt: day(-1),
  },
  {
    id: 'o5',
    orderNumber: 'ORD-1046',
    employee: 'S. Nakamura',
    employer: 'Cascade Utilities',
    service: 'Spirometry',
    status: 'in-progress',
    priority: 'low',
    submittedAt: day(-7),
    dueAt: day(5),
  },
  {
    id: 'o6',
    orderNumber: 'ORD-1047',
    employee: 'T. Brennan',
    employer: 'Harbor Freight Rail',
    service: 'Vision screen',
    status: 'results-ready',
    priority: 'medium',
    submittedAt: day(-11),
    dueAt: day(-3),
  },
];

const priorityAccent = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
} as const;

// The only thing that differs from the work-item configuration: six functions.
const orderAccessors: ViewAccessors<Order> = {
  getId: (o) => o.id,
  getTitle: (o) => `${o.orderNumber} · ${o.service}`,
  getSubtitle: (o) => `${o.employee} — ${o.employer}`,
  getStatus: (o) => o.status,
  getGroup: (o) => o.employer,
  getStart: (o) => o.submittedAt,
  getEnd: (o) => o.dueAt,
  getAccent: (o) => priorityAccent[o.priority],
};

function OrderInbox() {
  const [items, setItems] = React.useState(orders);
  const [selectedId, setSelectedId] = React.useState<string | null>('o1');
  const selected = items.find((o) => o.id === selectedId);

  return (
    <ViewSet<Order>
      items={items}
      accessors={orderAccessors}
      stages={orderStages}
      views={['list', 'board', 'calendar', 'gantt']}
      now={NOW}
      timeZone="UTC"
      selectedId={selectedId}
      onOpen={(id) => setSelectedId(id)}
      getHref={(id) => `#/orders/${id}`}
      onMove={async (id, toStage) => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setItems((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: toStage } : o))
        );
      }}
      renderItem={(order, { view }) =>
        view === 'board' ? (
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              {order.service}
            </p>
            <p className="text-muted-foreground text-xs">{order.employee}</p>
            <Badge size="sm" variant="secondary">
              {order.orderNumber}
            </Badge>
          </div>
        ) : undefined
      }
      detail={
        selected ? (
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">{selected.orderNumber}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Service</dt>
              <dd>{selected.service}</dd>
              <dt className="text-muted-foreground">Employee</dt>
              <dd>{selected.employee}</dd>
              <dt className="text-muted-foreground">Employer</dt>
              <dd>{selected.employer}</dd>
              <dt className="text-muted-foreground">Priority</dt>
              <dd className="capitalize">{selected.priority}</dd>
            </dl>
          </Card>
        ) : undefined
      }
    />
  );
}

// =============================================================================
// Story
// =============================================================================

const meta: Meta<typeof OrderInbox> = {
  id: 'orders-order-inbox-demo',
  title: 'BlueHive/Orders/Order Inbox (Demo)',
  component: OrderInbox,
  tags: ['autodocs', 'scope:product-specific', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

A **Storybook-only composition**, not an export: the same [ViewSet](?path=/docs/views-viewset--docs) the work-item stories use, configured for occupational-health orders. Copy the pattern; import the parts from their own folders.

It exists to make one claim checkable — that switching domains costs an accessor object, not a new component. The list, board, calendar and Gantt below are the same code as every other \`ViewSet\`. The only order-specific things are six functions, a \`stages\` array, a card body and a detail pane:

\`\`\`tsx
const orderAccessors: ViewAccessors<Order> = {
  getId: (o) => o.id,
  getTitle: (o) => \`\${o.orderNumber} · \${o.service}\`,
  getSubtitle: (o) => \`\${o.employee} — \${o.employer}\`,
  getStatus: (o) => o.status,      // board column
  getGroup: (o) => o.employer,     // swimlane
  getStart: (o) => o.submittedAt,  // calendar and Gantt
  getEnd: (o) => o.dueAt,
  getAccent: (o) => PRIORITY_ACCENT[o.priority],
};
\`\`\`

### Use it when

- You are building an inbox or queue page and want a worked example of the accessor contract on a real domain.
- You want to see \`renderItem\` returning different bodies per view — a card on the board, the default row elsewhere.

### Don't use it when

- You need an importable component — this is not exported. Import [ViewSet](?path=/docs/views-viewset--docs) and supply your own accessors.
- Your orders are the BlueHive order list with its own tab model — [OrderList](?path=/docs/orders-orderlist--docs).

### Example

The whole composition is this file; the state that matters is three lines:

\`\`\`tsx
const [items, setItems] = useState(orders);          // the caller owns the records
const [selectedId, setSelectedId] = useState(null);  // and the selection
<ViewSet items={items} accessors={orderAccessors} onMove={commit} … />
\`\`\`

\`onMove\` here waits 300ms before committing, so the board's pending state is visible.

### Limitations

- Demo-only: mock data, local state, no network. Fixtures live in this story file.
- Every limitation of the underlying views applies — see [ViewSet](?path=/docs/views-viewset--docs) and each view's own page.
- The order shape here is illustrative, not the BlueHive order schema.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'views-viewset',
          why: 'It is a ViewSet with order accessors; nothing here is order-specific except the data.',
        },
        {
          type: 'alternative to',
          target: 'orders-orderlist',
          why: 'OrderList is the shipped BlueHive order list with its own tabs; this shows the generic view system configured for orders.',
        },
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof OrderInbox>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const RTL: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <OrderInbox />
    </div>
  ),
};
