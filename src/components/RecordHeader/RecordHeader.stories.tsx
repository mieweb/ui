import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { AvatarGroup } from '../AvatarGroup';
import { Breadcrumb } from '../Breadcrumb';
import { RecordHeader, type RecordHeaderProps } from './RecordHeader';

const contactArgs: RecordHeaderProps = {
  title: 'Dana Ruiz',
  subtitle: 'Director of Occupational Health',
  avatar: { name: 'Dana Ruiz' },
  badges: [
    { id: 'stage', label: 'Customer', variant: 'success' },
    { id: 'status', label: 'Open deal', variant: 'secondary' },
  ],
  meta: [
    { id: 'company', icon: Building2, label: 'Acme Logistics', href: '#' },
    { id: 'location', icon: MapPin, label: 'Columbus, OH' },
    {
      id: 'phone',
      icon: Phone,
      label: '(555) 010-0100',
      href: 'tel:5550100100',
    },
  ],
  actions: [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'assign', label: 'Assign owner', icon: UserPlus },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger' },
  ],
  onBack: () => {},
  labels: { back: 'Back to contacts' },
};

const meta: Meta<typeof RecordHeader> = {
  id: 'record-details-recordheader',
  title: 'Components/Record details/RecordHeader',
  component: RecordHeader,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

The identity band at the top of a record page — a contact, company, deal or case. It shows a back control, the record's avatar, icon or logo, the title with status badges, a subtitle, a row of meta facts (company, location, phone) that may link, a presence slot, and the record's actions. The first \`maxVisibleActions\` actions are buttons; the rest sit in an overflow menu, and on narrow screens every action does.

### Use it when

- A page is about one record and needs its name, status and primary actions above the fold.
- The same frame should serve several record types, filled from data rather than bespoke markup.

### Don't use it when

- The page is a list, settings screen or dashboard — use [PageHeader](?path=/docs/layout-pageheader--docs).
- The record is a patient chart or provider profile with clinical fields — use [PatientHeader](?path=/docs/encounter-orders-patientheader--docs) or [ProviderDetailHeader](?path=/docs/providers-providerdetailheader--docs).

### Example

\`\`\`tsx
<RecordHeader
  title={contact.name}
  avatar={{ name: contact.name, src: contact.photoUrl }}
  badges={[{ id: 'stage', label: stageLabel, variant: 'success' }]}
  meta={[{ id: 'co', icon: Building2, label: company.name, href: \`/companies/\${company.id}\` }]}
  actions={[
    { id: 'email', label: 'Email', icon: Mail, onClick: compose },
    { id: 'edit', label: 'Edit', icon: Pencil, onClick: () => setEditing(true) },
    { id: 'delete', label: 'Delete', variant: 'danger', onClick: confirmDelete },
  ]}
  presence={<AvatarGroup items={viewers} size="sm" />}
  backHref="/contacts"
  onBack={(e) => { e.preventDefault(); navigate('/contacts'); }}
/>
\`\`\`

The caller owns the data and every action; the header only owns whether its overflow menu is open.

### Limitations

- Renders a \`<header>\` with the title as \`h1\` (\`headingLevel\` changes it). Meta facts are a \`<ul>\` named by \`labels.meta\`.
- The back control and overflow trigger are icon-only and named by \`labels.back\` / \`labels.moreActions\`; the trigger exposes \`aria-haspopup="menu"\` and \`aria-expanded\` from \`Dropdown\`, and closes on select, Escape or outside click. Overflow \`href\` actions render as \`role="menuitem"\` links.
- The row stacks below \`sm\`; buttons hide there and appear in the menu instead (pure CSS, so no layout shift on hydrate). Spacing uses logical utilities and the back arrow mirrors in RTL.
- \`sticky\` pins it to \`top: 0\`; give \`RecordLayout\` a matching \`--record-layout-sticky-top\` so its sidebar clears it.
- Title editing, a collapsed "compact" bar on scroll and PHI masking are not built in — compose \`InlineEdit\` / \`PhiMask\` into \`title\`.
- English defaults ("Back", "More actions", "Details") are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'records-recordlayout',
          why: 'RecordLayout takes it as its header slot.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-patientheader',
          why: 'Generic record identity band; PatientHeader adds chart-specific clinical fields.',
        },
        {
          type: 'alternative to',
          target: 'providers-providerdetailheader',
          why: 'Generic record identity band; ProviderDetailHeader is shaped for provider profiles.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-casemanagementheader',
          why: 'Generic record identity band; CaseManagementHeader carries case workflow state.',
        },
        {
          type: 'alternative to',
          target: 'employers-employeeprofile',
          why: 'A page-width header for any record rather than an employee profile card.',
        },
        {
          type: 'alternative to',
          target: 'layout-pageheader',
          why: 'Use RecordHeader when the page is about one record; PageHeader for lists and sections.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-dropdown',
          why: 'Overflow actions open in a Dropdown menu.',
        },
        {
          type: 'uses',
          target: 'data-display-badge',
          why: 'Status badges.',
        },
        {
          type: 'uses',
          target: 'data-display-avatar',
          why: 'Renders `avatar` with Avatar.',
        },
      ],
    },
  },
  argTypes: {
    title: { description: 'Record name, rendered as the page heading.' },
    headingLevel: {
      description: 'Heading element for the title.',
      control: 'inline-radio',
      options: ['h1', 'h2', 'h3'],
    },
    subtitle: { description: 'Secondary line, e.g. job title or industry.' },
    avatar: { description: '`{ src?, name }` shown with Avatar.' },
    icon: { description: 'Lucide icon tile used when there is no avatar.' },
    media: {
      description: 'Custom leading slot (logo); wins over avatar/icon.',
    },
    badges: { description: '`{ id, label, variant }[]` beside the title.' },
    meta: { description: '`{ id, icon?, label, href? }[]` fact row.' },
    actions: {
      description:
        '`{ id, label, icon?, onClick?, href?, variant?, disabled? }[]`.',
    },
    maxVisibleActions: {
      description: 'Actions shown as buttons from `sm` up; the rest overflow.',
    },
    presence: { description: 'Slot before the actions, e.g. AvatarGroup.' },
    breadcrumbs: { description: 'Slot above the title row.' },
    onBack: { description: 'Shows a labelled back button.' },
    backHref: { description: 'Renders the back control as a link.' },
    sticky: { description: 'Pins the header to the top of its scroller.' },
    labels: { description: 'Overrides for the English defaults.' },
  },
};

export default meta;
type Story = StoryObj<typeof RecordHeader>;

export const Contact: Story = { args: contactArgs };

export const Company: Story = {
  args: {
    title: 'Acme Logistics',
    subtitle: 'Freight & warehousing · 1,200 employees',
    icon: Building2,
    badges: [{ id: 'tier', label: 'Enterprise', variant: 'default' }],
    meta: [
      { id: 'site', icon: Globe, label: 'acme.example', href: '#' },
      { id: 'hq', icon: MapPin, label: 'Columbus, OH' },
    ],
    actions: [
      { id: 'contact', label: 'Add contact', icon: UserPlus },
      { id: 'edit', label: 'Edit', icon: Pencil },
    ],
    backHref: '#',
    labels: { back: 'Back to companies' },
  },
};

export const WithPresenceAndBreadcrumbs: Story = {
  args: {
    ...contactArgs,
    onBack: undefined,
    breadcrumbs: (
      <Breadcrumb
        items={[
          { label: 'Contacts', href: '#' },
          { label: 'Acme Logistics', href: '#' },
          { label: 'Dana Ruiz' },
        ]}
      />
    ),
    presence: (
      <AvatarGroup
        size="sm"
        items={[
          { id: 'j', name: 'Jordan Lee', presence: 'editing' },
          { id: 'p', name: 'Priya Shah', presence: 'viewing' },
        ]}
      />
    ),
  },
};

export const Minimal: Story = { args: { title: 'Untitled record' } };

export const Mobile: Story = {
  args: contactArgs,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
