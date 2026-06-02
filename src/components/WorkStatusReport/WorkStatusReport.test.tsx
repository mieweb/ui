import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  WorkStatusReport,
  type WorkStatusCase,
  type WorkStatusCode,
} from './WorkStatusReport';

const today = new Date().toISOString().split('T')[0];

const codes: WorkStatusCode[] = [
  { id: '1', code: 'FD', description: 'Full Duty', active: true },
  { id: '2', code: 'LWD', description: 'Lost Work Day', active: true },
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

describe('WorkStatusReport', () => {
  it('renders entries across cases', () => {
    renderWithTheme(
      <WorkStatusReport cases={cases} absenceStatusCodes={codes} />
    );
    expect(screen.getAllByText('Alex Employee').length).toBeGreaterThan(0);
    expect(screen.getByText('Sam Worker')).toBeInTheDocument();
  });

  it('shows audit issues for duplicate same-date entries', () => {
    renderWithTheme(
      <WorkStatusReport cases={cases} absenceStatusCodes={codes} />
    );
    expect(screen.getByText(/Audit Issues/)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate LWD entries/)).toBeInTheDocument();
  });

  it('summarizes counts', () => {
    renderWithTheme(
      <WorkStatusReport cases={cases} absenceStatusCodes={codes} />
    );
    expect(screen.getByText('Lost Work Days')).toBeInTheDocument();
    expect(screen.getByText('Full Duty')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
  });

  it('filters to issues only', () => {
    renderWithTheme(
      <WorkStatusReport cases={cases} absenceStatusCodes={codes} />
    );
    fireEvent.click(screen.getByLabelText('Show issues only'));
    expect(screen.getAllByText('Alex Employee').length).toBeGreaterThan(0);
    expect(screen.queryByText('Sam Worker')).not.toBeInTheDocument();
  });

  it('renders an empty state when no entries match', () => {
    renderWithTheme(<WorkStatusReport cases={[]} absenceStatusCodes={codes} />);
    expect(
      screen.getByText(
        'No entries found for the selected date range and filters.'
      )
    ).toBeInTheDocument();
  });
});
