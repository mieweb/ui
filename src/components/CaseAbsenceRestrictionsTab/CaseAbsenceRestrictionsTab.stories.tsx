import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseAbsenceRestrictionsTab,
  type AbsenceTrackingEntry,
  type AbsenceTrackingDraft,
  type WorkRestrictionEntry,
  type WorkRestrictionDraft,
} from './CaseAbsenceRestrictionsTab';

const meta: Meta<typeof CaseAbsenceRestrictionsTab> = {
  title: 'Components/Case Management/CaseAbsenceRestrictionsTab',
  component: CaseAbsenceRestrictionsTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { value: 'FD', label: 'Full Duty' },
  { value: 'LWD', label: 'Lost Work Days' },
  { value: 'RWD', label: 'Restricted Work Days' },
  { value: 'RWDREGULARJOB', label: 'Restricted Work - Regular Job' },
  { value: 'OTH', label: 'Other' },
];
const reasonOptions = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'PERSONAL', label: 'Personal' },
];
const restrictionOptions = [
  { value: 'no-lifting-25', label: 'No lifting over 25 lbs' },
  { value: 'no-standing', label: 'No prolonged standing' },
];

const initialAbsences: AbsenceTrackingEntry[] = [
  { id: 'a1', effectiveDate: '2025-08-01', status: 'LWD', createdSeq: 1, caseNumber: 'C-1' },
  { id: 'a2', effectiveDate: '2025-08-10', status: 'RWD', createdSeq: 2, caseNumber: 'C-1' },
];
const initialRestrictions: WorkRestrictionEntry[] = [
  {
    id: 'r1',
    restriction: 'no-lifting-25',
    startDate: '2025-08-05',
    isPermanent: false,
    isActive: true,
    caseNumber: 'C-1',
  },
];

function Example() {
  const [absences, setAbsences] = useState(initialAbsences);
  const [restrictions, setRestrictions] = useState(initialRestrictions);

  const addAbsence = (draft: AbsenceTrackingDraft) =>
    setAbsences((prev) => [
      ...prev,
      {
        ...draft,
        id: `${Date.now()}`,
        createdSeq: Math.max(0, ...prev.map((e) => e.createdSeq)) + 1,
        caseNumber: 'C-1',
      },
    ]);

  const updateAbsence = (id: string, draft: AbsenceTrackingDraft) =>
    setAbsences((prev) => prev.map((e) => (e.id === id ? { ...e, ...draft } : e)));

  const addRestriction = (draft: WorkRestrictionDraft) =>
    setRestrictions((prev) => [
      ...prev,
      { ...draft, id: `${Date.now()}`, caseNumber: 'C-1' },
    ]);

  const updateRestriction = (id: string, draft: WorkRestrictionDraft) =>
    setRestrictions((prev) => prev.map((r) => (r.id === id ? { ...r, ...draft } : r)));

  return (
    <CaseAbsenceRestrictionsTab
      absences={absences}
      restrictions={restrictions}
      statusOptions={statusOptions}
      reasonOptions={reasonOptions}
      restrictionOptions={restrictionOptions}
      currentCaseNumber="C-1"
      defaultCountThrough="2025-08-31"
      onAddAbsence={addAbsence}
      onUpdateAbsence={updateAbsence}
      onAddRestriction={addRestriction}
      onUpdateRestriction={updateRestriction}
      onDeleteRestriction={(id) =>
        setRestrictions((prev) => prev.filter((r) => r.id !== id))
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
