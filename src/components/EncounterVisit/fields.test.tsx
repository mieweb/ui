import * as React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
  type FieldResponse,
} from '@esheet/core';
import { getFieldComponent, registerFieldComponents } from '@esheet/fields';
import { renderWithTheme } from '../../test/test-utils';
import { EncounterVitalsField } from './EncounterVitalsField';
import { EncounterAssessmentField } from './EncounterAssessmentField';
import { registerEncounterFieldTypes } from './fields';
import type { EncounterAssessmentValue, EncounterVitalsValue } from './types';

function createProps(
  fieldType: string,
  overrides: Partial<FieldComponentProps> = {}
): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'test-field',
        fieldType,
        question:
          fieldType === 'encounterVitals' ? 'Vitals' : 'Assessment and plan',
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
    response: undefined,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
    onResponse: vi.fn(),
    ...overrides,
  };
}

function renderControlledField(
  Component: React.ComponentType<FieldComponentProps>,
  fieldType: string,
  initialValue?: unknown,
  overrides: Partial<FieldComponentProps> = {}
) {
  const onResponse = vi.fn();
  const props = createProps(fieldType, overrides);
  function Harness() {
    const [response, setResponse] = React.useState<FieldResponse | undefined>(
      initialValue === undefined
        ? undefined
        : { answer: JSON.stringify(initialValue) }
    );
    return (
      <Component
        {...props}
        response={response}
        onResponse={(next) => {
          onResponse(next);
          setResponse(next);
        }}
      />
    );
  }
  const rendered = renderWithTheme(<Harness />);
  const latest = <T,>(): T =>
    JSON.parse(onResponse.mock.calls.at(-1)![0].answer);
  return { ...rendered, onResponse, latest };
}

