import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CasesDashboard, type DashboardCase } from './CasesDashboard';

const meta: Meta<typeof CasesDashboard> = {
  title: 'Components/Case Management/CasesDashboard',
  component: CasesDashboard,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCases: DashboardCase[] = [
  {
    caseNumber: '20240115-A1',
    employeeName: 'Alex Employee',
    employeeNumber: 'E-1001',
    status: 'Open',
    caseType: 'Occupational injury / illness',
    caseManager: 'Jane Smith',
    employeeLocation: 'Main Plant, OH',
    dateOfDisability: '2024-01-10',
    created: '2024-01-15',
    todos: [
      {
        completed: false,
        dateScheduled: '2024-02-01',
        activity: 'Follow-up call',
      },
    ],
  },
  {
    caseNumber: '20240120-B2',
    employeeName: 'Sam Worker',
    employeeNumber: 'E-1002',
    status: 'Closed',
    caseType: 'Non-occupational injury / illness',
    caseManager: 'Unassigned',
    employeeLocation: 'Warehouse, TX',
    dateOfDisability: '2024-01-18',
    created: '2024-01-20',
  },
];

function Example() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div>
      {opened && (
        <p className="text-muted-foreground p-4 text-sm">
          Opened case: {opened}
        </p>
      )}
      <CasesDashboard cases={sampleCases} onViewCase={setOpened} />
    </div>
  );
}

export const Default: Story = { render: () => <Example /> };
