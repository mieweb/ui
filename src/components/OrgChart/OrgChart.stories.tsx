import type { Meta, StoryObj } from '@storybook/react-vite';
import '@xyflow/react/dist/style.css';
import { OrgChart } from './OrgChart';
import { orgLocations, orgPeople } from './storyData';

const meta: Meta<typeof OrgChart> = {
  id: 'records-orgchart',
  title: 'Modules/Records/OrgChart',
  component: OrgChart,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

An interactive hierarchy of people or places — a company org chart, a clinic network, a reporting line — drawn as a pannable, zoomable chart (React Flow, laid out by elkjs) with a keyboard-navigable **list view** of the same data. It reads a flat \`nodes\` array of \`{ id, parentId, name, title?, subtitle?, group?, avatarUrl?, meta? }\`; several roots make a forest.

It opens \`initialDepth\` levels deep, and every node with reports carries an expand/collapse button with its child count. The toolbar searches name, title, subtitle and group (expanding to and framing the matches), filters by group (each group gets a colour from the token palette), expands or collapses everything, fits the view, toggles a minimap and goes full screen. Selecting a node opens a details panel.

Headless: it never fetches. \`nodes\`, \`loading\` and \`error\` are props; opening a record leaves through \`onOpen(id, node)\` and/or \`getHref(id, node)\`. Ships on its own entry, \`@mieweb/ui/org-chart\`.

### Use it when

- The **shape** of a hierarchy is the information — who reports to whom, which clinics roll up to which region.
- People need to find someone in a large organization and see their context (manager, reports, team).
- You want to point at one record in its context — pass \`focusId\` (framed) or \`highlightedId\` (marked, e.g. the signed-in user).

### Don't use it when

- Rows need sorting, columns or export — that is a grid; grids start with \`DataVisNitroGrid\`.
- The hierarchy is a navigation menu or a file tree the user edits — reach for a tree or menu component, not a chart.
- You only need a static, non-interactive diagram on a marketing page; the chart's toolbar and canvas are overhead there.

### Example

\`\`\`tsx
import '@xyflow/react/dist/style.css';
import { OrgChart } from '@mieweb/ui/org-chart';

<OrgChart
  nodes={employees.map((e) => ({
    id: e.id,
    parentId: e.managerId,
    name: e.displayName,
    title: e.jobTitle,
    group: e.department,
    avatarUrl: e.photoUrl,
  }))}
  loading={isLoading}
  error={error}
  onRetry={refetch}
  highlightedId={me.id}
  labels={{ highlighted: 'You' }}
  getHref={(id) => \`/people/\${id}\`}
  onOpen={(id) => navigate(\`/people/\${id}\`)}
  renderBadges={(n) => (isAnniversary(n) ? <Badge size="sm">5 yr</Badge> : null)}
/>;
\`\`\`

The page owns the data, the fetch and navigation; the chart owns expansion, search and layout.

### Limitations

- **Install:** \`@xyflow/react\` and \`elkjs\` are optional peers — install them and import \`@xyflow/react/dist/style.css\` once in your app; the component does not import CSS. elkjs is loaded lazily on first layout. Client-only: render behind a client boundary.
- **Accessibility:** a canvas is hard for assistive tech, so the **List** view renders the same data as a WAI-ARIA \`tree\` (\`treeitem\`s with \`aria-level\`, \`aria-setsize\`, \`aria-posinset\`, \`aria-expanded\`; one roving tab stop; Up/Down, Left/Right — mirrored in RTL — Home/End, Enter/Space opens details). On the canvas each card is a button and each expander a button with \`aria-expanded\`. The search result count is a polite \`role="status"\`; the details panel is a non-modal \`dialog\` that takes focus, closes on Escape and returns focus. Toolbar toggles use \`aria-pressed\`.
- **Responsive:** defaults to the list view below 640px (\`defaultView\` / \`view\` override). Full screen uses the Fullscreen API and falls back to a fixed overlay (Escape exits).
- **Motion:** fit-to-view animates unless \`prefers-reduced-motion\` is set.
- **Theming:** cards use \`bg-card\` / \`border-border\`; group colour is a token name (\`getGroupAccent\`), drawn as a wash and a marker, never as text colour. React Flow is themed through its \`--xy-*\` variables mapped to \`--mieweb-*\` tokens, so dark mode and brands follow.
- **i18n:** every string is in \`labels\` (English defaults in \`defaultOrgChartLabels\`, some are functions for counts).
- Layout is fixed-size cards; long names truncate (the full text is in the list view and the details panel). Nodes are not draggable and the hierarchy is read-only.
- The [YChart](?path=/docs/data-display-ychart--docs) Storybook demo is not public API; this component supersedes the need for it.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/org-chart',
      peers: ['@xyflow/react', 'elkjs'],
      collection: true,
      relationships: [
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Person cards and the details panel show an Avatar.',
        },
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Toolbar actions and the retry action are Buttons.',
        },
        {
          type: 'uses',
          target: 'loading-spinner',
          why: 'The loading state shows a Spinner.',
        },
      ],
    },
  },
  argTypes: {
    nodes: {
      description:
        'Flat `{ id, parentId, name, title?, subtitle?, group?, avatarUrl?, meta? }[]`. Order sets sibling order.',
      table: { category: 'Data' },
      control: false,
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
    nodeVariant: {
      description:
        '`person` (avatar, name, title) or `location` (icon, name, subtitle).',
      control: 'radio',
      options: ['person', 'location'],
      table: { category: 'Data' },
    },
    direction: {
      description: 'Layout direction.',
      control: 'radio',
      options: ['DOWN', 'RIGHT'],
      table: { category: 'Data' },
    },
    initialDepth: {
      description: 'Levels shown on first render.',
      control: { type: 'number', min: 1, max: 6 },
      table: { category: 'Data' },
    },
    focusId: {
      description: 'Expanded into view and framed.',
      table: { category: 'Data' },
    },
    highlightedId: {
      description: 'Expanded into view and marked (e.g. the signed-in user).',
      table: { category: 'Data' },
    },
    defaultQuery: {
      description: 'Initial search text.',
      table: { category: 'Data' },
    },
    defaultGroup: {
      description: 'Initial group filter.',
      table: { category: 'Data' },
    },
    view: {
      description: 'Controlled view.',
      control: 'radio',
      options: ['chart', 'list'],
      table: { category: 'Data' },
    },
    defaultView: {
      description:
        'Initial view; defaults to `list` below 640px, else `chart`.',
      control: 'radio',
      options: ['chart', 'list'],
      table: { category: 'Data' },
    },
    defaultShowMinimap: {
      description: 'Show the minimap initially.',
      table: { category: 'Data' },
    },
    onSelect: {
      description: 'Called when details open (`id`) or close (`null`).',
      table: { category: 'Callbacks' },
      control: false,
    },
    onOpen: {
      description: 'The details panel’s Open action.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getHref: {
      description: 'Renders the Open action as a real link.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onRetry: {
      description: 'Retries a failed load; the action renders only when given.',
      table: { category: 'Callbacks' },
      control: false,
    },
    onViewChange: {
      description: 'Called when the user switches between chart and list.',
      table: { category: 'Callbacks' },
      control: false,
    },
    getGroupAccent: {
      description:
        'Token name per group (`primary`, `info`, `success`, `warning`, `neutral`, `destructive`).',
      table: { category: 'Callbacks' },
      control: false,
    },
    renderNode: {
      description: 'Replaces a card’s body; the expander and edges stay.',
      table: { category: 'Slots' },
      control: false,
    },
    renderBadges: {
      description:
        'Badges on cards, list rows and details (e.g. anniversaries).',
      table: { category: 'Slots' },
      control: false,
    },
    renderDetail: {
      description: 'Replaces the details panel body.',
      table: { category: 'Slots' },
      control: false,
    },
    emptyState: {
      description: 'Replaces the built-in empty state.',
      table: { category: 'Slots' },
      control: false,
    },
    labels: {
      description: 'Overrides the English strings (`defaultOrgChartLabels`).',
      table: { category: 'Slots' },
      control: false,
    },
    classNames: {
      description:
        'Class overrides for `root`, `toolbar`, `canvas`, `node`, `tree`, `treeItem`, `detail` and `state`.',
      table: { category: 'Slots' },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof OrgChart>;

/** 25 people, four levels, three departments. Opens two levels deep. */
export const Default: Story = {
  args: { nodes: orgPeople, defaultView: 'chart' },
};

/** A clinic network: network → regions → clinics, laid out left to right. */
export const Locations: Story = {
  args: {
    nodes: orgLocations,
    nodeVariant: 'location',
    direction: 'RIGHT',
    defaultView: 'chart',
    labels: {
      directReports: (n) => `${n} sites`,
      reportsTo: (name) => `Part of ${name}`,
    },
  },
};

/** A search expands to its matches, rings them and frames them. */
export const Search: Story = {
  args: { nodes: orgPeople, defaultView: 'chart', defaultQuery: 'engineer' },
};

/** `focusId` frames a record; `highlightedId` marks the signed-in user. */
export const Focused: Story = {
  args: {
    nodes: orgPeople,
    defaultView: 'chart',
    focusId: 'ops-3',
    highlightedId: 'ops-3',
    labels: { highlighted: 'You' },
  },
};

export const Empty: Story = {
  args: { nodes: [] },
};

export const Loading: Story = {
  args: { nodes: [], loading: true },
};

export const Error: Story = {
  args: {
    nodes: [],
    error: new globalThis.Error('Request failed'),
    onRetry: () => {},
  },
};

/** Below 640px the list view is the default. */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: { nodes: orgPeople },
};
