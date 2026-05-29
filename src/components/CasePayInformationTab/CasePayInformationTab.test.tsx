import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CasePayInformationTab,
  calculateFicaDate,
  formatRate,
  type CaseJobAssignment,
  type CaseCompensationRate,
} from './CasePayInformationTab';

const locationOptions = [{ value: 'Dallas HQ', label: 'Dallas HQ' }];

const jobs: CaseJobAssignment[] = [
  {
    id: 'job-1',
    effectiveDate: '01/15/2024',
    jobTitle: 'Machine Operator',
    locationName: 'Dallas HQ',
    managerName: 'Jane Doe',
  },
];

const pay: CaseCompensationRate[] = [
  { id: 'pay-1', effectiveDate: '01/15/2024', rateAmount: 25, unit: 'hourly' },
];

function setup(overrides = {}) {
  const handlers = {
    onAddJob: vi.fn(),
    onUpdateJob: vi.fn(),
    onDeleteJob: vi.fn(),
    onAddPay: vi.fn(),
    onUpdatePay: vi.fn(),
    onDeletePay: vi.fn(),
  };
  renderWithTheme(
    <CasePayInformationTab
      jobHistory={jobs}
      compensationHistory={pay}
      currentJob={jobs[0]}
      currentPay={pay[0]}
      locationOptions={locationOptions}
      dateOfDisability="03/01/2025"
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
}

describe('calculateFicaDate', () => {
  it('returns first day of the month after +6 months', () => {
    // 03/01/2025 + 6 months = 09/01/2025, first day of next month = 10/01/2025.
    expect(calculateFicaDate('03/01/2025')).toBe('10/01/2025');
  });

  it('returns em dash for missing/invalid input', () => {
    expect(calculateFicaDate()).toBe('—');
    expect(calculateFicaDate('not-a-date')).toBe('—');
  });
});

describe('formatRate', () => {
  it('appends the unit suffix', () => {
    expect(formatRate(25, 'hourly')).toBe('$25.00/hr');
    expect(formatRate(2000, 'monthly')).toBe('$2,000.00/mo');
  });
});

describe('CasePayInformationTab', () => {
  it('renders current position and compensation', () => {
    setup();
    expect(screen.getAllByText('Machine Operator').length).toBeGreaterThan(0);
    expect(screen.getByText('$25.00/hr')).toBeInTheDocument();
    expect(screen.getByText('10/01/2025')).toBeInTheDocument();
  });

  it('opens the add job dialog', () => {
    setup();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add Entry' })[0]
    );
    expect(screen.getByText('Add Job Assignment')).toBeInTheDocument();
  });

  it('deletes a pay rate', () => {
    const { onDeletePay } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Delete pay rate' }));
    expect(onDeletePay).toHaveBeenCalledWith('pay-1');
  });

  it('looks up STD coverage', () => {
    const lookupStdCoverage = vi.fn().mockReturnValue({
      plan: {
        planCode: 'STD-100',
        planName: 'Standard STD',
        benefitPercentage: 60,
        waitingPeriod: 7,
        maxDuration: 26,
      },
      rule: { effectiveDate: '01/01/2024' },
    });
    setup({ lookupStdCoverage });
    expect(lookupStdCoverage).toHaveBeenCalledWith('Dallas HQ', '03/01/2025');
    expect(screen.getByText('Standard STD')).toBeInTheDocument();
  });
});
