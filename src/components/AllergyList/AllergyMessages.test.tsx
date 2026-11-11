import * as React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { MessagesProvider } from '../../utils/messages';
import { AllergyList, type Allergy } from './AllergyList';
import { AllergyManager } from './AllergyManager';
import type { CodeLookupProps } from '../CodeLookup/CodeLookup';

const allergies: Allergy[] = [
  {
    id: 'allergen-1',
    allergen: 'penicillin',
    type: 'drug',
    reaction: 'hives reported by patient',
    severity: 'severe',
    onsetDate: '2020-03-02',
    note: 'Original clinical note',
    code: { system: 'RxNORM', code: '7984', display: 'penicillin' },
  },
  { id: 'allergen-2', allergen: 'aspirin', type: 'drug' },
];

function Catalog(props: CodeLookupProps) {
  return (
    <input aria-label={props.placeholder} defaultValue={props.initialQuery} />
  );
}

describe('allergy messages', () => {
  it('translates labels and keyboard announcements while preserving entered clinical data', async () => {
    const onReorder = vi.fn();
    const labels = {
      Allergies: 'Alergias',
      Drug: 'Fármaco',
      severe: 'grave',
      'since {date}': 'desde {date}',
      'Actions for {name}': 'Acciones para {name}',
      '{name}. Alt plus arrow keys to reorder.': '{name}. Reordenar con Alt.',
      '{name} moved down': '{name} bajó',
      '{name} moved up': '{name} subió',
    };
    const { rerender, container } = renderWithTheme(
      <MessagesProvider messages={{ labels }}>
        <AllergyList allergies={allergies} onReorder={onReorder} />
      </MessagesProvider>
    );
    expect(screen.getByText('Alergias')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Fármaco' })).toBeInTheDocument();
    expect(screen.getByText('grave')).toBeInTheDocument();
    expect(screen.getByText('desde 2020-03-02')).toBeInTheDocument();
    expect(screen.getByText('RxNORM 7984')).toBeInTheDocument();
    expect(
      screen.getByText('hives reported by patient', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText('Original clinical note')).toBeInTheDocument();
    expect(
      screen.getByRole('toolbar', { name: 'Acciones para penicillin' })
    ).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('penicillin. Reordenar con Alt.'), {
      key: 'ArrowDown',
      altKey: true,
    });
    expect(onReorder).toHaveBeenCalledWith(['allergen-2', 'allergen-1']);
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        'penicillin bajó'
      )
    );

    rerender(
      <MessagesProvider
        messages={{
          labels: {
            ...labels,
            '{name} moved down': '{name} moved in the new locale',
          },
        }}
      >
        <AllergyList allergies={allergies} onReorder={onReorder} />
      </MessagesProvider>
    );
    fireEvent.keyDown(screen.getByLabelText('penicillin. Reordenar con Alt.'), {
      key: 'ArrowDown',
      altKey: true,
    });
    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
        'penicillin moved in the new locale'
      )
    );
  });

  it('translates editor options and dynamic coded guidance without changing saved clinical values', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <MessagesProvider
        messages={{
          labels: {
            Correct: 'Corregir',
            'Correct Allergy': 'Corregir alergia',
            Type: 'Tipo',
            Drug: 'Fármaco',
            Food: 'Alimento',
            Environmental: 'Ambiente',
            Other: 'Otro',
            Reaction: 'Reacción',
            Save: 'Guardar',
            Close: 'Cerrar',
            'Coded: {system} {code}': 'Código: {system} {code}',
          },
        }}
      >
        <AllergyManager
          defaultAllergies={[allergies[0]]}
          onChange={onChange}
          codeLookup={{ component: Catalog, indexUrl: '/test-catalog' }}
        />
      </MessagesProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Corregir' }));
    const dialog = screen.getByRole('dialog', { name: 'Corregir alergia' });
    expect(
      within(dialog).getByRole('button', { name: 'Cerrar' })
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Código: RxNORM 7984')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('combobox', { name: 'Tipo' }));
    expect(screen.getByRole('option', { name: 'Fármaco' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Alimento' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Ambiente' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Otro' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Fármaco' }));
    fireEvent.change(within(dialog).getByLabelText('Reacción'), {
      target: { value: 'Clinician amended reaction' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(onChange).toHaveBeenCalledWith([
      { ...allergies[0], reaction: 'Clinician amended reaction' },
    ]);
  });

  it('retains explicit NKA capture through translated controls', () => {
    const onNkaChange = vi.fn();
    renderWithTheme(
      <MessagesProvider
        messages={{
          labels: {
            'Allergy status not recorded.': 'Estado de alergia sin registrar.',
            'Confirm: no known allergies': 'Confirmar: sin alergias conocidas',
          },
        }}
      >
        <AllergyManager
          defaultAllergies={[]}
          onNoKnownAllergiesChange={onNkaChange}
        />
      </MessagesProvider>
    );
    expect(
      screen.getByText('Estado de alergia sin registrar.')
    ).toBeInTheDocument();
    expect(onNkaChange).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar: sin alergias conocidas' })
    );
    expect(onNkaChange).toHaveBeenCalledWith(true);
  });
});
