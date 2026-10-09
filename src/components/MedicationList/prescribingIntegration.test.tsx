import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MedicationList } from './MedicationList';
import { MedicationReconciliation } from './MedicationReconciliation';
import { prescribingUiConfiguration } from '../PrescriptionReadiness/storyData';

describe('prescribing opt-in medication surfaces', () => {
  const draft = {
    id: 'rx-ui-1',
    name: 'Lasix',
    status: 'unreconciled' as const,
  };
  it('keeps ordinary intake free of prescription alerts even with configuration available', () => {
    renderWithTheme(
      <MedicationList
        medications={[draft]}
        prescribing={() => prescribingUiConfiguration}
      />
    );
    expect(
      screen.queryByText('Needs prescription details')
    ).not.toBeInTheDocument();
  });
  it('displays an unknown result for opt-in prescriptions without readiness context', () => {
    renderWithTheme(
      <MedicationList
        medications={[{ ...draft, prescribingIntent: 'prescribe' }]}
      />
    );
    expect(screen.getAllByText('Readiness not checked')[0]).toBeVisible();
  });
  it('opens the existing full editor for completion and keeps invalid values saveable', () => {
    const change = vi.fn();
    renderWithTheme(
      <MedicationReconciliation
        defaultMedications={[
          {
            ...draft,
            prescribingIntent: 'prescribe',
            prescriptionRevision: '1',
          },
        ]}
        prescribing={() => prescribingUiConfiguration}
        codeLookup={false}
        onChange={change}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete prescription: Lasix' })
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '-1' },
    });
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
  });
  it('retains warnings and removes completion actions in read-only lists', () => {
    renderWithTheme(
      <MedicationList
        readOnly
        medications={[
          {
            ...draft,
            prescribingIntent: 'prescribe',
            prescriptionRevision: '1',
          },
        ]}
        prescribing={() => prescribingUiConfiguration}
        onCompletePrescription={vi.fn()}
      />
    );
    expect(screen.getByText('Needs prescription details')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /complete prescription/i })
    ).not.toBeInTheDocument();
  });
});
