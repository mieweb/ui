import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseRestrictionsTab,
  type CaseRestriction,
} from './CaseRestrictionsTab';

const restrictionOptions = [
  { value: 'NO_LIFT', label: 'No Lifting Over 10 lbs' },
  { value: 'LIGHT_DUTY', label: 'Light Duty Only' },
];

const restrictions: CaseRestriction[] = [
  {
    id: 'r1',
    restriction: 'NO_LIFT',
    startDate: '2025-09-01',
    isPermanent: false,
    isActive: true,
    caseNumber: 'WC1',
  },
  {
    id: 'r2',
    restriction: 'LIGHT_DUTY',
    startDate: '2025-08-01',
    isPermanent: true,
    isActive: false,
    caseNumber: 'WC2',
  },
];

function setup(overrides = {}) {
  const onAddRestriction = vi.fn();
  const onUpdateRestriction = vi.fn();
  const onDeleteRestriction = vi.fn();
  renderWithTheme(
    <CaseRestrictionsTab
      employeeName="Michael Rodriguez"
      currentCaseNumber="WC1"
      restrictions={restrictions}
      restrictionOptions={restrictionOptions}
      onAddRestriction={onAddRestriction}
      onUpdateRestriction={onUpdateRestriction}
      onDeleteRestriction={onDeleteRestriction}
      {...overrides}
    />
  );
  return { onAddRestriction, onUpdateRestriction, onDeleteRestriction };
}

describe('CaseRestrictionsTab', () => {
  it('renders the heading and resolved restriction names', () => {
    setup();
    expect(
      screen.getByText('Work Restrictions for Michael Rodriguez')
    ).toBeInTheDocument();
    // Default status filter is "active", so only the active restriction shows.
    expect(screen.getByText('No Lifting Over 10 lbs')).toBeInTheDocument();
    expect(screen.queryByText('Light Duty Only')).not.toBeInTheDocument();
  });

  it('shows the count summary', () => {
    setup();
    expect(screen.getByText('Showing 1 of 2 restrictions')).toBeInTheDocument();
  });

  it('toggles quick entry mode', () => {
    setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Quick Entry Mode' })
    );
    expect(
      screen.getByRole('button', { name: 'Exit Quick Entry' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Quick entry notes')).toBeInTheDocument();
  });

  it('confirms deletion', () => {
    const { onDeleteRestriction } = setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete restriction' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteRestriction).toHaveBeenCalledWith('r1');
  });

  it('opens the add dialog', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add Restriction' }));
    expect(screen.getByText('Restriction Type')).toBeInTheDocument();
    expect(screen.getByText('Permanent Restriction')).toBeInTheDocument();
  });
});
