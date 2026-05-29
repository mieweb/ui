import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseActivityTab,
  type CaseActivityEntry,
  type CaseActivityADAEntry,
} from './CaseActivityTab';

const entries: CaseActivityEntry[] = [
  {
    id: '1',
    timestamp: '2025-09-01T09:00:00Z',
    action: 'created',
    field: 'case',
    userName: 'Arlene Rosario',
    description: 'Case created',
  },
  {
    id: '2',
    timestamp: '2025-09-06T10:00:00Z',
    action: 'updated',
    field: 'status',
    userName: 'Arlene Rosario',
    description: 'Status updated',
  },
];

describe('CaseActivityTab', () => {
  it('renders the total entry count', () => {
    renderWithTheme(<CaseActivityTab entries={entries} />);
    expect(screen.getByText('2 total entries')).toBeInTheDocument();
  });

  it('renders an empty state when there are no entries', () => {
    renderWithTheme(<CaseActivityTab entries={[]} />);
    expect(screen.getByText('No activity recorded yet')).toBeInTheDocument();
    expect(screen.getByText('0 total entries')).toBeInTheDocument();
  });

  it('sorts entries newest-first', () => {
    renderWithTheme(<CaseActivityTab entries={entries} />);
    const rows = screen.getAllByRole('row');
    // rows[0] is the header row; rows[1] should be the newest entry (updated).
    expect(within(rows[1]).getByText('Status updated')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Case created')).toBeInTheDocument();
  });

  it('shows the ADA status in effect at each entry timestamp', () => {
    const adaTracking: CaseActivityADAEntry[] = [
      { date: '2025-09-01', status: 'Pending' },
      { date: '2025-09-06', status: 'Approved' },
    ];
    renderWithTheme(
      <CaseActivityTab entries={entries} adaTracking={adaTracking} />
    );
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders a dash when no ADA status applies', () => {
    renderWithTheme(<CaseActivityTab entries={entries} />);
    expect(screen.getAllByText('-')).toHaveLength(2);
  });
});
