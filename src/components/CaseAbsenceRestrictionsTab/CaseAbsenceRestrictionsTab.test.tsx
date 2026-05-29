import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseAbsenceRestrictionsTab,
  type AbsenceTrackingEntry,
  type WorkRestrictionEntry,
} from './CaseAbsenceRestrictionsTab';

const statusOptions = [
  { value: 'FD', label: 'Full Duty' },
  { value: 'LWD', label: 'Lost Work Days' },
  { value: 'RWD', label: 'Restricted Work Days' },
  { value: 'OTH', label: 'Other' },
];
const reasonOptions = [{ value: 'VACATION', label: 'Vacation' }];
const restrictionOptions = [{ value: 'no-lifting-25', label: 'No lifting over 25 lbs' }];

const absences: AbsenceTrackingEntry[] = [
  { id: 'a1', effectiveDate: '2025-08-01', status: 'LWD', createdSeq: 1, caseNumber: 'C-1' },
  { id: 'a2', effectiveDate: '2025-08-10', status: 'RWD', createdSeq: 2, caseNumber: 'C-1' },
];
const restrictions: WorkRestrictionEntry[] = [
  {
    id: 'r1',
    restriction: 'no-lifting-25',
    startDate: '2025-08-05',
    isPermanent: false,
    isActive: true,
    caseNumber: 'C-1',
  },
];

function setup(overrides = {}) {
  const onAddAbsence = vi.fn();
  const onUpdateAbsence = vi.fn();
  const onAddRestriction = vi.fn();
  const onUpdateRestriction = vi.fn();
  const onDeleteRestriction = vi.fn();
  renderWithTheme(
    <CaseAbsenceRestrictionsTab
      absences={absences}
      restrictions={restrictions}
      statusOptions={statusOptions}
      reasonOptions={reasonOptions}
      restrictionOptions={restrictionOptions}
      currentCaseNumber="C-1"
      defaultCountThrough="2025-08-31"
      onAddAbsence={onAddAbsence}
      onUpdateAbsence={onUpdateAbsence}
      onAddRestriction={onAddRestriction}
      onUpdateRestriction={onUpdateRestriction}
      onDeleteRestriction={onDeleteRestriction}
      {...overrides}
    />
  );
  return {
    onAddAbsence,
    onUpdateAbsence,
    onAddRestriction,
    onUpdateRestriction,
    onDeleteRestriction,
  };
}

describe('CaseAbsenceRestrictionsTab', () => {
  it('renders both sections with their counts', () => {
    setup();
    expect(screen.getByText('Absence Tracking')).toBeInTheDocument();
    expect(screen.getByText('Work Restrictions')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 entries')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 restrictions')).toBeInTheDocument();
  });

  it('computes day totals between effective dates', () => {
    setup();
    // 9 LWD days (Aug 1 -> Aug 10) and 21 RWD days (Aug 10 -> Aug 31); each value
    // appears in its row cell and again in the totals row.
    expect(screen.getByText('Totals')).toBeInTheDocument();
    expect(screen.getAllByText('9').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('21').length).toBeGreaterThanOrEqual(2);
  });

  it('quick-adds an absence entry', () => {
    const { onAddAbsence } = setup();
    fireEvent.change(screen.getByLabelText('Effective date:'), {
      target: { value: '2025-08-20' },
    });
    fireEvent.click(screen.getByRole('combobox', { name: 'Absence status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Full Duty' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Entry' }));
    expect(onAddAbsence).toHaveBeenCalledWith(
      expect.objectContaining({ effectiveDate: '2025-08-20', status: 'FD' })
    );
  });

  it('quick-adds a restriction', () => {
    const { onAddRestriction } = setup();
    fireEvent.click(screen.getByRole('combobox', { name: 'Restriction type' }));
    fireEvent.click(screen.getByRole('option', { name: 'No lifting over 25 lbs' }));
    fireEvent.change(screen.getByLabelText('Start date:'), {
      target: { value: '2025-08-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Restriction' }));
    expect(onAddRestriction).toHaveBeenCalledWith(
      expect.objectContaining({ restriction: 'no-lifting-25', startDate: '2025-08-15' })
    );
  });

  it('deletes a restriction after confirmation', () => {
    const { onDeleteRestriction } = setup();
    fireEvent.click(
      screen.getByLabelText('Delete restriction: No lifting over 25 lbs')
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteRestriction).toHaveBeenCalledWith('r1');
  });
});
