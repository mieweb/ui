import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CodeLookupProps } from '../../components/CodeLookup/CodeLookup';
import type {
  DrugProduct,
  PrescribingApi,
} from '../../prescribing/api/contracts';
import { PrescribingMedicationLookup } from './PrescribingMedicationLookup';
import { createFakeEhrService } from './createFakeEhrService';

vi.mock('../../components/CodeLookup/CodeLookup', () => ({
  CodeLookup: (props: CodeLookupProps) => (
    <div>
      <input
        role="combobox"
        aria-expanded="false"
        aria-controls="adapter-test-results"
        aria-label="Medication"
        onChange={(event) => props.onQueryChange?.(event.target.value)}
      />
      <button
        onClick={() =>
          props.onSelect?.({
            fullid: 'sim-a',
            fullcode: 'sim-a',
            codetype: 'urn:mieweb:simulation-drug',
            label: 'Untrusted label 999 mg capsule',
            domain: 'med',
            score: 1,
            viaAlias: false,
          })
        }
      >
        Pick indexed drug
      </button>
    </div>
  ),
}));

const now = () => '2026-10-03T12:00:00.000Z';
async function product() {
  const service = createFakeEhrService({ scenarioId: 'complete-demo' });
  try {
    return (await service.getDrug('sim-a')).body.data;
  } finally {
    service.controller.dispose();
  }
}
function client(getDrug: PrescribingApi['getDrug']) {
  return { getDrug } as PrescribingApi;
}

describe('Codify to EHR medication adapter', () => {
  it('resolves the code through the EHR and ignores strength/form in an indexed label', async () => {
    const resolved = await product();
    const getDrug = vi.fn().mockResolvedValue({ body: { data: resolved } });
    const onSelect = vi.fn();
    const onFreeText = vi.fn();
    render(
      <PrescribingMedicationLookup
        indexUrl="/prescribing-codify"
        client={client(getDrug)}
        now={now}
        onSelect={onSelect}
        onFreeText={onFreeText}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick indexed drug' }));
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'SimDrug A 5 mg tablet',
          strength: '5 mg',
          doseForm: 'tablet',
          productId: 'sim-a',
        })
      )
    );
    expect(getDrug).toHaveBeenCalledWith(
      'sim-a',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(onFreeText).toHaveBeenCalledWith('Untrusted label 999 mg capsule');
  });
  it('rejects a mismatched server product and leaves a saveable free-text draft', async () => {
    const resolved = await product();
    const onSelect = vi.fn();
    const onFreeText = vi.fn();
    render(
      <PrescribingMedicationLookup
        indexUrl="/prescribing-codify"
        client={client(
          vi.fn().mockResolvedValue({
            body: {
              data: {
                ...resolved,
                coding: [{ system: 'other', code: 'other' }],
              },
            },
          })
        )}
        now={now}
        onSelect={onSelect}
        onFreeText={onFreeText}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick indexed drug' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'does not match'
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'save this medication as free text'
    );
    expect(onSelect).not.toHaveBeenCalled();
    expect(onFreeText).toHaveBeenCalled();
  });
  it('discards a product resolution if the user types another medication while it is pending', async () => {
    const resolved = await product();
    let complete!: (response: { body: { data: DrugProduct } }) => void;
    const getDrug = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    const onSelect = vi.fn();
    const onQueryChange = vi.fn();
    render(
      <PrescribingMedicationLookup
        indexUrl="/prescribing-codify"
        client={client(getDrug)}
        now={now}
        onSelect={onSelect}
        onQueryChange={onQueryChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pick indexed drug' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Medication' }), {
      target: { value: 'Another draft' },
    });
    await act(async () => complete({ body: { data: resolved } }));
    expect(getDrug.mock.calls[0][1].signal.aborted).toBe(true);
    expect(onQueryChange).toHaveBeenCalledWith('Another draft');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
