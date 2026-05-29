import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseManager,
  type CaseManagerTab,
  type QuickNoteDraft,
} from './CaseManager';

const meta: Meta<typeof CaseManager> = {
  title: 'Components/Case Management/CaseManager',
  component: CaseManager,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const tabs: CaseManagerTab[] = [
  { value: 'case', label: 'Case', content: <p>Case details content</p> },
  { value: 'contact', label: 'Contacts', content: <p>Contacts content</p> },
  { value: 'todos', label: 'To Do', content: <p>Todos content</p> },
  { value: 'activity', label: 'Activity', content: <p>Activity content</p> },
];

function Example() {
  const [notes, setNotes] = useState<QuickNoteDraft[]>([]);
  return (
    <>
      {notes.length > 0 && (
        <div className="bg-primary-50 p-2 text-sm">
          {notes.length} note(s) added
        </div>
      )}
      <CaseManager
        summary={{
          employeeName: 'Alex Employee',
          caseNumber: '20240115-A1',
          status: 'Open',
          caseTypeLabel: 'Occupational injury / illness',
          caseManager: 'Jane Smith',
          dateOfDisability: '2024-01-10',
          employeeNumber: 'E-1001',
          employeeLocation: 'Main Plant, OH',
          dateOfBirth: '1985-06-15',
          age: 39,
        }}
        tabs={tabs}
        currentAbsence={{
          statusLabel: 'Lost Work Days',
          effectiveDate: '2024-01-10',
          reason: 'Surgery recovery',
          tone: 'danger',
        }}
        activeRestrictions={[
          { id: 'r1', label: 'No lifting over 10 lbs', isPermanent: false },
          { id: 'r2', label: 'No climbing', isPermanent: true },
        ]}
        onSaveNote={(note) => setNotes((prev) => [...prev, note])}
      />
    </>
  );
}

export const Default: Story = { render: () => <Example /> };
