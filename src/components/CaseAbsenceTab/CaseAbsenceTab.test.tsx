import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseAbsenceTab, type CaseAbsenceEntry } from './CaseAbsenceTab';

const entries: CaseAbsenceEntry[] = [
  { id: '1', effectiveDate: '2025-09-01', status: 'LWD', createdSeq: 1 },
  { id: '2', effectiveDate: '2025-09-11', status: 'FD', createdSeq: 2 },
];

function setup(overrides = {}) {
  const onAddEntry = vi.fn();
  const onUpdateEntry = vi.fn();
  renderWithTheme(
    <CaseAbsenceTab
      entries={entries}
      reasonOptions={[{ value: 'illness', label: 'Illness' }]}
      onAddEntry={onAddEntry}
      onUpdateEntry={onUpdateEntry}
      {...overrides}
    />
  );
  return { onAddEntry, onUpdateEntry };
}

describe('CaseAbsenceTab', () => {
  it('renders entries with computed day counts', () => {
    setup();
    // 10 LWD days between 09/01 and 09/11.
    expect(screen.getByText('Full Duty')).toBeInTheDocument();
    expect(screen.getByText('Lost Work Days')).toBeInTheDocument();
    // Totals row label present.
    expect(screen.getByText('Totals')).toBeInTheDocument();
  });

  it('disables Add Entry until required fields are provided', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Add Entry' })).toBeDisabled();
  });

  it('enters edit mode for a row', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit entry' })[0]);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('computes 10 LWD days for the first segment', () => {
    setup();
    const cells = screen.getAllByRole('cell');
    // The LWD total should be 10.
    expect(cells.some((c) => c.textContent === '10')).toBe(true);
  });
});
