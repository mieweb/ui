import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Building2,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { ActivityFeed, type ActivityFeedCategory } from '../ActivityFeed';
import { AssociationList } from '../AssociationList';
import { PropertyList, type PropertyListItem } from '../PropertyList';
import { RecordHeader } from '../RecordHeader';
import { RecordLayout } from './RecordLayout';

interface Activity {
  id: string;
  kind: string;
  title: string;
  at: string;
  by: string;
}

const now = new Date('2026-03-12T17:00:00Z');

const categories: ActivityFeedCategory[] = [
  { id: 'call', label: 'Calls', icon: Phone, color: 'success' },
  { id: 'email', label: 'Emails', icon: Mail, color: 'info' },
  { id: 'note', label: 'Notes', icon: StickyNote, color: 'warning' },
];

const activities: Activity[] = [
  {
    id: 'a1',
    kind: 'call',
    title: 'Discovery call',
    at: '2026-03-12T15:20:00Z',
    by: 'Jordan Lee',
  },
  {
    id: 'a2',
    kind: 'email',
    title: 'Sent pricing proposal',
    at: '2026-03-12T13:05:00Z',
    by: 'Jordan Lee',
  },
  {
    id: 'a3',
    kind: 'note',
    title: 'Wants e-referrals live before Q3',
    at: '2026-03-10T19:40:00Z',
    by: 'Priya Shah',
  },
];

const contactFields: PropertyListItem[] = [
  {
    key: 'email',
    label: 'Email',
    value: 'dana@acme.example',
    type: 'email',
    copyable: true,
  },
  { key: 'phone', label: 'Phone', value: '(555) 010-0100', type: 'tel' },
  {
    key: 'title',
    label: 'Job title',
    value: 'Director of Occupational Health',
  },
  { key: 'owner', label: 'Owner', value: 'Jordan Lee' },
  { key: 'source', label: 'Lead source', value: 'Webinar' },
];

const companyFields: PropertyListItem[] = [
  { key: 'domain', label: 'Domain', value: 'acme.example' },
  { key: 'industry', label: 'Industry', value: 'Freight & warehousing' },
  { key: 'size', label: 'Employees', value: 1200 },
  { key: 'owner', label: 'Owner', value: 'Jordan Lee' },
];

const people = [
  { id: 'c1', name: 'Dana Ruiz', subtitle: 'Director of Occupational Health' },
  { id: 'c2', name: 'Marcus Webb', subtitle: 'Safety Manager' },
];
const deals = [
  { id: 'd1', name: 'Occ health bundle', subtitle: '$48,000 · Proposal' },
];

function Feed() {
  return (
    <ActivityFeed
      items={activities}
      getId={(a) => a.id}
      getDate={(a) => a.at}
      getCategory={(a) => a.kind}
      getTitle={(a) => a.title}
      getActor={(a) => ({ name: a.by })}
      categories={categories}
      now={now}
      timeZone="America/New_York"
    />
  );
}

