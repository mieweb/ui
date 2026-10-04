import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { FieldComponentProps } from '@esheet/core';
import { MedicationListField } from './MedicationListField';
import type { Medication } from '../components/MedicationList';
import { prescribingUiConfiguration } from '../components/PrescriptionReadiness/storyData';
import { renderWithTheme } from '../test/test-utils';
vi.mock('@esheet/fields', () => ({ registerCustomFieldTypes: vi.fn() }));
function field(medications: Medication[]): FieldComponentProps['field'] {
  // eSheet's runtime registry supports custom definitions; its static union
  // still covers only built-ins, as documented by the eSheet adapter.
  return {
    definition: {
      id: 'medications',
      fieldType: 'medicationList',
      question: 'Presenting medications',
      medications,
    } as unknown as FieldComponentProps['field']['definition'],
    parentId: null,
    childIds: [],
    index: 0,
  };
}
const medication: Medication = {
  id: 'rx-ui-1',
  name: 'Lasix',
  status: 'unreconciled',
};
describe('eSheet medication prescribing integration', () => {
  it('preserves the existing intake default without readiness warnings', () => {
    renderWithTheme(
      <MedicationListField
        field={field([medication])}
        response={undefined}
        isPreview
        isEnabled
        isReadOnly={false}
        onResponse={vi.fn()}
      />
    );
    expect(screen.getByText('Lasix')).toBeVisible();
    expect(
      screen.queryByText('Needs prescription details')
    ).not.toBeInTheDocument();
  });
  it('round trips prescription details in the same medications JSON envelope', async () => {
    const response = vi.fn();
    renderWithTheme(
      <MedicationListField
        field={field([
          {
            ...medication,
            prescribingIntent: 'prescribe',
            prescriptionRevision: '1',
            refills: '0',
          },
        ])}
        response={undefined}
        isPreview
        isEnabled
        isReadOnly={false}
        onResponse={response}
        codeLookup={false}
        prescribing={() => prescribingUiConfiguration}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete prescription: Lasix' })
    );
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '-3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(response).toHaveBeenCalled());
    expect(JSON.parse(response.mock.calls[0][0].answer)).toEqual({
      medications: [
        expect.objectContaining({
          id: 'rx-ui-1',
          name: 'Lasix',
          quantity: '-3',
          refills: '0',
          prescribingIntent: 'prescribe',
        }),
      ],
    });
  });
  it('respects the host computed read-only state while showing opt-in issues', () => {
    renderWithTheme(
      <MedicationListField
        field={field([{ ...medication, prescribingIntent: 'prescribe' }])}
        response={undefined}
        isPreview
        isEnabled
        isReadOnly
        onResponse={vi.fn()}
        prescribing={() => prescribingUiConfiguration}
      />
    );
    expect(screen.getByText('Needs prescription details')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /complete prescription/i })
    ).not.toBeInTheDocument();
  });
  it('ignores malformed response JSON instead of restoring a stale definition list', () => {
    renderWithTheme(
      <MedicationListField
        field={field([medication])}
        response={{ answer: 'null' }}
        isPreview
        isEnabled
        isReadOnly={false}
        onResponse={vi.fn()}
      />
    );
    expect(screen.queryByText('Lasix')).not.toBeInTheDocument();
  });
});
