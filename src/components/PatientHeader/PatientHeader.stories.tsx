import type { Meta, StoryObj } from '@storybook/react-vite';
import { PatientHeader, type PatientData } from './PatientHeader';
import { CountBadge } from '../CountBadge';
import { Button } from '../Button';

const meta: Meta<typeof PatientHeader> = {
  title: 'Data Display/PatientHeader',
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
    showDetails: { control: 'boolean' },
    detailsExpanded: { control: 'boolean' },
    maxVisibleMeds: { control: { type: 'number', min: 1, max: 20 } },
    patient: { table: { disable: true } },
    allergies: { table: { disable: true } },
    medications: { table: { disable: true } },
    comments: { table: { disable: true } },
    actions: { table: { disable: true } },
    onBack: { table: { disable: true } },
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
    showDetails: true,
    actions: (
      <div className="flex flex-wrap gap-2">
        <CountBadge label="Tasks" count={3} />
        <CountBadge label="Open Enc" count={5} />
        <CountBadge label="Due List" count={4} />
        <CountBadge label="Order Req" count={4} />
        <CountBadge label="eSign" count={7} />
      </div>
    ),
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
    onBack: () => console.log('Back clicked'),
    showDetails: true,
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

/** Alerts visible but demographics details collapsed. */
export const DetailsCollapsed: Story = {
  args: {
    patient: samplePatient,
    allergies: sampleAllergies,
    medications: sampleMedications,
    showAllergyBanner: true,
    showMedicationBanner: true,
    showDetails: true,
    detailsExpanded: false,
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
    showDetails: true,
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
    showDetails: true,
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
    showDetails: true,
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
    showDetails: true,
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
    showDetails: true,
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
