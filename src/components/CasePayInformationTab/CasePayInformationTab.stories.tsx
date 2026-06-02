import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CasePayInformationTab,
  type CaseJobAssignment,
  type CaseCompensationRate,
  type CaseSTDCoverage,
} from './CasePayInformationTab';

const meta: Meta<typeof CasePayInformationTab> = {
  title: 'Components/Case Management/CasePayInformationTab',
  component: CasePayInformationTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const locationOptions = [
  { value: 'Dallas HQ', label: 'Dallas HQ' },
  { value: 'Austin Branch', label: 'Austin Branch' },
];

const initialJobs: CaseJobAssignment[] = [
  {
    id: 'job-1',
    effectiveDate: '01/15/2024',
    jobTitle: 'Machine Operator',
    locationName: 'Dallas HQ',
    managerName: 'Jane Doe',
  },
];

const initialPay: CaseCompensationRate[] = [
  {
    id: 'pay-1',
    effectiveDate: '01/15/2024',
    rateAmount: 25,
    unit: 'hourly',
    payCode: 'HRL-NONEX',
  },
];

const coverage: CaseSTDCoverage = {
  plan: {
    planCode: 'STD-100',
    planName: 'Standard STD',
    benefitPercentage: 60,
    waitingPeriod: 7,
    maxDuration: 26,
  },
  rule: { effectiveDate: '01/01/2024' },
};

function Example() {
  const [jobs, setJobs] = useState(initialJobs);
  const [pay, setPay] = useState(initialPay);

  return (
    <CasePayInformationTab
      jobHistory={jobs}
      compensationHistory={pay}
      currentJob={jobs[0]}
      currentPay={pay[0]}
      locationOptions={locationOptions}
      dateOfDisability="03/01/2025"
      lookupStdCoverage={() => coverage}
      onAddJob={(draft) =>
        setJobs((prev) => [...prev, { id: Date.now().toString(), ...draft }])
      }
      onUpdateJob={(id, draft) =>
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? { ...j, ...draft } : j))
        )
      }
      onDeleteJob={(id) => setJobs((prev) => prev.filter((j) => j.id !== id))}
      onAddPay={(draft) =>
        setPay((prev) => [...prev, { id: Date.now().toString(), ...draft }])
      }
      onUpdatePay={(id, draft) =>
        setPay((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...draft } : p))
        )
      }
      onDeletePay={(id) => setPay((prev) => prev.filter((p) => p.id !== id))}
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
