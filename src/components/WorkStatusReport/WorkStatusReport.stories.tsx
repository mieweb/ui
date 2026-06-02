import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  WorkStatusReport,
  type WorkStatusCase,
  type WorkStatusCode,
} from './WorkStatusReport';

const meta: Meta<typeof WorkStatusReport> = {
  title: 'Components/Case Management/WorkStatusReport',
  component: WorkStatusReport,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const today = new Date().toISOString().split('T')[0];

const codes: WorkStatusCode[] = [
  { id: '1', code: 'FD', description: 'Full Duty', active: true },
  { id: '2', code: 'LWD', description: 'Lost Work Day', active: true },
  { id: '3', code: 'RWD', description: 'Restricted Work Day', active: true },
];

const cases: WorkStatusCase[] = [
  {
    caseNumber: '20240115-A1',
    employeeName: 'Alex Employee',
    employeeNumber: 'EMP-1001',
    caseType: 'Occupational injury / illness',
    status: 'Open',
    absences: [
      { id: 'a1', effectiveDate: today, status: 'LWD' },
      { id: 'a2', effectiveDate: today, status: 'LWD' },
    ],
  },
  {
    caseNumber: '20240120-B2',
    employeeName: 'Sam Worker',
    employeeNumber: 'EMP-1002',
    caseType: 'Non-occupational injury / illness',
    status: 'Closed',
    absences: [{ id: 'b1', effectiveDate: today, status: 'FD' }],
  },
];

export const Default: Story = {
  render: () => <WorkStatusReport cases={cases} absenceStatusCodes={codes} />,
};
