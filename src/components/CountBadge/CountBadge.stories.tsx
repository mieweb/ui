import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountBadge, type CountBadgeItem } from './CountBadge';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
} from '../Icons';

const meta: Meta<typeof CountBadge> = {
  id: 'data-display-countbadge',
  title: 'Components/Data display/CountBadge',
  component: CountBadge,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **clickable "Label N" pill** for navigation shortcuts and work queues — "Tasks 3", "Open Enc 5", "eSign 7". It is a real \`<button>\` (\`CountBadgeProps\` extends \`ButtonHTMLAttributes\`) with a \`label\`, a \`count\` chip and an optional \`icon\`. Six \`variant\`s (\`default\` | \`info\` | \`informative\` | \`success\` | \`warning\` | \`alert\`); \`countVariant\` recolours just the chip. Badges with \`count === 0\` render nothing unless \`showZero\`. Pass \`items: CountBadgeItem[]\` (\`{ id, label, status }\`, \`status\` ∈ \`CountBadgeItemStatus\`) and clicking opens a portaled popover table with one row per item and a "⋯" menu per row. Row actions come from \`actions: CountBadgeAction[]\` or, when omitted, from whichever of \`onView\` / \`onEdit\` / \`onDelete\` you supply — each of those opens a built-in \`Modal\` (detail view, edit form, delete confirmation with \`deleteLabel\`). \`countBadgeVariants\` and \`countChipVariants\` are exported.

### Use it when

- A header, sidebar or dashboard needs a **count the user can act on**: click to navigate (\`onClick\`) or to peek at the items behind the number (\`items\`).
- Several queues sit side by side and need consistent colour semantics (\`warning\` for due, \`alert\` for overdue).

### Don't use it when

- The chip is just a **label** with no count and no click — \`Badge\`.
- The number is a **recency** signal ("Reviewed 12d ago") — \`FreshnessBadge\`.
- You need a list of notifications with read state and history — \`NotificationCenter\`.
- The rows need real columns, sorting or more than a label + status — render a grid (\`DataVisNITRO\`) in your own \`Modal\` or \`Sheet\`; the popover table is fixed to #, Label, Status.

### Example

\`\`\`tsx
const { data: tasks } = useTasks(); // [{ id, label, status }]

<CountBadge
  label="Tasks"
  count={tasks.length}
  variant={tasks.some((t) => t.status === 'overdue') ? 'alert' : 'info'}
  items={tasks}
  onView={(task) => navigate('/tasks/' + task.id)}
  onDelete={(task) => deleteTask.mutate(task.id)}
  deleteLabel="task"
/>

// Navigation-only: no items, so the click just fires onClick
<CountBadge label="Open Enc" count={openEncounters} variant="warning" onClick={() => navigate('/encounters?open=1')} />
\`\`\`

The host owns the items and the mutations; the component owns popover open state and the three modals.

### Limitations

- Accessibility: the trigger sets \`aria-expanded\` when \`items\` exist but **no \`aria-haspopup\` or \`aria-controls\`**, and the popover has no role or label — it is a plain \`<div>\` with a \`<table>\`. Row "⋯" buttons are \`aria-haspopup="menu"\` + \`aria-label="Actions for {label}"\` and open a \`role="menu"\` of \`menuitem\`s. Escape and outside-click close the popover and menus; **no arrow-key navigation** inside either, and focus is not returned to the trigger.
- Built-in English strings that are **not props**: popover header "N item(s)", column heads "#", "Label", "Status", status labels (Active / Pending / Overdue / Completed / Cancelled), action labels View / Edit / Delete, the delete-confirmation copy, and the edit form's fields (Label, Status, Priority, Assigned To, Due Date, Notes). The edit form seeds \`priority: 'Normal'\` and \`assignedTo: 'Dr. Smith'\` and returns everything through \`onEdit(item, formData)\`; the view modal's Share / Export / Open in Chart buttons only \`console.warn\`. Treat the default modals as a prototype — pass your own \`actions\` for production flows.
- Layout: popover is portaled to \`<body>\` via \`useAnchoredPosition\` (\`bottom-end\`, 320px wide, 240px scroll area); row menus are \`position: fixed\` at \`rect.right\` with \`translateX(-100%)\` — physical, so they anchor to the wrong edge in RTL. Table cells are \`text-left\`.
- Theming: pill and chip use \`primary-*\` for \`info\`, semantic \`border-border\` / \`text-muted-foreground\` for \`default\`, but \`informative\` / \`success\` / \`warning\` / \`alert\` are hard-coded \`blue|green|yellow|red-*\`; popover surfaces are \`bg-white\` / \`dark:bg-neutral-800\`.
- Depends on \`Modal\`, \`Button\`, \`Input\`, \`Icons\`, \`class-variance-authority\`, \`useAnchoredPosition\`, \`useClickOutside\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'data-display-badge',
          why: 'CountBadge is a button with a count chip that can open a popover table of items; Badge is a static label span.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The default View / Edit / Delete row actions open built-in Modals.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Modal footers and the view modal action bar render Buttons.',
        },
      ],
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'info',
        'informative',
        'success',
        'warning',
        'alert',
      ],
    },
    icon: {
      table: { disable: true },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CountBadge>;

/** Default gray variant. */
export const Default: Story = {
  args: {
    label: 'Tasks',
    count: 3,
  },
};

/** Zero-count badges are hidden by default; pass `showZero` to render them anyway. */
export const ZeroCount: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <CountBadge label="Hidden (count 0)" count={0} />
      <CountBadge label="Shown via showZero" count={0} showZero />
      <CountBadge label="Tasks" count={3} />
    </div>
  ),
};

/** Info variant using the primary accent color. */
export const Info: Story = {
  args: {
    label: 'Open Enc',
    count: 5,
    variant: 'info',
  },
};

/** Informative variant (blue). */
export const Informative: Story = {
  args: {
    label: 'Notifications',
    count: 12,
    variant: 'informative',
  },
};

/** Success variant (green). */
export const Success: Story = {
  args: {
    label: 'Completed',
    count: 8,
    variant: 'success',
  },
};

/** Warning variant (yellow). */
export const Warning: Story = {
  args: {
    label: 'Due List',
    count: 4,
    variant: 'warning',
  },
};

/** Alert variant (red). */
export const Alert: Story = {
  args: {
    label: 'eSign',
    count: 7,
    variant: 'alert',
  },
};

/** With an icon before the label. */
export const WithIcon: Story = {
  args: {
    label: 'Approved',
    count: 2,
    variant: 'success',
    icon: <CheckCircleIcon size={14} />,
  },
};

/** Row of mixed variants demonstrating typical usage. */
export const ActionRow: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge label="Tasks" count={3} />
      <CountBadge label="Open Enc" count={5} variant="info" />
      <CountBadge label="Due List" count={4} variant="warning" />
      <CountBadge label="Order Req" count={4} variant="informative" />
      <CountBadge label="eSign" count={7} variant="alert" />
    </div>
  ),
};

/** All variants side by side. */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <CountBadge label="Default" count={1} variant="default" />
        <CountBadge label="Info" count={2} variant="info" />
        <CountBadge label="Informative" count={3} variant="informative" />
        <CountBadge label="Success" count={4} variant="success" />
        <CountBadge label="Warning" count={5} variant="warning" />
        <CountBadge label="Alert" count={6} variant="alert" />
      </div>
      <p className="text-muted-foreground text-sm">
        Hover over any badge to see the hover state.
      </p>
    </div>
  ),
};

/** With icons on each variant. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge
        label="Info"
        count={2}
        variant="informative"
        icon={<InfoIcon size={14} />}
      />
      <CountBadge
        label="Success"
        count={4}
        variant="success"
        icon={<CheckCircleIcon size={14} />}
      />
      <CountBadge
        label="Alert"
        count={1}
        variant="alert"
        icon={<AlertCircleIcon size={14} />}
      />
    </div>
  ),
};

// =============================================================================
// Hover menu stories
// =============================================================================

const sampleTasks: CountBadgeItem[] = [
  { id: '1', label: 'Review lab results', status: 'active' },
  { id: '2', label: 'Sign prescription order', status: 'pending' },
  { id: '3', label: 'Update medication list', status: 'overdue' },
];

const sampleEncounters: CountBadgeItem[] = [
  { id: 'e1', label: 'Office Visit – Smith', status: 'active' },
  { id: 'e2', label: 'Follow-up – Jones', status: 'active' },
  { id: 'e3', label: 'Annual Physical – Lee', status: 'pending' },
  { id: 'e4', label: 'Urgent Care – Patel', status: 'overdue' },
  { id: 'e5', label: 'Telehealth – Davis', status: 'completed' },
];

const sampleEsigns: CountBadgeItem[] = [
  { id: 's1', label: 'Lab Order #4521', status: 'pending' },
  { id: 's2', label: 'Referral – Cardiology', status: 'pending' },
  { id: 's3', label: 'Prescription – Lisinopril', status: 'overdue' },
  { id: 's4', label: 'Office Visit Note', status: 'pending' },
  { id: 's5', label: 'Discharge Summary', status: 'active' },
  { id: 's6', label: 'Radiology Order', status: 'pending' },
  { id: 's7', label: 'PT Referral', status: 'overdue' },
];

/** Hover over the badge to see the item table with default View / Edit / Delete actions. */
export const WithHoverMenu: Story = {
  args: {
    label: 'Tasks',
    count: 3,
    items: sampleTasks,
    onView: (item) => console.log('View:', item),
    onEdit: (item) => console.log('Edit:', item),
    onDelete: (item) => console.log('Delete:', item),
  },
};

/** Info variant with 5 encounters. Hover to see the table. */
export const HoverMenuInfo: Story = {
  render: () => (
    <CountBadge
      label="Open Enc"
      count={5}
      variant="info"
      items={sampleEncounters}
      onView={(item) => console.log('View:', item)}
      onEdit={(item) => console.log('Edit:', item)}
      onDelete={(item) => console.log('Delete:', item)}
    />
  ),
};

/** Alert variant with many items showing scroll behavior. */
export const HoverMenuAlert: Story = {
  render: () => (
    <CountBadge
      label="eSign"
      count={7}
      variant="alert"
      items={sampleEsigns}
      onView={(item) => console.log('View:', item)}
      onEdit={(item) => console.log('Edit:', item)}
      onDelete={(item) => console.log('Delete:', item)}
    />
  ),
};

/** Custom actions in the overflow menu. */
export const HoverMenuCustomActions: Story = {
  render: () => (
    <CountBadge
      label="Due List"
      count={3}
      variant="warning"
      items={sampleTasks}
      actions={[
        {
          key: 'view',
          label: 'View Details',
          icon: <SearchIcon size={12} />,
          onClick: (item) => console.log('View:', item),
        },
        {
          key: 'edit',
          label: 'Edit Item',
          icon: <PencilIcon size={12} />,
          onClick: (item) => console.log('Edit:', item),
        },
        {
          key: 'delete',
          label: 'Remove',
          icon: <TrashIcon size={12} />,
          variant: 'danger',
          onClick: (item) => console.log('Delete:', item),
        },
      ]}
    />
  ),
};

/** Row of badges — some with hover menus, some without. */
export const MixedRow: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CountBadge
        label="Tasks"
        count={3}
        items={sampleTasks}
        onView={(item) => console.log('View:', item)}
        onEdit={(item) => console.log('Edit:', item)}
        onDelete={(item) => console.log('Delete:', item)}
      />
      <CountBadge label="Open Enc" count={5} variant="info" />
      <CountBadge
        label="eSign"
        count={7}
        variant="alert"
        items={sampleEsigns}
        onView={(item) => console.log('View:', item)}
        onDelete={(item) => console.log('Delete:', item)}
      />
      <CountBadge label="Order Req" count={4} variant="informative" />
    </div>
  ),
};
