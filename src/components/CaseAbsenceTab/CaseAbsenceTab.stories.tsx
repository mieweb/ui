import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CaseAbsenceTab, type CaseAbsenceEntry } from './CaseAbsenceTab';

const meta: Meta<typeof CaseAbsenceTab> = {
  title: 'Components/Case Management/CaseAbsenceTab',
  component: CaseAbsenceTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const initial: CaseAbsenceEntry[] = [
  { id: '1', effectiveDate: '2025-09-01', status: 'LWD', createdSeq: 1 },
  { id: '2', effectiveDate: '2025-09-10', status: 'RWD', createdSeq: 2 },
  { id: '3', effectiveDate: '2025-09-20', status: 'FD', createdSeq: 3 },
];

function Example() {
  const [entries, setEntries] = useState(initial);
  let seq = entries.length;

  return (
    <CaseAbsenceTab
      entries={entries}
      reasonOptions={[
        { value: 'illness', label: 'Illness' },
        { value: 'injury', label: 'Injury' },
        { value: 'surgery', label: 'Surgery' },
      ]}
      onAddEntry={(draft) =>
        setEntries((prev) => [
          ...prev,
          { id: Date.now().toString(), createdSeq: ++seq, ...draft },
        ])
      }
      onUpdateEntry={(id, draft) =>
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
        )
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