const contactHeader = (
  <RecordHeader
    title="Dana Ruiz"
    subtitle="Director of Occupational Health"
    avatar={{ name: 'Dana Ruiz' }}
    badges={[{ id: 'stage', label: 'Customer', variant: 'success' }]}
    meta={[
      { id: 'co', icon: Building2, label: 'Acme Logistics', href: '#' },
      { id: 'loc', icon: MapPin, label: 'Columbus, OH' },
    ]}
    actions={[
      { id: 'email', label: 'Email', icon: Mail },
      { id: 'edit', label: 'Edit', icon: Pencil },
      { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger' },
    ]}
    backHref="#"
    labels={{ back: 'Back to contacts' }}
  />
);

function ContactRecord() {
  const [fields, setFields] = React.useState(contactFields);
  return (
    <RecordLayout
      header={contactHeader}
      sidebar={
        <PropertyList
          items={fields.map((f) => ({ ...f, editable: true }))}
          onSave={(key, value) =>
            setFields((prev) =>
              prev.map((f) => (f.key === key ? { ...f, value } : f))
            )
          }
        />
      }
      tabs={[
        {
          id: 'activity',
          label: 'Activity',
          count: activities.length,
          content: <Feed />,
        },
        {
          id: 'notes',
          label: 'Notes',
          content: (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          ),
        },
      ]}
      tabsUrlParam="tab"
      aside={
        <>
          <AssociationList
            title="Companies"
            items={[
              { id: 'co1', name: 'Acme Logistics', subtitle: 'Columbus, OH' },
            ]}
            getHref={() => '#'}
          />
          <AssociationList title="Deals" items={deals} getHref={() => '#'} />
        </>
      }
    />
  );
}

const meta: Meta<typeof RecordLayout> = {
  id: 'records-recordlayout',
  title: 'Modules/Records/RecordLayout',
  component: RecordLayout,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

The page frame for a single record — contact, company, deal, case. It places a \`header\` (usually [RecordHeader](?path=/docs/record-details-recordheader--docs)) above three columns: a \`sidebar\` of fields, a main column of \`tabs\` (or \`children\`), and an optional \`aside\` of related records. It owns layout and the mobile sidebar toggle only; every slot is the caller's.

### Use it when

- A record page needs the familiar CRM shape: fields on the start side, activity in the middle, associations on the end side.
- Several record types should share one responsive frame instead of each page hand-rolling its grid.

### Don't use it when

- The page is a grid of independent widgets — use [CustomizableDashboard](?path=/docs/dashboards-customizabledashboard--docs).
- The page is a list or settings screen — a [PageHeader](?path=/docs/layout-pageheader--docs) over your own content is enough.

### Example

\`\`\`tsx
<RecordLayout
  header={<RecordHeader title={contact.name} avatar={{ name: contact.name }} actions={actions} />}
  sidebar={<PropertyList items={fields} onSave={saveField} />}
  tabs={[
    { id: 'activity', label: 'Activity', count: items.length, content: <ActivityFeed items={items} {...accessors} /> },
    { id: 'notes', label: 'Notes', content: <Notes /> },
  ]}
  tabsUrlParam="tab"
  aside={<AssociationList title="Deals" items={deals} getHref={(id) => \`/deals/\${id}\`} />}
/>
\`\`\`

\`tabsUrlParam\` keeps the open tab in \`?tab=\` for deep links; pass \`activeTab\` + \`onTabChange\` instead to own it (the URL sync then stays off).

### Limitations

- Landmarks: the sidebar and aside are \`<aside>\` elements named by \`labels.sidebar\` / \`labels.aside\`; the main column is a \`<section>\` region named by \`labels.main\`. It does not render \`<main>\` — the app shell owns that.
- DOM order is header → sidebar → main → aside, matching the visual order at every breakpoint, so focus order never diverges from what is on screen. On mobile the sidebar collapses to a single toggle, which keeps the main column one tab stop away; screen-reader users can also jump by landmark.
- Breakpoints: below \`md\` one column with the sidebar behind a toggle (\`aria-expanded\`, \`aria-controls\`); from \`md\` an 18rem sidebar beside the main column with the aside below main; from \`xl\` three columns (20rem / fluid / 20rem). Grid columns follow the writing direction, so the sidebar is on the right in RTL.
- From \`md\` the sidebar is sticky and scrolls on its own. With a sticky header, set \`--record-layout-sticky-top\` (default \`1rem\`) on the layout to its height.
- \`sidebarStorageKey\` persists only the mobile toggle; it is read after mount, so a stored "open" appears one frame late. The chevron's rotation is disabled under \`prefers-reduced-motion\`.
- Tabs come from [Tabs](?path=/docs/navigation-tabs--docs); counts render as a Badge and are part of the tab's accessible name.
- English defaults ("Record details", "Related records", "Record content", "Record sections", "Details") are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'record-details-recordheader',
          why: 'RecordHeader is the intended `header` slot.',
        },
        {
          type: 'alternative to',
          target: 'dashboards-customizabledashboard',
          why: 'A fixed frame for one record rather than a grid of user-arranged widgets.',
        },
        {
          type: 'uses',
          target: 'navigation-tabs',
          why: 'The `tabs` prop renders with Tabs, including `urlParam`.',
        },
      ],
    },
  },
  argTypes: {
    header: { description: 'Slot above the columns, usually RecordHeader.' },
    sidebar: { description: 'Start column of fields, e.g. PropertyList.' },
    aside: { description: 'End column from `xl`; below main otherwise.' },
    tabs: {
      description: '`{ id, label, count?, content }[]`; replaces `children`.',
    },
    activeTab: { description: 'Controlled tab id.' },
    defaultTab: { description: 'Initial tab id; defaults to the first.' },
    onTabChange: { description: 'Called with the selected tab id.' },
    tabsUrlParam: {
      description: 'Query parameter mirroring the tab (uncontrolled only).',
    },
    sidebarCollapsible: {
      description: 'Below `md`, hide the sidebar behind a toggle.',
    },
    defaultSidebarOpen: { description: 'Initial state of the mobile toggle.' },
    sidebarStorageKey: {
      description: '`localStorage` key that persists the mobile toggle.',
    },
    labels: { description: 'Overrides for the English defaults.' },
  },
};

export default meta;
type Story = StoryObj<typeof RecordLayout>;

export const Contact: Story = { render: () => <ContactRecord /> };

export const Company: Story = {
  args: {
    header: (
      <RecordHeader
        title="Acme Logistics"
        subtitle="Freight & warehousing"
        icon={Building2}
        actions={[{ id: 'edit', label: 'Edit', icon: Pencil }]}
        backHref="#"
        labels={{ back: 'Back to companies' }}
      />
    ),
    sidebar: <PropertyList items={companyFields} />,
    tabs: [
      {
        id: 'contacts',
        label: 'Contacts',
        count: people.length,
        content: (
          <AssociationList
            title="Contacts"
            items={people}
            getHref={() => '#'}
          />
        ),
      },
      {
        id: 'conversations',
        label: 'Conversations',
        content: (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            No conversations yet.
          </p>
        ),
      },
    ],
    aside: <AssociationList title="Deals" items={deals} getHref={() => '#'} />,
  },
};

export const Minimal: Story = {
  args: {
    header: <RecordHeader title="Untitled record" />,
    children: (
      <p className="text-muted-foreground text-sm">
        Any content can fill the main column when there are no tabs.
      </p>
    ),
  },
};

export const Mobile: Story = {
  render: () => <ContactRecord />,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
