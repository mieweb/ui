import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
} from '@esheet/core';
import { renderWithTheme } from '../../test/test-utils';
import { MedicationReconciliation } from '../MedicationList';
import { EncounterVitalsField } from './EncounterVitalsField';
import { EncounterNarrativeField } from './EncounterNarrativeField';
import { EncounterMessagesProvider } from './messages';
import { isEncounterDate } from './date';

// ProseMirror resists jsdom simulation; narrative fields run on the legacy
// engine, which shares the TextAreaRichProps contract (see the stub).
vi.mock(
  '../../components/TextAreaRich/TextAreaRichKerebron',
  () => import('../../test/textAreaRichKerebronStub')
);
import {
  createEncounterFormDefinition,
  validateEncounterDefinition,
} from './definition';

function props(answer: string, fieldType: string): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'field',
        fieldType,
        question: 'Exam',
      } as unknown as FieldDefinition,
      parentId: null,
      childIds: [],
      index: 0,
    },
    form: createFormStore(),
    ui: createUIStore(),
    isPreview: true,
    isEnabled: true,
    isReadOnly: false,
    isSelected: false,
    isRequired: false,
    isSoftRequired: false,
    response: {
      answer,
      selected: { id: 'stale', value: 'stale' },
      attributes: { host: 'retained' },
      _ai: true,
    },
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
    onResponse: vi.fn(),
  };
}

describe('encounter review regressions', () => {
  it.each(['left arm', 'line\nbreak', '% colon:', '\ud800'])(
    'uses valid unit and error IDREFs for arbitrary native reading ID %j',
    (id) => {
      const fieldProps = props(
        JSON.stringify({ readings: [{ id, systolic: 120 }] }),
        'encounterVitals'
      );
      renderWithTheme(<EncounterVitalsField {...fieldProps} />);
      const input = screen.getByLabelText('Systolic');
      expect(input.id).not.toMatch(/\s/);
      const unit = input.getAttribute('aria-describedby')!;
      expect(unit).not.toMatch(/\s/);
      expect(document.getElementById(unit)).toHaveTextContent('mmHg');
      const group = screen.getByRole('group', {
        name: 'Blood pressure (mmHg)',
      });
      expect(
        document.getElementById(group.getAttribute('aria-describedby')!)
      ).toHaveAttribute('role', 'alert');
      fireEvent.change(input, { target: { value: '122' } });
      const next = vi.mocked(fieldProps.onResponse).mock.calls.at(-1)![0];
      expect(next).not.toHaveProperty('selected');
      expect(next.attributes).toEqual({ host: 'retained' });
      expect(JSON.parse(next.answer!).readings[0].id).toBe(id);
    }
  );
  it('lets a rewritten narrative repair an invalid selected response while retaining host attributes', () => {
    const fieldProps = props('Old prose', 'encounterNarrative');
    renderWithTheme(<EncounterNarrativeField {...fieldProps} />);
    fireEvent.input(screen.getByRole('textbox'), {
      target: { innerHTML: '<b>Corrected prose</b>' },
    });
    const next = vi.mocked(fieldProps.onResponse).mock.calls.at(-1)![0];
    expect(next).not.toHaveProperty('selected');
    expect(next.answer).toBe('Corrected prose');
    expect(next.attributes).toMatchObject({
      host: 'retained',
      encounterNarrativeHtml: '<b>Corrected prose</b>',
    });
  });
  it('exposes a keyboard-scrollable, named malformed vital response', () => {
    renderWithTheme(
      <EncounterVitalsField
        {...props('invalid '.repeat(100), 'encounterVitals')}
      />
    );
    const raw = screen.getByLabelText('Saved vitals answer');
    expect(raw).toHaveAttribute('tabindex', '0');
    expect(raw).toHaveTextContent('invalid');
  });
  it('localizes composed medication controls and editor labels without translating captured drug names', () => {
    renderWithTheme(
      <EncounterMessagesProvider
        messages={{
          labels: {
            Add: 'Agregar',
            'Add Medication': 'Agregar medicamento',
            Medication: 'Medicamento',
            Save: 'Guardar',
            Cancel: 'Cancelar',
            Unreconciled: 'Sin revisar',
          },
        }}
      >
        <MedicationReconciliation
          defaultMedications={[
            { id: 'med', name: 'Actual drug name', status: 'unreconciled' },
          ]}
        />
      </EncounterMessagesProvider>
    );
    expect(screen.getByText('Actual drug name')).toBeInTheDocument();
    expect(screen.getByText('Sin revisar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Agregar medicamento');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Medicamento' })
    ).toBeInTheDocument();
  });
  it.each(['', '2026-02-30', '2026-2-01', '2026-13-01', '0000-01-01'])(
    'rejects invalid host encounter dates %j',
    (encounterDate) => {
      expect(isEncounterDate(encounterDate)).toBe(false);
      expect(() =>
        validateEncounterDefinition({
          id: 'visit',
          title: 'Visit',
          encounterDate,
          sections: [
            { id: 'conditions', title: 'Conditions', kind: 'conditions' },
          ],
        })
      ).toThrow('encounterDate');
    }
  );
  it('projects an explicitly supplied past encounter date without inventing a default', () => {
    const def = {
      id: 'visit',
      title: 'Visit',
      sections: [
        { id: 'conditions', title: 'Conditions', kind: 'conditions' as const },
      ],
    };
    const form = createEncounterFormDefinition({
      ...def,
      encounterDate: '2000-02-29',
    });
    expect(form.pages[0].fields?.[0]).toMatchObject({
      fields: [{ _sourceData: { encounterDate: '2000-02-29' } }],
    });
    expect(JSON.stringify(createEncounterFormDefinition(def))).not.toContain(
      'encounterDate'
    );
  });
});
