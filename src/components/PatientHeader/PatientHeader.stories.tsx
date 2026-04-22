import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  PatientHeader,
  type PatientData,
  type PatientOverflowAction,
} from './PatientHeader';
import { CountBadge, type CountBadgeItem } from '../CountBadge';
import { Button } from '../Button';

const meta: Meta<typeof PatientHeader> = {
  title: 'Components/Text & Data Display/PatientHeader',
  component: PatientHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    sticky: { control: 'boolean' },
    showBackButton: { control: 'boolean' },
    showAllergyBanner: { control: 'boolean' },
    showMedicationBanner: { control: 'boolean' },
    showCommentsBanner: { control: 'boolean' },
    showProviderBanner: { control: 'boolean' },
    showFlagBanner: { control: 'boolean' },
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
