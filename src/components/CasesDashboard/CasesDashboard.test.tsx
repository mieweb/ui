import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CasesDashboard, type DashboardCase } from './CasesDashboard';

const cases: DashboardCase[] = [
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
  },
  {
    caseNumber: '20240120-B2',
    employeeName: 'Sam Worker',
    employeeNumber: 'E-1002',
    status: 'Closed',
    caseType: 'Non-occupational injury / illness',
    caseManager: 'Unassigned',
    employeeLocation: 'Warehouse, TX',
    created: '2024-01-20',
  },
];

describe('CasesDashboard', () => {
  it('renders all cases', () => {
    renderWithTheme(<CasesDashboard cases={cases} onViewCase={vi.fn()} />);
    expect(screen.getByText('20240115-A1')).toBeInTheDocument();
    expect(screen.getByText('20240120-B2')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    renderWithTheme(<CasesDashboard cases={cases} onViewCase={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Search Cases'), {
      target: { value: 'Sam' },
    });
    expect(screen.queryByText('20240115-A1')).not.toBeInTheDocument();
    expect(screen.getByText('20240120-B2')).toBeInTheDocument();
  });

  it('calls onViewCase when a row is clicked', () => {
    const onViewCase = vi.fn();
    renderWithTheme(<CasesDashboard cases={cases} onViewCase={onViewCase} />);
    fireEvent.click(screen.getByText('Alex Employee'));
    expect(onViewCase).toHaveBeenCalledWith('20240115-A1');
  });

  it('shows summary stat counts', () => {
    renderWithTheme(<CasesDashboard cases={cases} onViewCase={vi.fn()} />);
    expect(screen.getByText('Total Cases')).toBeInTheDocument();
    expect(screen.getByText('Open Cases')).toBeInTheDocument();
    expect(screen.getByText('Unassigned Cases')).toBeInTheDocument();
  });

  it('reveals advanced filters', () => {
    renderWithTheme(<CasesDashboard cases={cases} onViewCase={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /More Filters/ }));
    expect(
      screen.getByRole('button', { name: 'Show Less' })
    ).toBeInTheDocument();
  });
});
