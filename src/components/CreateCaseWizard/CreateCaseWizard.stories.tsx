import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CreateCaseWizard,
  type NewCaseData,
  type OpenCaseSummary,
} from './CreateCaseWizard';
import { Input } from '../Input';

const meta: Meta<typeof CreateCaseWizard> = {
  title: 'Components/Case Management/CreateCaseWizard',
  component: CreateCaseWizard,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const caseTypeOptions = [
  { value: 'Occupational injury / illness', label: 'Occupational injury / illness' },
  {
    value: 'Non-occupational injury / illness',
    label: 'Non-occupational injury / illness',
  },
];
const caseManagerOptions = [
  { value: 'Unassigned', label: 'Unassigned' },
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'John Doe', label: 'John Doe' },
];

const openCases: OpenCaseSummary[] = [
  {
    caseNumber: '20240101-A1',
    caseType: 'Non-occupational injury / illness',
    status: 'Open',
    dateOpened: '2024-01-01',
  },
];

function Example() {
  const [created, setCreated] = useState<NewCaseData | null>(null);
  if (created) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Case created</h2>
        <pre className="mt-4 rounded bg-muted p-4 text-xs">
          {JSON.stringify(created, null, 2)}
        </pre>
      </div>
    );
  }
  return (
    <CreateCaseWizard
      onComplete={() => {}}
      onCreateCase={setCreated}
      caseTypeOptions={caseTypeOptions}
      caseManagerOptions={caseManagerOptions}
      defaultCaseType="Non-occupational injury / illness"
      renderEmployeeSearch={(onSelect) => (
        <Input
          placeholder="Search by name, ID, DOB, or last 4 of SSN..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSelect({
                name: 'Alex Employee',
                number: 'E-1001',
                location: 'Main Plant',
              });
            }
          }}
        />
      )}
      findOpenCases={(num) => (num === 'E-1001' ? openCases : [])}
      onOpenExistingCase={(c) => console.log('open', c)}
    />
  );
}

export const Default: Story = { render: () => <Example /> };
