import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseDiagnosisTab,
  type CaseDiagnosis,
  type CaseIcdCode,
} from './CaseDiagnosisTab';

const diagnoses: CaseDiagnosis[] = [
  {
    id: '1',
    icd10Code: 'M54.5',
    icd10Description: 'Low back pain',
    diagnosisDate: '2025-08-01',
    isActive: true,
    priority: 1,
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

const ICD10: CaseIcdCode[] = [{ code: 'M54.5', description: 'Low back pain' }];

function setup(overrides = {}) {
  const onAddDiagnosis = vi.fn();
  const onDiagnosesChange = vi.fn();
  const searchIcd10 = vi.fn(async () => ICD10);
  renderWithTheme(
    <CaseDiagnosisTab
      diagnoses={diagnoses}
      searchIcd10={searchIcd10}
      onAddDiagnosis={onAddDiagnosis}
      onDiagnosesChange={onDiagnosesChange}
      {...overrides}
    />
  );
  return { onAddDiagnosis, onDiagnosesChange, searchIcd10 };
}

describe('CaseDiagnosisTab', () => {
  it('renders the active diagnosis by default and the count summary', () => {
    setup();
    expect(screen.getByText('M54.5')).toBeInTheDocument();
    // Only the active diagnosis is shown under the default "active" filter.
    expect(screen.queryByText('G56.00')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 diagnoses')).toBeInTheDocument();
  });

  it('quick-adds a diagnosis', () => {
    const { onAddDiagnosis } = setup();
    fireEvent.change(screen.getByLabelText('ICD-10 Code:'), {
      target: { value: 'M54.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
    expect(onAddDiagnosis).toHaveBeenCalledWith(
      expect.objectContaining({ icd10Code: 'M54.5' })
    );
  });

  it('deletes a diagnosis after confirmation', async () => {
    const { onDiagnosesChange } = setup();
    fireEvent.click(screen.getByLabelText('Delete: M54.5'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(onDiagnosesChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ id: '1' })])
      )
    );
  });

  it('runs the debounced ICD-10 search after typing', async () => {
    const { searchIcd10 } = setup();
    fireEvent.change(screen.getByLabelText('ICD-10 Code:'), {
      target: { value: 'M5' },
    });
    await waitFor(() => expect(searchIcd10).toHaveBeenCalledWith('M5'));
  });

  it('hides the ICD-11 row when no ICD-11 search is provided', () => {
    setup();
    expect(screen.queryByText('Add ICD-11 Diagnosis')).not.toBeInTheDocument();
  });
});
