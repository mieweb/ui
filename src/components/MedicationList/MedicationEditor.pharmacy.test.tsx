import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  MedicationEditor,
  type MedicationEditorProps,
} from './MedicationEditor';
import type { Medication } from './MedicationList';
import {
  createFakePharmacySource,
  storyPharmacies as P,
} from '../Pharmacy/storyData';

const lisinopril: Medication = {
  id: 'm1',
  name: 'lisinopril 10 mg tablet',
  status: 'taking',
};

function renderEditor(overrides: Partial<MedicationEditorProps> = {}) {
  const onSave = vi.fn();
  const props: MedicationEditorProps = {
    open: true,
    medication: lisinopril,
    codeLookup: false,
    pharmacy: {
      source: createFakePharmacySource(),
      patId: 'preferred-and-recent',
    },
    onClose: vi.fn(),
    onSave,
    ...overrides,
  };
  renderWithTheme(<MedicationEditor {...props} />);
  return { onSave };
}

const pharmacySelect = () =>
  screen.getByRole('combobox', { name: 'Pharmacy' }) as HTMLSelectElement;
const transmission = () =>
  screen.getByRole('radiogroup', { name: 'Transmission' });
const transmitRadio = () =>
  within(transmission()).getByRole('radio', { name: /^Transmit/ });
const save = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));

/** Waits for the short list to load and the default to apply. */
const loaded = (pharmId: string) =>
  waitFor(() => expect(pharmacySelect().value).toBe(pharmId));

describe('MedicationEditor pharmacy & transmission', () => {
  it('adds nothing without the pharmacy prop', () => {
    const { onSave } = renderEditor({ pharmacy: undefined });
    expect(
      screen.queryByRole('combobox', { name: 'Pharmacy' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('radiogroup', { name: 'Transmission' })
    ).not.toBeInTheDocument();
    save();
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('transmission');
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('pharmacyId');
  });

  it('selects the preferred pharmacy and offers e-prescribing, defaulting to None', async () => {
    const { onSave } = renderEditor();
    await loaded(P.main.pharmId);
    await waitFor(() => expect(transmitRadio()).toBeEnabled());
    expect(transmitRadio()).toHaveAccessibleName('Transmit (e-prescribe)');
    expect(
      within(transmission()).getByRole('radio', { name: 'None' })
    ).toBeChecked();

    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacyId: P.main.pharmId,
        transmission: 'none',
      })
    );
  });

  it('saves Transmit for the chosen pharmacy', async () => {
    const { onSave } = renderEditor();
    await loaded(P.main.pharmId);
    await waitFor(() => expect(transmitRadio()).toBeEnabled());
    fireEvent.click(transmitRadio());
    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacyId: P.main.pharmId,
        transmission: 'transmit',
      })
    );
  });

  it('offers fax transmission for a fax-only pharmacy', async () => {
    renderEditor();
    await loaded(P.main.pharmId);
    fireEvent.change(pharmacySelect(), {
      target: { value: P.riverside.pharmId },
    });
    expect(transmitRadio()).toBeEnabled();
    expect(transmitRadio()).toHaveAccessibleName('Transmit (fax)');
  });

  it('restores a saved pharmacy and choice', async () => {
    const { onSave } = renderEditor({
      medication: {
        ...lisinopril,
        pharmacyId: P.corner.pharmId,
        transmission: 'print',
      },
    });
    await loaded(P.corner.pharmId);
    expect(
      within(transmission()).getByRole('radio', { name: 'Print' })
    ).toBeChecked();
    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacyId: P.corner.pharmId,
        transmission: 'print',
      })
    );
  });

  it('falls back to None and says why when the pharmacy cannot receive it', async () => {
    const { onSave } = renderEditor({
      medication: {
        ...lisinopril,
        pharmacyId: P.hilltop.pharmId,
        transmission: 'transmit',
      },
    });
    await loaded(P.hilltop.pharmId);
    await waitFor(() =>
      expect(
        within(transmission()).getByRole('radio', { name: 'None' })
      ).toBeChecked()
    );
    expect(transmitRadio()).toBeDisabled();
    expect(transmitRadio()).toHaveAccessibleDescription(
      'This pharmacy can’t receive prescriptions electronically or by fax.'
    );
    expect(
      screen.getByText(/Transmission changed to None/)
    ).toBeInTheDocument();
    save();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pharmacyId: P.hilltop.pharmId,
        transmission: 'none',
      })
    );
  });

  it('switches Transmit off when the user picks a pharmacy that cannot receive it', async () => {
    renderEditor({
      medication: { ...lisinopril, pharmacyId: P.hilltop.pharmId },
    });
    await loaded(P.hilltop.pharmId);
    // Let the field report its initial load before changing it.
    await waitFor(() =>
      expect(transmitRadio()).toHaveAccessibleDescription(
        'This pharmacy can’t receive prescriptions electronically or by fax.'
      )
    );
    fireEvent.change(pharmacySelect(), { target: { value: P.main.pharmId } });
    fireEvent.click(transmitRadio());
    expect(transmitRadio()).toBeChecked();

    fireEvent.change(pharmacySelect(), {
      target: { value: P.hilltop.pharmId },
    });
    expect(
      within(transmission()).getByRole('radio', { name: 'None' })
    ).toBeChecked();
    expect(
      screen.getByText(/Transmission changed to None/)
    ).toBeInTheDocument();
  });

  it('explains Transmit when no pharmacy is chosen', async () => {
    renderEditor({
      pharmacy: { source: createFakePharmacySource(), patId: 'no-history' },
    });
    await loaded('0');
    await waitFor(() =>
      expect(transmitRadio()).toHaveAccessibleDescription(
        'Choose a pharmacy to transmit.'
      )
    );
    expect(transmitRadio()).toBeDisabled();
  });

  it('closes only the pharmacy search on Escape', async () => {
    const onClose = vi.fn();
    renderEditor({ onClose });
    await loaded(P.main.pharmId);
    fireEvent.click(screen.getByRole('button', { name: 'Search pharmacies' }));
    const search = await screen.findByRole('dialog', {
      name: 'Pharmacy Search',
    });
    fireEvent.keyDown(search, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Pharmacy Search' })
      ).not.toBeInTheDocument()
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
