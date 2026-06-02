import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseDiagnosisTab,
  type CaseDiagnosis,
  type CaseDiagnosisDraft,
  type CaseIcdCode,
  type CaseIcd11Code,
} from './CaseDiagnosisTab';

const meta: Meta<typeof CaseDiagnosisTab> = {
  title: 'Components/Case Management/CaseDiagnosisTab',
  component: CaseDiagnosisTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ICD10: CaseIcdCode[] = [
  { code: 'M54.5', description: 'Low back pain' },
  {
    code: 'S83.511A',
    description: 'Sprain of ACL of right knee, initial encounter',
  },
  {
    code: 'G56.00',
    description: 'Carpal tunnel syndrome, unspecified upper limb',
  },
];

const ICD11: CaseIcd11Code[] = [
  {
    code: 'ME84.2',
    description: 'Low back pain',
    icd10Code: 'M54.5',
    icd10Description: 'Low back pain',
  },
];

const initial: CaseDiagnosis[] = [
  {
    id: '1',
    icd10Code: 'M54.5',
    icd10Description: 'Low back pain',
    diagnosisDate: '2025-08-01',
    isActive: true,
    priority: 1,
    notes: 'Reported after lifting incident',
  },
  {
    id: '2',
    icd10Code: 'G56.00',
    icd10Description: 'Carpal tunnel syndrome',
    diagnosisDate: '2025-08-10',
    isActive: false,
    priority: 2,
  },
];

function Example() {
  const [diagnoses, setDiagnoses] = useState(initial);

  const searchIcd10 = async (query: string) =>
    ICD10.filter(
      (c) =>
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    );

  const searchIcd11 = async (query: string) =>
    ICD11.filter(
      (c) =>
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    );

  const handleAdd = (draft: CaseDiagnosisDraft) => {
    setDiagnoses((prev) => [
      ...prev,
      { ...draft, id: `${Date.now()}`, priority: prev.length + 1 },
    ]);
  };

  return (
    <CaseDiagnosisTab
      diagnoses={diagnoses}
      searchIcd10={searchIcd10}
      searchIcd11={searchIcd11}
      onAddDiagnosis={handleAdd}
      onDiagnosesChange={setDiagnoses}
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
