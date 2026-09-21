import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { ViewSwitcher } from './ViewSwitcher';
import type { ViewId } from '../../views/types';

const meta: Meta<typeof ViewSwitcher> = {
  id: 'views-viewswitcher',
  title: 'Modules/Views/ViewSwitcher',
  component: ViewSwitcher,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:alpha'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The control that chooses **which layout of one collection** is on screen — Overview, List, Board, Calendar, Gantt, Roadmap, Table. It renders a segmented \`role="radiogroup"\` of icon buttons from \`views\` (bare \`ViewId\`s, or \`ViewOption\`s when you want to override a label, icon, or disable one), and is fully controlled through \`value\` + \`onValueChange\`.

Labels and icons for the seven view ids are built in, so \`views={['list','board','gantt']}\` is a complete configuration.

### Use it when

- A page shows the same records several ways and the user picks between them.
- You are composing a view set by hand rather than using \`ViewSet\`, which renders this itself.

### Don't use it when

- Each choice has its own content panel and its own URL — [Tabs](?path=/docs/navigation-tabs--docs); this switches the _rendering_ of one collection, not the subject.
- The choice is a filter or a sort order rather than a layout — [PillSelect](?path=/docs/choice-inputs-pillselect--docs) keeps a toolbar compact by collapsing to one chip.
- Options toggle independently — [Toggle](?path=/docs/actions-toggle--docs).

### Example

\`\`\`tsx
const [view, setView] = useState<ViewId>('list');

<PageHeader
  title="Work items"
  actions={
    <ViewSwitcher
      views={['overview', 'list', 'board', 'calendar', 'gantt']}
      value={view}
      onValueChange={setView}
    />
  }
/>;
{view === 'list' && <ListView items={items} accessors={accessors} />}
\`\`\`

Persist it by lifting \`view\` into a URL search param or storage — the component stays controlled either way, so the page keeps one source of truth.

### Limitations

- Accessibility: \`role="radiogroup"\` with \`role="radio"\` options and a single tab stop on the active one. Arrow keys move **and** select, which is the radio-group pattern — every option is visible, so there is nothing to commit afterwards. \`Home\` / \`End\` jump to the ends, disabled options are skipped, and focus follows the selection. When labels are hidden the accessible name comes from \`aria-label\`; a \`title\` provides the tooltip in both modes.
- RTL: arrow direction is read from the focused button's computed \`direction\`, so it stays correct inside a locally flipped subtree. Layout uses logical spacing and the row scrolls horizontally rather than wrapping.
- Responsive: \`showLabels="responsive"\` (the default) hides labels below \`sm\`, leaving icon-only buttons that keep a 40px touch target; pass \`true\` or \`false\` to pin it.
- Theming: \`bg-card\` / \`border-border\` with a \`bg-primary-500/10\` active tint, so it follows the brand and dark mode without overrides. Condensed density is covered through \`data-slot="view-switcher"\`.
- The seven built-in labels are English. Override per option with \`ViewOption.label\`, and name the group with \`label\`.
- Not a data component: it renders no items and takes no accessors.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'views-listview',
          why: 'Chooses which view renders the collection below it.',
        },
        {
          type: 'composes with',
          target: 'views-boardview',
          why: 'Chooses which view renders the collection below it.',
        },
        {
          type: 'composes with',
          target: 'views-calendarview',
          why: 'Chooses which view renders the collection below it.',
        },
        {
          type: 'composes with',
          target: 'views-ganttview',
          why: 'Chooses which view renders the collection below it, including as the "Roadmap" option.',
        },
        {
          type: 'alternative to',
          target: 'navigation-tabs',
          why: 'Tabs switch between different content; this switches the layout of one collection.',
        },
      ],
    },
  },
  argTypes: {
    views: {
      description:
        'Views to offer, in order. Bare `ViewId`s use the built-in label and icon.',
      table: { category: 'Data' },
    },
    value: {
      description: 'The active view.',
      table: { category: 'Data' },
    },
    onValueChange: {
      description: 'Called with the newly selected view.',
      table: { category: 'Callbacks' },
      control: false,
    },
    label: {
      description: 'Accessible name of the group.',
      table: { category: 'Data' },
    },
    showLabels: {
      description:
        'Show text beside the icons. `responsive` hides it below the `sm` breakpoint.',
      control: 'radio',
      options: [true, false, 'responsive'],
      table: { category: 'Data' },
    },
    size: {
      description: 'Control density.',
      control: 'radio',
      options: ['sm', 'md'],
      table: { category: 'Data' },
    },
    classNames: {
      description: 'Class overrides for `option` and `activeOption`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof ViewSwitcher>;

function Demo(props: Partial<React.ComponentProps<typeof ViewSwitcher>>) {
  const [view, setView] = React.useState<ViewId>(props.value ?? 'list');
  return (
    <ViewSwitcher
      views={['overview', 'list', 'board', 'calendar', 'gantt', 'table']}
      {...props}
      value={view}
      onValueChange={setView}
    />
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

export const IconsOnly: Story = {
  name: 'Icons only',
  render: () => <Demo showLabels={false} />,
};

export const Small: Story = {
  render: () => <Demo size="sm" />,
};

export const WithDisabledView: Story = {
  name: 'With a disabled view',
  render: () => (
    <Demo
      views={[
        'list',
        'board',
        { id: 'gantt', disabled: true },
        { id: 'calendar', label: 'Month' },
      ]}
    />
  ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <Demo />,
};

export const RTL: Story = {
  name: 'RTL',
  render: () => (
    <div dir="rtl">
      <Demo />
    </div>
  ),
};
