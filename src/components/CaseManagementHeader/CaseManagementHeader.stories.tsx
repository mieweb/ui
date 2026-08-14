import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseManagementHeader,
  CaseContextBar,
  type CaseInfo,
  type CasePatient,
  type CaseDetailItem,
} from './CaseManagementHeader';
import { Button } from '../Button';
import { CollabStatus } from '../CollabStatus';
import { Alert, AlertTitle } from '../Alert';
import { PlusIcon, FilePlusIcon, CheckCircleIcon } from '../Icons';

const meta: Meta<typeof CaseManagementHeader> = {
  title: 'Components/Text & Data Display/CaseManagementHeader',
  component: CaseManagementHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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
};

const richDetails: CaseDetailItem[] = [
  { label: 'Case Manager', value: 'Casey Manager' },
  { label: 'Opened', value: '11/02/2025' },
  { label: 'Follow-up', value: '11/16/2025' },
  { label: 'Disability Date', value: '11/04/2025' },
];

/**
 * Desktop buttons are unchanged; below `md` (768px) they swap for icon-only
 * equivalents (a +doc icon, and a check — not an X, which implies delete).
 */
const addCaseNoteAction = (
  <>
    <Button
      variant="ghost"
      size="icon"
      aria-label="Add Case Note"
      className="h-8 w-8 md:hidden"
    >
      <FilePlusIcon size={16} />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<PlusIcon size={16} />}
      className="hidden md:inline-flex"
    >
      Add Case Note
    </Button>
  </>
);

const closeCaseAction = (
  <>
    <Button
      variant="ghost"
      size="icon"
      aria-label="Close Case"
      className="h-8 w-8 md:hidden"
    >
      <CheckCircleIcon size={16} />
    </Button>
    <Button variant="ghost" size="sm" className="hidden md:inline-flex">
      Close Case
    </Button>
  </>
);

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
    actions: addCaseNoteAction,
    editingUsers,
    collabStatus: liveStatus,
  },
};

/** Expanded details grid with multiple actions (POC layout). */
export const Expanded: Story = {
  args: {
    caseInfo: richCase,
    patient: richPatient,
    details: richDetails,
    showBackButton: true,
    defaultExpanded: true,
    actions: (
      <>
        {addCaseNoteAction}
        {closeCaseAction}
      </>
    ),
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
    actions: addCaseNoteAction,
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
    actions: addCaseNoteAction,
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
    actions: (
      <>
        {addCaseNoteAction}
        {closeCaseAction}
      </>
    ),
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
