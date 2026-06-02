import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseRestrictionsTab,
  type CaseRestriction,
} from './CaseRestrictionsTab';

const meta: Meta<typeof CaseRestrictionsTab> = {
  title: 'Components/Case Management/CaseRestrictionsTab',
  component: CaseRestrictionsTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const restrictionOptions = [
  { value: 'NO_LIFT', label: 'No Lifting Over 10 lbs' },
  { value: 'NO_STAND', label: 'No Prolonged Standing' },
  { value: 'LIGHT_DUTY', label: 'Light Duty Only' },
];

const initial: CaseRestriction[] = [
  {
    id: 'r1',
    restriction: 'NO_LIFT',
    startDate: '2025-09-01',
    endDate: '2025-10-01',
    isPermanent: false,
    isActive: true,
    notes: 'Per treating physician',
    caseNumber: '20250901-WC1',
  },
  {
    id: 'r2',
    restriction: 'LIGHT_DUTY',
    startDate: '2025-08-01',
    isPermanent: true,
    isActive: false,
    caseNumber: '20250801-WC2',
  },
];

function Example() {
  const [restrictions, setRestrictions] = useState(initial);

  return (
    <CaseRestrictionsTab
      employeeName="Michael Rodriguez"
      currentCaseNumber="20250901-WC1"
      restrictions={restrictions}
      restrictionOptions={restrictionOptions}
      onAddRestriction={(draft) =>
        setRestrictions((prev) => [
          ...prev,
          { id: Date.now().toString(), caseNumber: '20250901-WC1', ...draft },
        ])
      }
      onUpdateRestriction={(id, draft) =>
        setRestrictions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...draft } : r))
        )
      }
      onDeleteRestriction={(id) =>
        setRestrictions((prev) => prev.filter((r) => r.id !== id))
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
