import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseDetailsTab,
  type CaseDetailsValue,
  type CaseSelectOption,
} from './CaseDetailsTab';

const meta: Meta<typeof CaseDetailsTab> = {
  title: 'Components/Case Management/CaseDetailsTab',
  component: CaseDetailsTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = ['Open', 'In Progress', 'On Hold', 'Closed'].map((x) => ({
  value: x,
  label: x,
}));
const caseTypeOptions = [
  { value: 'STD', label: 'Short Term Disability' },
  { value: 'WC', label: 'Workers Compensation' },
  { value: 'FMLA', label: 'FMLA' },
];
const caseManagerOptions = [
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'John Doe', label: 'John Doe' },
];
const closureReasonOptions = [
  { value: 'RTW', label: 'Returned to Work' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'TRANSFER', label: 'Transferred' },
];
const adjusterOptions: CaseSelectOption[] = [
  {
    value: 'a1',
    label: 'Sarah Johnson',
    phone: '(555) 111-2222',
    email: 'sjohnson@example.com',
  },
  {
    value: 'a2',
    label: 'Mike Davis',
    phone: '(555) 333-4444',
    email: 'mdavis@example.com',
  },
];

function Example() {
  const [value, setValue] = useState<CaseDetailsValue>({
    status: 'Open',
    caseType: 'STD',
    caseManager: 'Jane Smith',
  });
  const ddgReturnDate =
    value.dateOfDisability && value.ddgDays
      ? new Date(
          new Date(value.dateOfDisability).getTime() +
            Number(value.ddgDays) * 86400000
        )
          .toISOString()
          .split('T')[0]
      : '';

  return (
    <CaseDetailsTab
      value={value}
      onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
      statusOptions={statusOptions}
      caseTypeOptions={caseTypeOptions}
      caseManagerOptions={caseManagerOptions}
      closureReasonOptions={closureReasonOptions}
      adjusterOptions={adjusterOptions}
      ddgReturnDate={ddgReturnDate}
      openTodos={[
        { id: 't1', activity: 'Verify RTW date', dateScheduled: '2024-02-01' },
      ]}
      openRestrictions={[
        { id: 'r1', restriction: 'No lifting over 10 lbs', startDate: '2024-01-10' },
      ]}
      openAbsences={[
        { id: 'ab1', statusType: 'LWD', effectiveDate: '2024-01-05' },
      ]}
      onGenerateTodos={(d) => console.log('generate todos for', d)}
      onCloseCase={(payload) => console.log('close case', payload)}
    />
  );
}

export const Default: Story = { render: () => <Example /> };