describe('EncounterVitalsField', () => {
  it('coordinates blood pressure in one response while retaining the paired reading and metadata', () => {
    const { onResponse, latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      {
        readings: [
          {
            id: 'first',
            systolic: 142,
            diastolic: 88,
            pulse: 75,
            position: 'Seated',
            site: 'Left arm',
            recordedAt: '2026-10-10T09:30',
          },
          { id: 'second', systolic: 136, diastolic: 84 },
        ],
      }
    );
    const reading = within(
      screen.getByRole('group', { name: 'Measurement set 1' })
    );
    expect(
      reading.getByRole('group', { name: 'Blood pressure (mmHg)' })
    ).toBeInTheDocument();
    fireEvent.change(reading.getByLabelText('Systolic'), {
      target: { value: '140' },
    });
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(latest<EncounterVitalsValue>().readings).toEqual([
      {
        id: 'first',
        systolic: 140,
        diastolic: 88,
        pulse: 75,
        position: 'Seated',
        site: 'Left arm',
        recordedAt: '2026-10-10T09:30',
      },
      { id: 'second', systolic: 136, diastolic: 84 },
    ]);
    fireEvent.change(reading.getByLabelText('Diastolic'), {
      target: { value: '86' },
    });
    expect(latest<EncounterVitalsValue>().readings[0]).toMatchObject({
      systolic: 140,
      diastolic: 86,
      pulse: 75,
    });
  });

  it('leaves blank measurements absent, reports partial blood pressure and permits a later paired entry', () => {
    const { latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      { readings: [{ id: 'r1', systolic: 140, diastolic: 90, pulse: 70 }] }
    );
    fireEvent.change(screen.getByLabelText('Pulse'), { target: { value: '' } });
    expect(latest<EncounterVitalsValue>().readings[0]).not.toHaveProperty(
      'pulse'
    );
    fireEvent.change(screen.getByLabelText('Diastolic'), {
      target: { value: '' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      /systolic.*diastolic|both/i
    );
    expect(latest<EncounterVitalsValue>().readings[0]).toEqual({
      id: 'r1',
      systolic: 140,
    });
    fireEvent.change(screen.getByLabelText('Diastolic'), {
      target: { value: '88' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('adds empty measurement sets with stable distinct ids and removes only the chosen set', () => {
    const { latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals'
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Add measurement set' })
    );
    const firstId = latest<EncounterVitalsValue>().readings[0].id;
    expect(latest<EncounterVitalsValue>().readings[0]).toEqual({ id: firstId });
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: '76' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Add measurement set' })
    );
    expect(latest<EncounterVitalsValue>().readings[1].id).not.toBe(firstId);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove measurement set 2' })
    );
    expect(latest<EncounterVitalsValue>().readings).toEqual([
      { id: firstId, pulse: 76 },
    ]);
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'honors the eSheet edit state %j',
    (override) => {
      const { onResponse } = renderControlledField(
        EncounterVitalsField,
        'encounterVitals',
        { readings: [{ id: 'r1', pulse: 75 }] },
        override
      );
      expect(screen.getByLabelText('Pulse')).toHaveAttribute('readonly');
      expect(
        screen.queryByRole('button', { name: /measurement set/i })
      ).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Pulse'), {
        target: { value: '99' },
      });
      fireEvent.change(screen.getByLabelText('Position'), {
        target: { value: 'Standing' },
      });
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it('shows numeric range errors without a diagnosis or unsolicited default', () => {
    renderControlledField(EncounterVitalsField, 'encounterVitals', {
      readings: [{ id: 'r1', pulse: -1, oxygenSaturation: 101, pain: 11 }],
    });
    expect(screen.getByLabelText('Pulse')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Oxygen saturation')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Pain')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Temperature')).toHaveValue('');
    expect(screen.getByText('°C')).toBeInTheDocument();
    expect(screen.getByText('bpm')).toBeInTheDocument();
  });

  it('persists invalid numeric text while removing the stale measurement and preserving other edits', () => {
    const { onResponse, latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      { readings: [{ id: 'r1', pulse: 75 }] }
    );
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: 'Infinity' },
    });
    expect(screen.getByLabelText('Pulse')).toHaveValue('Infinity');
    expect(screen.getByText('Enter a finite number.')).toBeInTheDocument();
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(latest<EncounterVitalsValue>()).toEqual({
      readings: [{ id: 'r1' }],
      inputDrafts: [{ readingId: 'r1', key: 'pulse', text: 'Infinity' }],
    });
    fireEvent.change(screen.getByLabelText('Weight'), {
      target: { value: '80' },
    });
    expect(screen.getByLabelText('Pulse')).toHaveValue('Infinity');
    expect(screen.getByText('Enter a finite number.')).toBeInTheDocument();
    expect(latest<EncounterVitalsValue>().readings[0]).toEqual({
      id: 'r1',
      weight: 80,
    });
    fireEvent.change(screen.getByLabelText('Pulse'), {
      target: { value: '76' },
    });
    expect(latest<EncounterVitalsValue>()).toEqual({
      readings: [{ id: 'r1', weight: 80, pulse: 76 }],
    });
    expect(
      screen.queryByText('Enter a finite number.')
    ).not.toBeInTheDocument();
  });

  it('restores persisted invalid inputs and clears them when left blank', () => {
    const { latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      {
        readings: [{ id: 'r1', weight: 80 }],
        inputDrafts: [{ readingId: 'r1', key: 'pulse', text: 'unknown' }],
      }
    );
    expect(screen.getByLabelText('Pulse')).toHaveValue('unknown');
    expect(screen.getByLabelText('Pulse')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    fireEvent.change(screen.getByLabelText('Pulse'), { target: { value: '' } });
    expect(latest<EncounterVitalsValue>()).toEqual({
      readings: [{ id: 'r1', weight: 80 }],
    });
    expect(screen.getByLabelText('Pulse')).toHaveValue('');
  });

  it('keeps the other blood pressure component when an invalid input is persisted', () => {
    const { onResponse, latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      { readings: [{ id: 'r1', systolic: 140, diastolic: 88 }] }
    );
    fireEvent.change(screen.getByLabelText('Systolic'), {
      target: { value: '-' },
    });
    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(latest<EncounterVitalsValue>()).toEqual({
      readings: [{ id: 'r1', diastolic: 88 }],
      inputDrafts: [{ readingId: 'r1', key: 'systolic', text: '-' }],
    });
    expect(
      screen.getByText(/Record both systolic and diastolic/i)
    ).toHaveAttribute('role', 'alert');
  });

  it('removes a measurement set together with its associated invalid drafts', () => {
    const { latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      {
        readings: [{ id: 'first' }, { id: 'second', pulse: 75 }],
        inputDrafts: [{ readingId: 'first', key: 'temperature', text: '?' }],
      }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove measurement set 1' })
    );
    expect(latest<EncounterVitalsValue>().readings).toEqual([
      { id: 'second', pulse: 75 },
    ]);
    expect(latest<EncounterVitalsValue>().inputDrafts ?? []).toEqual([]);
  });

  it('retains a trailing decimal separator while recording the numeric measurement', () => {
    const { latest } = renderControlledField(
      EncounterVitalsField,
      'encounterVitals',
      { readings: [{ id: 'r1' }] }
    );
    fireEvent.change(screen.getByLabelText('Temperature'), {
      target: { value: '37.' },
    });
    expect(screen.getByLabelText('Temperature')).toHaveValue('37.');
    expect(latest<EncounterVitalsValue>().readings[0].temperature).toBe(37);
    fireEvent.change(screen.getByLabelText('Temperature'), {
      target: { value: '37.5' },
    });
    expect(latest<EncounterVitalsValue>().readings[0].temperature).toBe(37.5);
  });

  it.each([
    'not json',
    '{"readings":[{"id":"r1","pulse":"seventy"}]}',
    '{"readings":[{"id":"r1","pulse":1e999}]}',
  ])(
    'surfaces malformed saved answers without enabling destructive edits: %s',
    (answer) => {
      const props = createProps('encounterVitals', { response: { answer } });
      renderWithTheme(<EncounterVitalsField {...props} />);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'The saved vitals answer could not be read.'
      );
      expect(screen.getByText(answer)).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Add measurement set' })
      ).not.toBeInTheDocument();
      expect(props.onResponse).not.toHaveBeenCalled();
    }
  );

  it('displays a recorded timestamp with a UTC offset instead of hiding it in a datetime control', () => {
    renderControlledField(EncounterVitalsField, 'encounterVitals', {
      readings: [{ id: 'r1', recordedAt: '2026-10-10T09:30:00Z' }],
    });
    expect(screen.getByLabelText('Recorded at')).toHaveValue(
      '2026-10-10T09:30:00Z'
    );
  });

  it('shows invalid saved dates as text so the original value can be corrected', () => {
    renderControlledField(EncounterVitalsField, 'encounterVitals', {
      readings: [{ id: 'r1', pulse: 75, recordedAt: '2026-02-30T09:30' }],
    });
    expect(screen.getByLabelText('Recorded at')).toHaveValue(
      '2026-02-30T09:30'
    );
    expect(screen.getByLabelText('Recorded at')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});

describe('EncounterAssessmentField', () => {
  const initial: EncounterAssessmentValue = {
    concerns: [
      {
        concernId: 'bp',
        clinicalStatus: 'active',
        assertions: [
          {
            id: 'assertion',
            date: '2026-10-10',
            text: 'Hypertension',
            verificationStatus: 'unconfirmed',
          },
        ],
      },
    ],
    items: [{ concernId: 'bp', assertionId: 'assertion' }],
    orders: [
      {
        orderId: 'order',
        type: 'lab',
        display: 'Basic metabolic panel',
        concernId: 'bp',
      },
    ],
  };

  it('reuses Assessment to add an explicitly entered concern with linked assertion ids', () => {
    const { latest } = renderControlledField(
      EncounterAssessmentField,
      'encounterAssessment',
      initial
    );
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Concern or order description'), {
      target: { value: 'Back pain' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const value = latest<EncounterAssessmentValue>();
    expect(value.orders).toEqual(initial.orders);
    expect(value.concerns[1].assertions[0]).toMatchObject({
      text: 'Back pain',
      verificationStatus: 'unconfirmed',
    });
    expect(value.items[1]).toEqual({
      concernId: value.concerns[1].concernId,
      assertionId: value.concerns[1].assertions[0].id,
    });
  });

  it('preserves orders as unlinked when removing the assessed concern', () => {
    const { latest } = renderControlledField(
      EncounterAssessmentField,
      'encounterAssessment',
      initial
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Hypertension from assessment',
      })
    );
    expect(latest<EncounterAssessmentValue>().items).toEqual([]);
    expect(latest<EncounterAssessmentValue>().orders).toEqual([
      { orderId: 'order', type: 'lab', display: 'Basic metabolic panel' },
    ]);
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'shows the Assessment component read only for %j',
    (override) => {
      const { onResponse } = renderControlledField(
        EncounterAssessmentField,
        'encounterAssessment',
        initial,
        override
      );
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(
        screen.queryByLabelText('Concern or order description')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: 'Remove Hypertension from assessment',
        })
      ).not.toBeInTheDocument();
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it('keeps malformed assessment data visible without replacing it with empty lists', () => {
    const answer = '{"concerns":null,"items":[],"orders":[]}';
    const props = createProps('encounterAssessment', { response: { answer } });
    renderWithTheme(<EncounterAssessmentField {...props} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The saved assessment answer could not be read.'
    );
    expect(screen.getByText(answer)).toBeInTheDocument();
    expect(props.onResponse).not.toHaveBeenCalled();
  });
});

describe('registerEncounterFieldTypes', () => {
  it('registers both encounter editors idempotently and retains host overrides', () => {
    registerEncounterFieldTypes();
    expect(getFieldComponent('encounterVitals')).toBe(EncounterVitalsField);
    expect(getFieldComponent('encounterAssessment')).toBe(
      EncounterAssessmentField
    );
    const hostEditor = () => <div>Host vitals</div>;
    registerFieldComponents({ encounterVitals: hostEditor });
    registerEncounterFieldTypes();
    registerEncounterFieldTypes();
    expect(getFieldComponent('encounterVitals')).toBe(hostEditor);
    expect(getFieldComponent('encounterAssessment')).toBe(
      EncounterAssessmentField
    );
    registerFieldComponents({ encounterVitals: EncounterVitalsField });
  });
});
