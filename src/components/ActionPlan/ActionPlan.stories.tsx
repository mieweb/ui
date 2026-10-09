import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  ActionPlan,
  type ActionPlanProps,
  type ActionPlanStep,
} from './ActionPlan';
import { planNow, planSteps, planZone } from './storyData';

const meta: Meta<typeof ActionPlan> = {
  id: 'records-actionplan',
  title: 'Modules/Records/ActionPlan',
  component: ActionPlan,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

A **shared checklist** — a mutual action plan, an onboarding plan, a close checklist. Each step has a title, an optional owner and due date, a status (\`todo\`, \`in_progress\`, \`done\`) and a note. A progress bar counts done steps, and steps past their due date are flagged **Overdue**.

Headless: steps arrive as \`ActionPlanStep[]\` through \`items\`; ticking a box leaves through \`onStatusChange(id, status)\`.

### Use it when

- Two parties track the same short list of commitments with owners and dates.
- "How far along are we, and what is late?" is the question the card answers.

### Don't use it when

- Steps are a fixed linear sequence with one current step — [Timeline](?path=/docs/data-display-timeline--docs) or a step indicator.
- The work items move between many stages — a board ([BoardView](?path=/docs/views-boardview--docs)).
- The list needs sorting, filtering or bulk edits across many rows — use a data grid.

### Example

\`\`\`tsx
<ActionPlan
  title="Mutual action plan"
  items={steps}
  arrange="dueDate"
  onStatusChange={(id, status) => updateStep(id, { status })}
  onAdd={() => setAdding(true)}
  onOpen={(id) => setEditing(id)}
/>;
\`\`\`

### Limitations

- Accessibility: the card is a \`<section>\` labelled by its heading. Each checkbox is named by its step title (\`aria-labelledby\`). While \`onStatusChange\` is pending the box shows the new state, the step is \`aria-busy\` and the box is disabled; a rejected promise restores the previous state. Overdue is said in text, not colour alone.
- The checkbox toggles between \`done\` and \`todo\`; set \`in_progress\` from your own control (e.g. in the \`onOpen\` editor).
- Overdue compares due dates by calendar day in \`timeZone\` against \`now\` (default: the current time). Dates format through Luxon with \`locale\`.
- \`arrange="status"\` groups In progress, To do, Done under sub-headings one level below \`headingLevel\`. Strings are English defaults overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      collection: true,
      relationships: [
        {
          type: 'uses',
          target: 'choice-inputs-checkbox',
          why: 'Marks a step done.',
        },
        {
          type: 'uses',
          target: 'loading-progress',
          why: 'Done-of-total progress.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Step owners.',
        },
      ],
    },
  },
  argTypes: {
    items: { description: 'The steps.', table: { category: 'Data' } },
    title: { description: 'Card heading.', table: { category: 'Data' } },
    arrange: {
      description: 'Keep order, sort by due date, or group by status.',
      control: 'radio',
      options: ['manual', 'dueDate', 'status'],
      table: { category: 'Data' },
    },
    now: {
      description: 'Reference time for overdue checks.',
      table: { category: 'Data' },
      control: false,
    },
    locale: {
      description: 'BCP 47 locale for due dates.',
      table: { category: 'Data' },
    },
    timeZone: {
      description: 'IANA zone for due dates.',
      table: { category: 'Data' },
    },
    loading: { description: 'Loading state.', table: { category: 'Data' } },
    error: {
      description: 'Error state.',
      table: { category: 'Data' },
      control: false,
    },
    onStatusChange: {
      description:
        '`(id, status) => void | Promise<void>`; optimistic, restored on rejection.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onAdd: {
      description: 'Shows the Add step button.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onOpen: {
      description: 'A step title was activated.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Renders step titles as real anchors.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRetry: {
      description: 'Retries a failed load.',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderStepMeta: {
      description: 'Extra content on a step’s meta line.',
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
      control: false,
    },
    classNames: {
      description:
        'Class overrides keyed by slot: header, progress, group, step, overdueStep, state.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof ActionPlan>;

const base = {
  items: planSteps,
  now: planNow,
  timeZone: planZone,
} satisfies Partial<ActionPlanProps>;

function InteractivePlan(args: ActionPlanProps) {
  const [steps, setSteps] = React.useState<ActionPlanStep[]>(args.items);
  return (
    <ActionPlan
      {...args}
      items={steps}
      onStatusChange={async (id, status) => {
        await new Promise((r) => setTimeout(r, 400));
        setSteps((list) =>
          list.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }}
      onAdd={() =>
        setSteps((list) => [
          ...list,
          { id: `s${list.length + 1}`, title: 'New step', status: 'todo' },
        ])
      }
    />
  );
}

export const Default: Story = {
  render: (args) => <InteractivePlan {...args} />,
  args: { ...base, title: 'Mutual action plan' },
};

export const SortedByDueDate: Story = {
  name: 'Sorted by due date',
  args: { ...base, arrange: 'dueDate' },
};

export const GroupedByStatus: Story = {
  name: 'Grouped by status',
  args: { ...base, arrange: 'status' },
};

export const ReadOnly: Story = {
  name: 'Read-only',
  args: { ...base },
};

export const Empty: Story = { args: { ...base, items: [], onAdd: () => {} } };

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
  render: (args) => <InteractivePlan {...args} />,
  args: { ...base },
};

export const RTL: Story = {
  name: 'RTL',
  render: (args) => (
    <div dir="rtl">
      <InteractivePlan {...args} />
    </div>
  ),
  args: { ...base },
};
