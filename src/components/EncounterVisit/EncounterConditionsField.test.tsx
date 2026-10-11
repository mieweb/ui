import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EncounterConditionsField } from './EncounterConditionsField';
import type { ConditionConcern } from '../ProblemList';
import {
  conditionPick,
  hypertensionConcern,
  renderClinicalField,
} from './clinicalFieldTestUtils';

interface ConditionsValue {
  concerns: ConditionConcern[];
}

function renderConditions(
  ...args: Parameters<typeof renderClinicalField> extends [
    unknown,
    unknown,
    ...infer Tail,
  ]
    ? Tail
    : never
) {
  return renderClinicalField(
    EncounterConditionsField,
    'encounterConditions',
    ...args
  );
}

describe('EncounterConditionsField', () => {
  it('captures a selected real diagnosis code in the shared ProblemList model', () => {
    const { latest, lookupProps, container } = renderConditions();
    expect(lookupProps()).toMatchObject({
      indexUrl: '/clinical-codify',
      domains: ['condition'],
      preferCodetypes: ['ICD10'],
      clearOnSelect: true,
    });
    expect(lookupProps().onFreeText).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    const value = latest<ConditionsValue>();
    expect(value.concerns).toHaveLength(1);
    expect(value.concerns[0]).toMatchObject({
      clinicalStatus: 'active',
      source: 'manuallyAdded',
      assertions: [
        {
          text: 'Essential hypertension',
          verificationStatus: 'unconfirmed',
          coding: [{ system: 'ICD10', code: 'I10', primary: true }],
        },
      ],
    });
    expect(
      container.querySelector('[data-slot="clinical-list-row"]')
    ).toBeInTheDocument();
    expect(screen.getByText('(I10)')).toBeInTheDocument();
  });

  it('refines a diagnosis with a new coded assertion and preserves its history and durable identity', () => {
    const { latest } = renderConditions(
      { concerns: [hypertensionConcern] },
      {
        pick: {
          ...conditionPick,
          fullid: 'ICD10|I11.9',
          fullcode: 'I11.9',
          label: 'Hypertensive heart disease without heart failure',
        },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: /refine/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    const concern = latest<ConditionsValue>().concerns[0];
    expect(concern.concernId).toBe('hypertension');
    expect(concern.assertions[0]).toEqual(hypertensionConcern.assertions[0]);
    expect(concern.assertions[1]).toMatchObject({
      changeType: 'refinement',
      supersedes: 'hypertension-assertion',
      text: 'Hypertensive heart disease without heart failure',
      coding: [{ system: 'ICD10', code: 'I11.9' }],
    });
    expect(
      screen.getByRole('button', { name: '2 assertions' })
    ).toBeInTheDocument();
  });

  it('resolves a coded condition without losing its coding', () => {
    const { latest } = renderConditions({ concerns: [hypertensionConcern] });
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }));
    expect(latest<ConditionsValue>().concerns[0]).toEqual({
      ...hypertensionConcern,
      clinicalStatus: 'resolved',
    });
    expect(
      screen.getByRole('region', { name: 'Resolved' })
    ).toBeInTheDocument();
  });

  it('does not duplicate a current condition when its code is selected again', () => {
    const { latest } = renderConditions({ concerns: [hypertensionConcern] });
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest<ConditionsValue>().concerns).toEqual([hypertensionConcern]);
  });

  it('does not duplicate a native canonical ICD-10-CM condition when selected from the lookup', () => {
    const imported = {
      ...hypertensionConcern,
      assertions: [
        {
          ...hypertensionConcern.assertions[0],
          coding: [{ system: 'ICD-10-CM', code: 'I10' }],
        },
      ],
    };
    const { latest } = renderConditions({ concerns: [imported] });
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest<ConditionsValue>().concerns).toEqual([imported]);
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'retains display and prevents edits in eSheet state %j',
    (props) => {
      const { onResponse, Lookup } = renderConditions(
        { concerns: [hypertensionConcern] },
        { props }
      );
      expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(Lookup).not.toHaveBeenCalled();
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it('rejects a delayed code pick after the form is frozen for save', () => {
    const { form, lookupProps, onResponse } = renderConditions();
    const delayedPick = lookupProps().onSelect;
    act(() => form.getState().setReadOnly(true));
    act(() => delayedPick?.(conditionPick));
    expect(onResponse).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rejects malformed code picks and codes from the wrong clinical domain', () => {
    const { lookupProps, onResponse } = renderConditions();
    act(() => lookupProps().onSelect?.({ ...conditionPick, fullcode: '' }));
    act(() => lookupProps().onSelect?.({ ...conditionPick, domain: 'med' }));
    expect(onResponse).not.toHaveBeenCalled();
  });

  it('keeps imported uncoded conditions readable without offering an uncoded Add fallback', () => {
    const { onResponse } = renderConditions(
      {
        concerns: [
          {
            ...hypertensionConcern,
            assertions: [
              { ...hypertensionConcern.assertions[0], coding: undefined },
            ],
          },
        ],
      },
      { provider: false }
    );
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(
      screen.getByText(/coded condition search is unavailable/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
  });

  it('retains a malformed answer and prevents destructive replacement', () => {
    const { onResponse, Lookup } = renderConditions(undefined, {
      initialAnswer: '{"concerns":[{"coding":"wrong"}]}',
    });
    expect(screen.getByRole('alert')).toHaveTextContent('"coding":"wrong"');
    expect(screen.getByLabelText('Original Conditions answer')).toHaveAttribute(
      'tabindex',
      '0'
    );
    expect(Lookup).not.toHaveBeenCalled();
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe('explicit assertion date and uncoded condition configuration', () => {
  it('requires explicit date entry and records a historical encounter date without clock inference', () => {
    const { latest, Lookup } = renderConditions(undefined, {
      encounterDate: null,
    });
    expect(screen.getByLabelText('Assertion date')).toHaveValue('');
    expect(Lookup).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Assertion date'), {
      target: { value: '2020-02-29' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest<ConditionsValue>().concerns[0].assertions[0].date).toBe(
      '2020-02-29'
    );
  });
  it('rejects a delayed coded selection after the explicit date is cleared', () => {
    const { lookupProps, onResponse } = renderConditions();
    const delayed = lookupProps().onSelect;
    fireEvent.change(screen.getByLabelText('Assertion date'), {
      target: { value: '' },
    });
    act(() => delayed?.(conditionPick));
    expect(onResponse).not.toHaveBeenCalled();
  });
  it('allows an explicit uncoded condition through the proper condition editor when coding is optional', () => {
    const { latest } = renderConditions(undefined, {
      provider: false,
      requireCoding: false,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Other…' }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText(/Problem name/), {
      target: { value: 'Explicit uncoded symptom' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /save/i }));
    const assertion = latest<ConditionsValue>().concerns[0].assertions[0];
    expect(assertion.text).toBe('Explicit uncoded symptom');
    expect(assertion.coding).toEqual([]);
    expect(assertion.date).toBe('2026-10-10');
  });
});
