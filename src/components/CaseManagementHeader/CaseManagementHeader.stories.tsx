import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import {
  CaseManagementHeader,
  CaseContextBar,
  type CaseInfo,
  type CasePatient,
  type CaseDetailItem,
} from './CaseManagementHeader';
import { CollabStatus } from '../CollabStatus';
import { Alert, AlertTitle } from '../Alert';

const meta: Meta<typeof CaseManagementHeader> = {
  id: 'encounter-orders-casemanagementheader',
  title: 'Healthcare/Encounter & orders/CaseManagementHeader',
  component: CaseManagementHeader,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

The **case-management header**: a persistent \`CaseContextBar\` (\`#caseNumber\`, status \`Badge\`, \`caseType\`, who else is editing, a \`collabStatus\` slot) over a **patient identity row** (\`patient.name\` as \`<h2>\`, MRN, DOB + age) with built-in **Add Case Note** / **Close Case** actions (rendered only when \`onAddCaseNote\` / \`onCloseCase\` are passed; text buttons on \`md+\`, icon-only below), an \`actions\` slot for more, and an expandable \`<dl>\` **details grid** (\`details: { label, value }[]\` plus an automatic *Days Open* computed from \`caseInfo.openedDate\` or supplied as \`daysOpen\`). Expansion is uncontrolled (\`defaultExpanded\`) or controlled (\`expanded\` + \`onExpandedChange\`); \`showContextBar={false}\` drops the bar (the back button then moves into the identity row); \`sticky\` pins it; the \`alert\` slot attaches an \`<Alert>\` flush under the header (e.g. the required fields blocking close). \`CaseContextBar\` is exported standalone so case context can be pinned on other pages, and \`labels\` (\`CaseManagementHeaderLabels\`, defaults in \`defaultCaseManagementHeaderLabels\`) externalises **every** user-facing string including the age and editing formatters.

### Use it when

- The page is a **case** — occupational-health absence, incident / illness, workers' comp — whose identity is the case number and status, with the patient as context rather than the subject.
- You need case-level actions (note, close) and a small details grid the user can collapse to save vertical space.
- Several users work the same case and you want an "Ann, Bo are editing" line plus a \`CollabStatus\` chip in the bar.

### Don't use it when

- The page is the **patient's chart** — [PatientHeader](?path=/docs/encounter-orders-patientheader--docs) leads with demographics, allergy / medication banners, count badges and a patient action menu; CaseManagementHeader leads with the case.
- The page is a generic titled section with breadcrumb and tabs — [PageHeader](?path=/docs/layout-pageheader--docs); the app-wide bar is [AppHeader](?path=/docs/layout-appheader--docs).
- You need case fields to be **editable** in the header — the details grid is read-only; edit elsewhere and feed \`details\` back.

### Example

\`\`\`tsx
const [expanded, setExpanded] = useState(false);

<CaseManagementHeader
  sticky
  caseInfo={{ caseNumber: kase.number, status: kase.status, statusVariant: kase.status === 'Open' ? 'success' : 'secondary', caseType: kase.type, openedDate: kase.openedAt }}
  patient={{ name: patient.displayName, mrn: patient.mrn, dob: formatDate(patient.dob), age: patient.age }}
  details={[
    { label: t('caseManager'), value: kase.manager ?? '—' },
    { label: t('followUp'), value: formatDate(kase.followUp) },
  ]}
  expanded={expanded}
  onExpandedChange={setExpanded}
  showBackButton
  onBack={() => navigate('/cases')}
  onAddCaseNote={() => openNoteEditor(kase.id)}
  onCloseCase={canClose ? () => closeCase(kase.id) : undefined}   // omit to hide the button
  editingUsers={presence.others.map((u) => u.name)}
  collabStatus={<CollabStatus connected={presence.connected} showLog={false} />}
  alert={missing.length > 0 && <Alert variant="danger" className="rounded-none border-x-0 border-t-0"><AlertTitle>{t('completeToClose')}</AlertTitle></Alert>}
  labels={{ daysOpenTerm: t('daysOpen'), formatAge: (age) => t('yearsOld', { age }) }}
/>
\`\`\`

The header owns nothing but the (optionally uncontrolled) expanded flag; case data, presence and permissions are the host's.

### Limitations

- **Accessibility as implemented.** Patient name is an \`<h2>\`; the details toggle is an icon \`Button\` with \`aria-label\` (expand / collapse text from \`labels\`), \`aria-expanded\` and \`aria-controls\` pointing at the \`<dl>\`; the back button and icon-only mobile actions are \`aria-label\`led; the bar's divider is \`aria-hidden\`. The context bar has no landmark role and the header is a plain \`div\` — wrap it in \`<header>\` yourself. Presence changes ("… is editing") are static text, not announced. Case number has a \`title\` tooltip only.
- **Days open** is computed with \`Date.now()\` at render from \`openedDate\` (any \`Date.parse\`-able string) and is not timezone-aware; pass \`daysOpen\` for server-computed values. Nothing else is derived or validated.
- **Actions slot** is a horizontal \`ButtonGroup\` capped at \`max-w-[60%]\`; long labels truncate rather than wrap.
- **Responsive / RTL.** Built-in actions swap text ↔ icon at \`md\`; MRN / DOB wrap under the name. Logical margins (\`ms-*\`) are used for the back button and the bar's trailing group, so RTL mirrors.
- **Theming.** Semantic tokens (\`bg-card\`, \`border-border\`, \`text-muted-foreground\`) plus \`primary-50 / 950\` for the bar; status colour comes from \`statusVariant\`.
- **i18n.** Fully externalised via \`labels\` (English defaults) — the only header in this family that is.
- **Dependencies / entry.** \`Badge\`, \`Button\`, \`ButtonGroup\`, \`Icons\`; main \`@mieweb/ui\` entry, no peers. \`CollabStatus\` and \`Alert\` are passed in by the host, not imported.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'encounter-orders-patientheader',
          why: 'CaseManagementHeader leads with the case (number, status, days open) and keeps the patient as context; PatientHeader leads with the patient (demographics, allergies, medications, actions).',
        },
        {
          type: 'alternative to',
          target: 'layout-pageheader',
          why: 'PageHeader titles a generic page with breadcrumb and tabs; CaseManagementHeader is the record banner for a case with its own context bar and details grid.',
        },
        {
          type: 'composes with',
          target: 'feedback-collabstatus',
          why: 'The collabStatus slot on the context bar is designed for a CollabStatus chip next to the "… are editing" line.',
        },
      ],
    },
  },
  argTypes: {
    sticky: { control: 'boolean' },
    showBackButton: { control: 'boolean' },
    showContextBar: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
    expanded: { control: 'boolean' },
    caseInfo: { table: { disable: true } },
    patient: { table: { disable: true } },
    details: { table: { disable: true } },
    actions: { table: { disable: true } },
    collabStatus: { table: { disable: true } },
    alert: { table: { disable: true } },
    onBack: { action: 'back-clicked' },
    // onAddCaseNote / onCloseCase gate whether the built-in buttons render,
    // so stories opt in with `fn()` args instead of an argTypes action (which
    // would inject handlers into every story).
    onExpandedChange: { action: 'expanded-changed' },
  },
};

export default meta;
type Story = StoryObj<typeof CaseManagementHeader>;

// ─── Sample Data ─────────────────────────────────────────────────────────────

const sampleCase: CaseInfo = {
  caseNumber: 'S2025-0001',
  status: 'Open',
  caseType: 'Absence management',
  openedDate: '2025-01-21',
};

const samplePatient: CasePatient = {
  name: 'Eleanor Washburn',
};

const sampleDetails: CaseDetailItem[] = [
  { label: 'Case Manager', value: 'Unassigned' },
  { label: 'Opened', value: 'Jan 21, 2025' },
  { label: 'Follow-up', value: 'Feb 4, 2025' },
];

const richCase: CaseInfo = {
  caseNumber: '20251102-3351',
  status: 'Open',
  caseType: 'Incident / Illness',
  openedDate: '2025-11-02',
};

const richPatient: CasePatient = {
  name: 'Lisa Ryan',
  mrn: 'MR-004821',
  dob: '03/18/1978',
  age: 48,
};

const richDetails: CaseDetailItem[] = [
  { label: 'Case Manager', value: 'Casey Manager' },
  { label: 'Opened', value: '11/02/2025' },
  { label: 'Follow-up', value: '11/16/2025' },
  { label: 'Disability Date', value: '11/04/2025' },
];

const liveStatus = <CollabStatus connected showLog={false} />;

const editingUsers = ['User 3844575388'];

// ─── Stories ─────────────────────────────────────────────────────────────────

/** The mockup layout: context bar, patient row, collapsed details. */
export const Default: Story = {
  args: {
    caseInfo: sampleCase,
    patient: samplePatient,
    details: sampleDetails,
    showBackButton: true,
    onAddCaseNote: fn(),
    editingUsers,
    collabStatus: liveStatus,
  },
};

/** Expanded details grid with the built-in actions (POC layout). */
export const Expanded: Story = {
  args: {
    caseInfo: richCase,
    patient: richPatient,
    details: richDetails,
    showBackButton: true,
    defaultExpanded: true,
    onAddCaseNote: fn(),
    onCloseCase: fn(),
    editingUsers,
    collabStatus: liveStatus,
  },
};

/** Days open supplied explicitly instead of computed from `openedDate`. */
export const ExplicitDaysOpen: Story = {
  args: {
    caseInfo: { ...sampleCase, daysOpen: 568 },
    patient: samplePatient,
    details: sampleDetails,
    showBackButton: true,
    defaultExpanded: true,
    onAddCaseNote: fn(),
    collabStatus: liveStatus,
  },
};

/** The context bar alone, for pinning case context to other pages. */
export const ContextBarOnly: StoryObj<typeof CaseContextBar> = {
  render: () => (
    <CaseContextBar
      caseInfo={sampleCase}
      editingUsers={editingUsers}
      collabStatus={liveStatus}
    />
  ),
};

/** Without the context bar — identity row and details only. */
export const WithoutContextBar: Story = {
  args: {
    caseInfo: richCase,
    patient: richPatient,
    details: richDetails,
    showContextBar: false,
    showBackButton: true,
    onAddCaseNote: fn(),
  },
};

/** Validation alert attached to the bottom of the header via the `alert` slot. */
export const WithAlert: Story = {
  args: {
    caseInfo: richCase,
    patient: richPatient,
    details: richDetails,
    showBackButton: true,
    defaultExpanded: true,
    onAddCaseNote: fn(),
    onCloseCase: fn(),
    editingUsers,
    collabStatus: liveStatus,
    alert: (
      <Alert
        variant="danger"
        className="rounded-none border-x-0 border-t-0 px-5 py-2.5"
      >
        <AlertTitle className="text-sm">
          Complete these required fields to close the case:
        </AlertTitle>
        <ul className="list-disc ps-5 text-xs">
          <li>IIR case number (IMPACT / Cority) — This field is required</li>
          <li>Serious injury — This field is required</li>
          <li>Permanent impairment — This field is required</li>
          <li>Other recordable case — This field is required</li>
        </ul>
      </Alert>
    ),
  },
};
