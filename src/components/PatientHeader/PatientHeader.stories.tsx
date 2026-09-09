import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  PatientHeader,
  type PatientData,
  type PatientOverflowAction,
} from './PatientHeader';
import { CountBadge, type CountBadgeItem } from '../CountBadge';
import { Button } from '../Button';

const meta: Meta<typeof PatientHeader> = {
  id: 'encounter-orders-patientheader',
  title: 'Healthcare/Encounter & orders/PatientHeader',
  component: PatientHeader,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

The **patient chart banner**: \`Avatar\` (hidden below \`md\`), "Last, First M." as \`<h2>\`, a status dot (\`active · inactive · deceased\`), MRN, age / sex, DOB and employer, with opt-in info rows — \`showAllergyBanner\` (red \`allergies\` pills), \`showMedicationBanner\` (\`medications\` pills with "+N more" after \`maxVisibleMeds\`), \`showCommentsBanner\` (\`comments\` joined as an **Alert** line), \`showProviderBanner\` (attending / family MD) — and an amber \`showFlagBanner\` ribbon for \`patient.flags\` (DUPLICATE, DECEASED…). The \`actions\` slot on the right is sized for \`CountBadge\`s (Tasks, Open Enc, Due List, Order Req, eSign — \`showCountBadges={false}\` hides just those). \`showOverflowMenu\` adds a patient **⋮ menu** (\`role="menu"\`, portalled) with Quick Actions (Edit Patient, Contact, Send Message, Schedule, Print, Export) and an **Add** grid (Task, Encounter, Due List Item, Order Request, eSign Request, Allergy, Medication, Alert, Condition, Vitals). Three of those open **built-in modals**: *Contact* shows \`email\` / \`phone\`, *Edit Patient* opens a demographics form → \`onEditPatient(formData)\`, every *Add …* opens a generic label / status / priority / assignee / due date / notes form → \`onAddItem(entityType, formData)\`; everything else reaches \`onOverflowAction(action)\`. \`sticky\`, \`showBackButton\` / \`onBack\` as on the other headers. Props are plain data (\`PatientData\`, \`AllergyItem\`, \`MedicationItem\`) — no FHIR or WebChart contract.

### Use it when

- The page **is the patient** — chart, encounter, results — and the clinician needs identity plus safety context (allergies, medications, alerts) visible at the top of every view.
- You want the WebChart-style patient toolbar: count badges that open their own popovers and a single overflow menu for patient-level actions.
- Your data already exists as display strings; the header formats nothing but the name and capitalises flags.

### Don't use it when

- The record is a **case** with the patient as context — [CaseManagementHeader](?path=/docs/encounter-orders-casemanagementheader--docs) (case number, status, days open, editing users).
- The page is a generic titled section — [PageHeader](?path=/docs/layout-pageheader--docs) (title, subtitle, breadcrumb, tabs); the app-wide bar is [AppHeader](?path=/docs/layout-appheader--docs).
- You need the **full** allergy or medication list with editing — [AllergyList](?path=/docs/clinical-lists-allergylist--docs) / [MedicationList](?path=/docs/clinical-lists-medicationlist--docs); the banners here are name pills only, with no severity, reaction or status.
- The built-in Add / Edit Patient forms do not match your data model — they are fixed generic fields; use \`onOverflowAction\` and open your own dialogs instead of \`onAddItem\` / \`onEditPatient\`.

### Example

\`\`\`tsx
<PatientHeader
  sticky
  patient={{ name: { first: p.firstName, last: p.lastName, middle: p.middleName }, mrn: p.mrn, dob: formatDate(p.dob), age: ageOf(p.dob), sex: p.sex, status: p.status, flags: p.flags, photo: p.photoUrl, email: p.email, phone: p.phone, employer: p.employer?.name, attendingProvider: p.attending?.name, familyProvider: p.pcp?.name }}
  allergies={allergies.map((a) => ({ name: a.allergen, severity: a.severity }))}
  medications={meds.filter((m) => m.status === 'taking').map((m) => ({ name: m.name, dose: m.strength }))}
  comments={p.alerts}
  showAllergyBanner showMedicationBanner showCommentsBanner showProviderBanner showFlagBanner
  showBackButton onBack={() => navigate(-1)}
  actions={
    <div className="flex flex-wrap gap-2">
      <CountBadge label="Tasks" count={tasks.length} items={tasks} onView={openTask} />
      <CountBadge label="Due List" count={due.length} items={due} />
    </div>
  }
  showOverflowMenu
  onOverflowAction={(action) => action === 'schedule-appointment' && openScheduler(p.id)}
  onAddItem={(type, form) => createItem(p.id, type, form)}     // built-in generic Add modal
  onEditPatient={(form) => savePatient(p.id, form)}             // built-in Edit Patient modal
/>
\`\`\`

The header keeps only modal open/close and form-draft state; patient data, counts and what an action does are the host's.

### Limitations

- **Accessibility as implemented.** Name is an \`<h2>\`; back button and the ⋮ trigger are \`aria-label\`led (\`aria-haspopup="menu"\`, \`aria-expanded\`); the portalled menu is \`role="menu"\` with \`role="menuitem"\` buttons, closes on Esc / outside click — but has **no arrow-key navigation or focus management** (Tab moves through items; focus is not moved into or returned from the menu). Modals come from \`Modal\` (focus trap, Esc). The status dot is \`aria-hidden\` with the status word beside it; allergy / med pills are \`Badge\` spans with no list semantics; the flag ribbon and Alert row are plain text. Nothing is announced.
- **Clinical safety.** Allergy pills show names only — \`severity\` is accepted but **not rendered**; medication pills truncate at \`maxVisibleMeds\` with a non-interactive "+N more"; nothing is validated, deduplicated or cross-checked.
- **Built-in forms are generic.** The Add modal's fields (label, status, priority, assigned to, due date, notes) and the Edit Patient fields are fixed and identical for every entity type; the Contact modal is read-only. Status / priority selects are native \`<select>\`s. There is no loading or error state after \`onAddItem\` / \`onEditPatient\` — the modal just closes.
- **Data contract.** Display strings in, no formatting of \`dob\` (rendered verbatim), age not derived, sex rendered as the raw \`M / F / U\` letter, name always "Last, First M. Suffix".
- **Responsive / RTL.** Avatar hidden below \`md\`; actions drop to their own row on mobile via flex \`order-*\`; the menu is \`w-[calc(100vw-2rem)]\` on mobile. Physical \`-ml-2\` / \`mr-*\` and the menu's \`bottom-end\` placement mean RTL does not mirror.
- **Theming / i18n.** Semantic tokens plus hard-coded red (allergies), amber (flag ribbon) and green / gray / red status dots. All labels — "Allergies", "Meds", "Alert", "Attending", "Family MD", "MRN", "DOB", menu items, modal titles and form labels — are English constants with **no \`labels\` prop** (unlike \`CaseManagementHeader\`).
- **Dependencies / entry.** \`Avatar\`, \`Badge\`, \`Button\`, \`Input\`, \`Modal\`, \`Icons\`, \`useAnchoredPosition\`, \`useClickOutside\`, \`useEscapeKey\`, \`react-dom\` portal; main \`@mieweb/ui\` entry, no peers. \`CountBadge\` is passed in by the host.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'encounter-orders-casemanagementheader',
          why: 'PatientHeader leads with the patient (demographics, allergies, medications, actions); CaseManagementHeader leads with the case (number, status, days open) and keeps the patient as context.',
        },
        {
          type: 'alternative to',
          target: 'layout-pageheader',
          why: 'PageHeader titles a generic page with breadcrumb and tabs; PatientHeader is the chart banner with demographics, safety rows and a patient action menu.',
        },
        {
          type: 'composes with',
          target: 'data-display-countbadge',
          why: 'The actions slot is styled for CountBadge chips (Tasks, Open Enc, Due List…) and showCountBadges toggles them via data-slot.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The Contact, Add-item and Edit Patient dialogs are built-in Modals.',
        },
      ],
    },
  },
  argTypes: {
    sticky: { control: 'boolean' },
    showBackButton: { control: 'boolean' },
    showAllergyBanner: { control: 'boolean' },
    showMedicationBanner: { control: 'boolean' },
    showCommentsBanner: { control: 'boolean' },
    showProviderBanner: { control: 'boolean' },
    showFlagBanner: { control: 'boolean' },
    showCountBadges: { control: 'boolean' },
    maxVisibleMeds: { control: { type: 'number', min: 1, max: 20 } },
    patient: { table: { disable: true } },
    allergies: { table: { disable: true } },
    medications: { table: { disable: true } },
    comments: { table: { disable: true } },
    actions: { table: { disable: true } },
    onBack: { action: 'back-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PatientHeader>;

// ─── Sample Data ───────────────────────────────────────────────────────────

const samplePatient: PatientData = {
  name: { first: 'William', last: 'Hart', middle: 'S' },
  mrn: 'MRN-00482916',
  dob: '11-30-1954',
  age: 71,
  sex: 'M',
  status: 'active',
  flags: ['DUPLICATE'],
  email: 'horner@mieweb.com',
  phone: '555-867-5309',
  employer: 'Better Corp.',
  attendingProvider: 'Selenium Selenium',
  familyProvider: 'John M. Sample, M.D.',
};

const sampleAllergies = [
  { name: 'Penicillins', severity: 'severe' as const },
  { name: 'Sulfa (Sulfonamide Antibiotics)', severity: 'severe' as const },
];

const sampleMedications = [
  { name: 'Aspirin Oral' },
  { name: 'Calcium' },
  { name: 'Coumadin' },
  { name: 'Ibuprofen Oral' },
  { name: 'Lasix Oral' },
  { name: 'Lisinopril' },
];

// ─── CountBadge Hover‑Menu Sample Data ─────────────────────────────────

const sampleTasks: CountBadgeItem[] = [
  { id: 'task-1', label: 'Complete intake questionnaire', status: 'pending' },
  { id: 'task-2', label: 'Review lab results', status: 'active' },
  { id: 'task-3', label: 'Follow-up referral', status: 'overdue' },
];

const sampleEncounters: CountBadgeItem[] = [
  { id: 'enc-1', label: 'Office visit 02/20', status: 'active' },
  { id: 'enc-2', label: 'Telehealth 02/18', status: 'active' },
  { id: 'enc-3', label: 'Lab draw 02/15', status: 'pending' },
  { id: 'enc-4', label: 'Physical exam 02/10', status: 'completed' },
  { id: 'enc-5', label: 'Urgent care 02/05', status: 'completed' },
];

const sampleDueList: CountBadgeItem[] = [
  { id: 'due-1', label: 'Hemoglobin A1c', status: 'overdue' },
  { id: 'due-2', label: 'Lipid panel', status: 'pending' },
  { id: 'due-3', label: 'Annual wellness visit', status: 'pending' },
  { id: 'due-4', label: 'Pneumonia vaccine', status: 'active' },
];

const sampleOrders: CountBadgeItem[] = [
  { id: 'ord-1', label: 'CBC w/ differential', status: 'pending' },
  { id: 'ord-2', label: 'Comprehensive metabolic panel', status: 'pending' },
  { id: 'ord-3', label: 'Chest X-ray', status: 'active' },
  { id: 'ord-4', label: 'PT/INR', status: 'overdue' },
];

const sampleEsigns: CountBadgeItem[] = [
  { id: 'esign-1', label: 'Office visit note 02/20', status: 'pending' },
  { id: 'esign-2', label: 'Referral letter — Cardiology', status: 'pending' },
  { id: 'esign-3', label: 'Lab order 02/18', status: 'active' },
  { id: 'esign-4', label: 'Prescription — Lisinopril', status: 'pending' },
  { id: 'esign-5', label: 'Consent — Telehealth', status: 'completed' },
  { id: 'esign-6', label: 'Discharge summary 02/05', status: 'overdue' },
  { id: 'esign-7', label: 'Immunization record update', status: 'active' },
];

// ─── Stories ───────────────────────────────────────────────────────────────

/** Full-featured header matching the reference design with alerts, details, and action buttons. */
export const Default: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    comments: ['Do not release info to siblings.'],
    showAllergyBanner: true,
    showMedicationBanner: true,
    showCommentsBanner: true,
    showProviderBanner: true,
    showFlagBanner: true,
    actions: (
      <div className="flex flex-wrap gap-2">
        <CountBadge
          label="Tasks"
          count={3}
          countVariant="informative"
          items={sampleTasks}
          deleteLabel="task"
          onView={(item) => console.log('View task', item)}
          onEdit={(item, formData) => console.log('Saved task', item, formData)}
          onDelete={(item) => console.log('Deleted task', item)}
        />
        <CountBadge
          label="Open Enc"
          count={5}
          countVariant="informative"
          items={sampleEncounters}
          deleteLabel="encounter"
          onView={(item) => console.log('View encounter', item)}
          onEdit={(item, formData) =>
            console.log('Saved encounter', item, formData)
          }
          onDelete={(item) => console.log('Deleted encounter', item)}
        />
        <CountBadge
          label="Due List"
          count={4}
          countVariant="informative"
          items={sampleDueList}
          deleteLabel="due list item"
          onView={(item) => console.log('View due item', item)}
          onEdit={(item, formData) =>
            console.log('Saved due item', item, formData)
          }
          onDelete={(item) => console.log('Deleted due item', item)}
        />
        <CountBadge
          label="Order Req"
          count={4}
          countVariant="informative"
          items={sampleOrders}
          deleteLabel="order"
          onView={(item) => console.log('View order', item)}
          onEdit={(item, formData) =>
            console.log('Saved order', item, formData)
          }
          onDelete={(item) => console.log('Deleted order', item)}
        />
        <CountBadge
          label="eSign"
          count={7}
          countVariant="informative"
          items={sampleEsigns}
          deleteLabel="e-sign request"
          onView={(item) => console.log('View esign', item)}
          onEdit={(item, formData) =>
            console.log('Saved esign', item, formData)
          }
          onDelete={(item) => console.log('Deleted esign', item)}
        />
      </div>
    ),
    showOverflowMenu: true,
    onOverflowAction: (action: PatientOverflowAction) =>
      console.log('Overflow action:', action),
    onAddItem: (
      entityType: PatientOverflowAction,
      formData: Record<string, string>
    ) => console.log('Add item:', entityType, formData),
    onEditPatient: (formData: Record<string, string>) =>
      console.log('Edit patient:', formData),
  },
};

/** Header with back button and alerts. */
export const WithBackButton: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    showAllergyBanner: true,
    showMedicationBanner: true,
    showBackButton: true,
    showProviderBanner: true,
  },
};

/** Just the header row — no alerts, no details section. */
export const HeaderOnly: Story = {
  args: {
    patient: {
      name: { first: 'William', last: 'Hart', middle: 'S' },
      mrn: 'MRN-00482916',
      dob: '11-30-1954',
      age: 71,
      sex: 'M',
      status: 'active',
    },
  },
};

/** Alerts visible, providers shown in info rows. */
export const WithProviders: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    showAllergyBanner: true,
    showMedicationBanner: true,
    showProviderBanner: true,
  },
};

/** Inactive patient status. */
export const InactivePatient: Story = {
  args: {
    patient: {
      ...samplePatient,
      status: 'inactive',
      flags: undefined,
    },
    showProviderBanner: true,
  },
};

/** Deceased patient status. */
export const DeceasedPatient: Story = {
  args: {
    patient: {
      ...samplePatient,
      status: 'deceased',
      flags: ['DECEASED'],
    },
    showProviderBanner: true,
  },
};

/** With custom action buttons in the actions slot. */
export const WithActions: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    showAllergyBanner: true,
    showMedicationBanner: true,
    showProviderBanner: true,
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="ghost" size="sm">
          Print
        </Button>
      </div>
    ),
  },
};

/** Count badges hidden via `showCountBadges={false}` — custom actions still render. */
export const HiddenCountBadges: Story = {
  args: {
    ...Default.args,
    showCountBadges: false,
  },
};

/** Zero-count badges (Tasks, eSign) are hidden by default, even when `showCountBadges` is true (opt back in per-badge with `showZero`). */
export const WithZeroCounts: Story = {
  args: {
    ...Default.args,
    actions: (
      <div className="flex flex-wrap gap-2">
        <CountBadge label="Tasks" count={0} countVariant="informative" />
        <CountBadge
          label="Open Enc"
          count={5}
          countVariant="informative"
          items={sampleEncounters}
        />
        <CountBadge
          label="Due List"
          count={4}
          countVariant="informative"
          items={sampleDueList}
        />
        <CountBadge label="eSign" count={0} countVariant="informative" />
      </div>
    ),
  },
};

/** Female patient with avatar photo. */
export const FemaleWithPhoto: Story = {
  args: {
    patient: {
      name: { first: 'Jane', last: 'Doe' },
      mrn: 'MRN-000042',
      dob: '06-15-1990',
      age: 35,
      sex: 'F',
      status: 'active',
      email: 'jdoe@example.com',
      phone: '555-123-4567',
      photo: 'https://i.pravatar.cc/150?u=jane',
    },
    allergies: [{ name: 'Latex' }],
    showAllergyBanner: true,
    showProviderBanner: true,
  },
};

/** Sticky header with scrollable content to demonstrate pinning behavior. */
export const Sticky: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    showAllergyBanner: true,
    showMedicationBanner: true,
    sticky: true,
    showProviderBanner: true,
  },
  decorators: [
    (Story) => (
      <div className="h-[200vh]">
        <Story />
        <div className="text-muted-foreground p-6">
          <p className="mb-4">
            Scroll down to see the sticky header in action.
          </p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      </div>
    ),
  ],
};

/** Minimal patient data — only required fields. */
export const MinimalData: Story = {
  args: {
    patient: {
      name: { first: 'Test', last: 'Patient' },
      mrn: 'MRN-999999',
      dob: '01-01-2000',
      age: 26,
      sex: 'U',
    },
  },
};
