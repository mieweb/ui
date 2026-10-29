import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFormStore, type FieldDefinition } from '@esheet/core';
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
    // Stock ProblemList capture supports free text alongside coded picks.
    expect(lookupProps().onFreeText).toBeTypeOf('function');
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
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Pick coded finding' }));
    fireEvent.change(dialog.getByLabelText(/Problem name/), {
      target: { value: 'Hypertensive heart disease without heart failure' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /save/i }));
    const concern = latest<ConditionsValue>().concerns[0];
    expect(concern.concernId).toBe('hypertension');
    expect(concern.assertions[0]).toEqual(hypertensionConcern.assertions[0]);
    expect(concern.assertions[1]).toMatchObject({
      changeType: 'refinement',
      supersedes: 'hypertension-assertion',
      text: 'Hypertensive heart disease without heart failure',
      coding: expect.arrayContaining([
        expect.objectContaining({ system: 'ICD-10-CM', code: 'I11.9' }),
      ]),
    });
    expect(
      screen.getByRole('button', { name: '2 assertions' })
    ).toBeInTheDocument();
  });

  it('deletes a condition and its coding from the visit', () => {
    const { latest } = renderConditions({ concerns: [hypertensionConcern] });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(latest<ConditionsValue>().concerns).toEqual([]);
    expect(
      screen.queryByRole('region', { name: 'Unconfirmed' })
    ).not.toBeInTheDocument();
  });

  it('repairs assessment rows that referenced a deleted condition', () => {
    const form = createFormStore();
    form.getState().loadDefinition({
      id: 'coded-visit',
      pages: [
        {
          id: 'visit',
          fields: [
            { id: 'assessment', fieldType: 'encounterAssessment' },
            { id: 'local', fieldType: 'encounterAssessment' },
            { id: 'plan', fieldType: 'encounterPlan' },
          ] as unknown as FieldDefinition[],
        },
      ],
    });
    form.getState().setResponse('assessment', {
      answer: JSON.stringify({
        concerns: [],
        items: [
          { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
        ],
        orders: [
          {
            orderId: 'a1c',
            type: 'lab',
            display: 'Hemoglobin A1c',
            concernId: 'hypertension',
          },
        ],
      }),
    });
    // A local concern takes precedence over Conditions, so its references
    // stay valid after the Conditions entry is deleted.
    const localValue = {
      concerns: [hypertensionConcern],
      items: [
        { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
      ],
      orders: [],
    };
    form
      .getState()
      .setResponse('local', { answer: JSON.stringify(localValue) });
    // Plan links resolve against every section, so the surviving local
    // concern keeps this order linked after the Conditions entry is deleted.
    const planValue = {
      orders: [
        {
          orderId: 'ecg',
          type: 'procedure',
          display: 'Electrocardiogram',
          concernId: 'hypertension',
        },
      ],
    };
    form.getState().setResponse('plan', { answer: JSON.stringify(planValue) });
    renderConditions({ concerns: [hypertensionConcern] }, { props: { form } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(JSON.parse(form.getState().responses.assessment!.answer!)).toEqual({
      concerns: [],
      items: [],
      orders: [{ orderId: 'a1c', type: 'lab', display: 'Hemoglobin A1c' }],
    });
    expect(JSON.parse(form.getState().responses.local!.answer!)).toEqual(
      localValue
    );
    expect(JSON.parse(form.getState().responses.plan!.answer!)).toEqual(
      planValue
    );
  });

  it('ignores a code pick that matches an existing concern instead of duplicating it', () => {
    const { onResponse, lookupProps } = renderConditions({
      concerns: [hypertensionConcern],
    });
    act(() => lookupProps().onSelect?.(conditionPick));
    // ICD-10-CM aliases normalize to the same system identity as ICD10.
    act(() =>
      lookupProps().onSelect?.({ ...conditionPick, codetype: 'ICD-10-CM' })
    );
    expect(onResponse).not.toHaveBeenCalled();
  });

  it('keeps both updates when two commits land in the same event', () => {
    // The condition editor can add an observation and save an assertion from
    // one Save click — the second commit must build on the first, not the
    // stale render value.
    const { latest, lookupProps } = renderConditions();
    act(() => {
      lookupProps().onSelect?.(conditionPick);
      lookupProps().onSelect?.({
        ...conditionPick,
        fullid: 'ICD10|E11.9',
        fullcode: 'E11.9',
        label: 'Type 2 diabetes mellitus',
      });
    });
    expect(latest<ConditionsValue>().concerns).toHaveLength(2);
  });

  it('revising refutes the prior assertion while keeping it on the timeline', () => {
    const { latest } = renderConditions({ concerns: [hypertensionConcern] });
    fireEvent.click(screen.getByRole('button', { name: /revise/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText(/Problem name/), {
      target: { value: 'White coat hypertension' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /save/i }));
    const concern = latest<ConditionsValue>().concerns[0];
    expect(concern.assertions[0]).toMatchObject({
      id: 'hypertension-assertion',
      verificationStatus: 'refuted',
    });
    expect(concern.assertions[1]).toMatchObject({
      changeType: 'revision',
      supersedes: 'hypertension-assertion',
      text: 'White coat hypertension',
    });
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

  it('captures picks without usable codes as uncoded concerns', () => {
    const { latest, lookupProps } = renderConditions();
    act(() =>
      lookupProps().onSelect?.({ ...conditionPick, codetype: '', fullcode: '' })
    );
    const assertion = latest<ConditionsValue>().concerns[0].assertions[0];
    expect(assertion.text).toBe('Essential hypertension');
    expect(assertion).not.toHaveProperty('coding');
  });

  it('keeps imported uncoded conditions readable and captures free text through the list add row without a catalog', () => {
    const { latest } = renderConditions(
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
    // Without a catalog, ProblemList's own free-text add row takes over.
    const input = screen.getByLabelText('Add problem');
    fireEvent.change(input, { target: { value: 'New symptom' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const concerns = latest<ConditionsValue>().concerns;
    expect(concerns).toHaveLength(2);
    expect(concerns[1].assertions[0]).toMatchObject({
      text: 'New symptom',
      verificationStatus: 'unconfirmed',
      date: '2026-10-10',
    });
    expect(concerns[1].assertions[0]).not.toHaveProperty('coding');
  });

  it('retains a malformed answer and prevents destructive replacement', () => {
    const { onResponse, Lookup } = renderConditions(undefined, {
      initialAnswer: '{"concerns":[{"coding":"wrong"}]}',
    });
    expect(screen.getByRole('alert')).toHaveTextContent('"coding":"wrong"');
    expect(screen.getByLabelText('Original condition answer')).toHaveAttribute(
      'tabindex',
      '0'
    );
    expect(Lookup).not.toHaveBeenCalled();
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe('explicit assertion date and uncoded condition configuration', () => {
  it('ignores picks and free text when the host provides no encounter date', () => {
    const { lookupProps, onResponse } = renderConditions(undefined, {
      encounterDate: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    act(() => lookupProps().onFreeText?.('Undated symptom'));
    expect(onResponse).not.toHaveBeenCalled();
  });
  it('allows an explicit uncoded condition through the proper condition editor', () => {
    const { latest } = renderConditions(undefined, { provider: false });
    // Two 'Add' buttons without a catalog: the free-text row's (disabled while
    // empty) and the editor pill — click the enabled editor pill.
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Add' })
        .find((button) => !(button as HTMLButtonElement).disabled)!
    );
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
  it('preserves the condition editor changeType instead of forcing refinement', () => {
    const { latest } = renderConditions(
      { concerns: [hypertensionConcern] },
      { provider: false }
    );
    fireEvent.click(screen.getByRole('button', { name: /refine/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByLabelText(/Disease progressed/));
    fireEvent.change(dialog.getByLabelText(/Problem name/), {
      target: { value: 'Hypertensive heart disease' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /save/i }));
    const concern = latest<ConditionsValue>().concerns[0];
    expect(concern.concernId).toBe('hypertension');
    expect(concern.assertions[1]).toMatchObject({
      text: 'Hypertensive heart disease',
      changeType: 'progression',
      supersedes: 'hypertension-assertion',
    });
  });
  it('records an uncoded refinement through the condition editor when a catalog is available', () => {
    const { latest } = renderConditions({ concerns: [hypertensionConcern] });
    fireEvent.click(screen.getByRole('button', { name: /refine/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText(/Problem name/), {
      target: { value: 'Uncoded refinement' },
    });
    fireEvent.click(dialog.getByRole('button', { name: /save/i }));
    const value = latest<ConditionsValue>();
    expect(value.concerns).toHaveLength(1);
    expect(value.concerns[0].concernId).toBe('hypertension');
    expect(value.concerns[0].assertions[1]).toMatchObject({
      text: 'Uncoded refinement',
      changeType: 'refinement',
      supersedes: 'hypertension-assertion',
    });
  });
});
