import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssessmentOrder } from '../Assessment';
import { createFormStore, type FieldDefinition } from '@esheet/core';
import type { FieldResponse } from '@esheet/core';
import { EncounterConditionsField } from './EncounterConditionsField';
import { EncounterPlanField } from './EncounterPlanField';
import { EncounterAssessmentField } from './EncounterAssessmentField';
import {
  conditionPick,
  hypertensionConcern,
  labPick,
  renderClinicalField,
} from './clinicalFieldTestUtils';

interface PlanValue {
  orders: AssessmentOrder[];
}

const codedOrder: AssessmentOrder = {
  orderId: 'a1c',
  type: 'lab',
  display: 'Hemoglobin A1c',
  concernId: 'hypertension',
  code: { fullid: 'LOINC|4548-4', codetype: 'LOINC', fullcode: '4548-4' },
};

function renderPlan(
  initialValue?: unknown,
  options: Parameters<typeof renderClinicalField>[3] = {}
) {
  return renderClinicalField(
    EncounterPlanField,
    'encounterPlan',
    initialValue,
    {
      pick: labPick,
      ...options,
    }
  );
}

describe('EncounterPlanField', () => {
  it('captures a real coded order using the shared Assessment plan editor', () => {
    const { latest, lookupProps } = renderPlan();
    expect(
      screen.getByRole('form', { name: 'Add plan order' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('What to add')).toHaveValue('order');
    expect(lookupProps()).toMatchObject({
      indexUrl: '/clinical-codify',
      domains: ['med', 'lab', 'procedure', 'vaccine'],
      clearOnSelect: true,
    });
    // Stock Assessment supports free-text orders alongside coded picks.
    expect(lookupProps().onFreeText).toBeTypeOf('function');
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest<PlanValue>().orders).toEqual([
      {
        orderId: expect.any(String),
        type: 'lab',
        display: 'Hemoglobin A1c',
        code: codedOrder.code,
      },
    ]);
    expect(
      screen.getByRole('region', { name: 'Orders not linked to a concern' })
    ).toHaveTextContent('Hemoglobin A1c');
    expect(latest<PlanValue>()).not.toHaveProperty('concerns');
  });

  it('links a selected coded order to the canonical condition without duplicating condition state', () => {
    const { latest, form, lookupProps } = renderPlan(undefined, {
      seedConcerns: [hypertensionConcern],
    });
    const originalCondition = form.getState().responses.conditions;
    fireEvent.click(screen.getByRole('button', { name: 'Add order' }));
    const formRegion = screen.getByRole('form', {
      name: 'Add order for Essential hypertension',
    });
    fireEvent.change(within(formRegion).getByLabelText('Order type filter'), {
      target: { value: 'lab' },
    });
    expect(lookupProps().domains).toEqual(['lab']);
    fireEvent.click(
      within(formRegion).getByRole('button', { name: 'Pick coded finding' })
    );
    expect(latest<PlanValue>().orders[0]).toMatchObject({
      concernId: 'hypertension',
      type: 'lab',
      code: codedOrder.code,
    });
    expect(latest<PlanValue>()).not.toHaveProperty('concerns');
    expect(form.getState().responses.conditions).toEqual(originalCondition);
    expect(
      screen.queryByRole('region', { name: 'Orders not linked to a concern' })
    ).not.toBeInTheDocument();
  });

  it('edits detail and display through the healthcare order editor while preserving coding and indication links', () => {
    const { latest } = renderPlan(
      { orders: [codedOrder] },
      { seedConcerns: [hypertensionConcern] }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Order description'), {
      target: { value: 'Hemoglobin A1c follow-up' },
    });
    fireEvent.change(screen.getByLabelText('Order detail'), {
      target: { value: 'Repeat in 3 months' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(latest<PlanValue>().orders).toEqual([
      {
        ...codedOrder,
        display: 'Hemoglobin A1c follow-up',
        detail: 'Repeat in 3 months',
      },
    ]);
  });

  it('can link an existing coded order using the native Move to condition control', () => {
    const { latest } = renderPlan(
      { orders: [{ ...codedOrder, concernId: undefined }] },
      { seedConcerns: [hypertensionConcern] }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Move Hemoglobin A1c' })
    );
    fireEvent.click(
      screen.getByRole('menuitem', { name: 'Move to: Essential hypertension' })
    );
    expect(latest<PlanValue>().orders[0]).toEqual(codedOrder);
  });

  it('keeps a drop-linked order attached to its new concern when the same drop also reorders', () => {
    const unlinked: AssessmentOrder = {
      orderId: 'bmp',
      type: 'lab',
      display: 'Basic metabolic panel',
      code: { fullid: 'LOINC|51990-0', codetype: 'LOINC', fullcode: '51990-0' },
    };
    const { latest } = renderPlan(
      { orders: [codedOrder, unlinked] },
      { seedConcerns: [hypertensionConcern] }
    );
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: () => {},
      getData: () => 'bmp',
    };
    fireEvent.dragStart(
      screen
        .getByText('Basic metabolic panel')
        .closest('[draggable="true"]') as HTMLElement,
      { dataTransfer }
    );
    fireEvent.drop(
      screen
        .getByText('Hemoglobin A1c')
        .closest('[draggable="true"]') as HTMLElement,
      { dataTransfer }
    );
    // One drop fires onLinkOrder then onReorderOrders synchronously; the
    // reorder commit must build on the link commit, not the stale value.
    const { orders } = latest<PlanValue>();
    expect(orders.map((order) => order.orderId)).toEqual(['bmp', 'a1c']);
    expect(orders.find((order) => order.orderId === 'bmp')).toMatchObject({
      concernId: 'hypertension',
    });
  });

  it('removes an order without mutating conditions or other coded orders', () => {
    const other = {
      ...codedOrder,
      orderId: 'another',
      display: 'Another laboratory order',
    };
    const { latest, form } = renderPlan(
      { orders: [codedOrder, other] },
      { seedConcerns: [hypertensionConcern] }
    );
    const originalCondition = form.getState().responses.conditions;
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(latest<PlanValue>().orders).toEqual([other]);
    expect(form.getState().responses.conditions).toEqual(originalCondition);
  });

  it('updates condition projections reactively after a coded condition changes', () => {
    const { form, onResponse } = renderPlan(
      { orders: [codedOrder] },
      { seedConcerns: [hypertensionConcern] }
    );
    act(() =>
      form.getState().setResponse('conditions', {
        answer: JSON.stringify({
          concerns: [
            {
              ...hypertensionConcern,
              assertions: [
                ...hypertensionConcern.assertions,
                {
                  ...hypertensionConcern.assertions[0],
                  id: 'revised',
                  text: 'Hypertensive heart disease',
                  coding: [{ system: 'ICD10', code: 'I11.9' }],
                },
              ],
            },
          ],
        }),
      })
    );
    expect(screen.getByText('Hypertensive heart disease')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
  });

  it('skips sibling assessment items with malformed notes instead of rendering them', () => {
    const form = createFormStore();
    form.getState().loadDefinition({
      id: 'coded-visit',
      pages: [
        {
          id: 'visit',
          fields: [
            { id: 'assessment', fieldType: 'encounterAssessment' },
          ] as unknown as FieldDefinition[],
        },
      ],
    });
    form.getState().setResponse('assessment', {
      answer: JSON.stringify({
        concerns: [hypertensionConcern],
        items: [
          {
            concernId: hypertensionConcern.concernId,
            assertionId: hypertensionConcern.assertions[0].id,
            note: {},
          },
        ],
        orders: [],
      }),
    });
    const { onResponse } = renderPlan(
      { orders: [codedOrder] },
      { props: { form } }
    );
    // The concern projects from its current assertion; the malformed item is
    // never handed to Assessment (which renders item.note as a React child).
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
  });

  it.each([{ isPreview: false }, { isEnabled: false }, { isReadOnly: true }])(
    'retains coded orders and prevents edits in eSheet state %j',
    (props) => {
      const { onResponse, Lookup } = renderPlan(
        { orders: [codedOrder] },
        { props }
      );
      expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(Lookup).not.toHaveBeenCalled();
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it('rejects a delayed pick after the form is frozen for save', () => {
    const { form, lookupProps, onResponse } = renderPlan();
    const delayedPick = lookupProps().onSelect;
    act(() => form.getState().setReadOnly(true));
    act(() => delayedPick?.(labPick));
    expect(onResponse).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('infers the order type from the coding system for any catalog pick', () => {
    const { latest, lookupProps } = renderPlan();
    act(() => lookupProps().onSelect?.(conditionPick));
    expect(latest<PlanValue>().orders[0]).toMatchObject({
      type: 'procedure',
      display: 'Essential hypertension',
      code: { codetype: 'ICD10', fullcode: 'I10' },
    });
  });

  it('keeps imported uncoded plan entries readable and editable without a catalog', () => {
    const { latest, onResponse } = renderPlan(
      { orders: [{ ...codedOrder, code: undefined }] },
      { provider: false }
    );
    expect(screen.getByText('Hemoglobin A1c')).toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Order detail'), {
      target: { value: 'Imported plan reviewed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(latest<PlanValue>().orders[0]).toMatchObject({
      detail: 'Imported plan reviewed',
    });
    expect(latest<PlanValue>().orders[0]).not.toHaveProperty('code');
    // Without a search provider the add row falls back to plain free text.
    const freeText = screen.getByLabelText('Add as free text');
    fireEvent.change(freeText, { target: { value: 'Repeat A1c in 3 months' } });
    fireEvent.keyDown(freeText, { key: 'Enter' });
    expect(latest<PlanValue>().orders[1]).toMatchObject({
      display: 'Repeat A1c in 3 months',
    });
    expect(latest<PlanValue>().orders[1]).not.toHaveProperty('code');
  });

  it('retains malformed original answers and prevents replacing them', () => {
    const { onResponse, Lookup } = renderPlan(undefined, {
      initialAnswer: '{"orders":[{"type":"wrong"}]}',
    });
    expect(screen.getByRole('alert')).toHaveTextContent('"type":"wrong"');
    expect(Lookup).not.toHaveBeenCalled();
    expect(onResponse).not.toHaveBeenCalled();
  });
});

describe('EncounterAssessmentField coded capture', () => {
  it('captures diagnosis codes through the shared Assessment add row', () => {
    const { latest, lookupProps } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment'
    );
    expect(
      screen.getByRole('form', { name: 'Add assessment or order' })
    ).toBeInTheDocument();
    // Stock Assessment supports free-text concerns alongside coded picks.
    expect(lookupProps().onFreeText).toBeTypeOf('function');
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(
      latest<{ concerns: (typeof hypertensionConcern)[] }>().concerns[0]
        .assertions[0].coding
    ).toEqual([
      { system: 'ICD10', code: 'I10', display: 'Essential hypertension' },
    ]);
  });

  it('accepts diagnosis picks in the unified auto add mode without a domain restriction', () => {
    const { latest, lookupProps } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment'
    );
    fireEvent.change(screen.getByLabelText('What to add'), {
      target: { value: 'auto' },
    });
    expect(lookupProps().domains).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(
      latest<{ concerns: (typeof hypertensionConcern)[] }>().concerns[0]
        .assertions[0].coding
    ).toEqual([
      { system: 'ICD10', code: 'I10', display: 'Essential hypertension' },
    ]);
  });

  it('assesses an existing native condition by coded identity without copying its concerns', () => {
    const { latest, form } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      undefined,
      { seedConcerns: [hypertensionConcern] }
    );
    const originalConditions = form.getState().responses.conditions;
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest()).toEqual({
      concerns: [],
      items: [
        { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
      ],
      orders: [],
    });
    expect(form.getState().responses.conditions).toEqual(originalConditions);
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pick coded finding' }));
    expect(latest<{ items: unknown[] }>().items).toHaveLength(1);
  });

  it('drops the orphaned local concern when its assessment row is removed', () => {
    const uncodedConcern = {
      ...hypertensionConcern,
      source: 'manuallyAdded' as const,
      assertions: [{ ...hypertensionConcern.assertions[0], coding: undefined }],
    };
    const { latest } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      {
        concerns: [uncodedConcern],
        items: [
          { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
        ],
        orders: [codedOrder],
      }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Essential hypertension from assessment',
      })
    );
    // The uncoded record must not stay behind in concerns, where it would
    // block Save on required coding with no visible row to repair.
    expect(latest()).toEqual({
      concerns: [],
      items: [],
      orders: [{ ...codedOrder, concernId: undefined }],
    });
  });

  it('unlinks plan orders that referenced a removed assessment-created concern', () => {
    const form = createFormStore();
    form.getState().loadDefinition({
      id: 'coded-visit',
      pages: [
        {
          id: 'visit',
          fields: [
            { id: 'plan', fieldType: 'encounterPlan' },
          ] as unknown as FieldDefinition[],
        },
      ],
    });
    form.getState().setResponse('plan', {
      answer: JSON.stringify({
        orders: [
          {
            orderId: 'ecg',
            type: 'procedure',
            display: 'Electrocardiogram',
            concernId: 'hypertension',
          },
        ],
      }),
    });
    renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      {
        concerns: [hypertensionConcern],
        items: [
          { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
        ],
        orders: [],
      },
      { props: { form } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remove Essential hypertension from assessment',
      })
    );
    // The visit-level validator requires plan orders to link to an existing
    // concern, so the dangling reference must be cleared to keep Save open.
    expect(JSON.parse(form.getState().responses.plan!.answer!)).toEqual({
      orders: [
        { orderId: 'ecg', type: 'procedure', display: 'Electrocardiogram' },
      ],
    });
  });

  it.each(['ICD-10-CM', 'http://hl7.org/fhir/sid/icd-10-cm'])(
    'reuses imported canonical condition codes from system %s',
    (system) => {
      const { latest } = renderClinicalField(
        EncounterAssessmentField,
        'encounterAssessment',
        undefined,
        {
          seedConcerns: [
            {
              ...hypertensionConcern,
              assertions: [
                {
                  ...hypertensionConcern.assertions[0],
                  coding: [{ system, code: 'I10' }],
                },
              ],
            },
          ],
        }
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Pick coded finding' })
      );
      expect(latest<{ concerns: unknown[]; items: unknown[] }>()).toMatchObject(
        {
          concerns: [],
          items: [
            {
              concernId: 'hypertension',
              assertionId: 'hypertension-assertion',
            },
          ],
        }
      );
    }
  );

  it('preserves the recorded external assessment assertion until the refined condition is explicitly selected', () => {
    const assessmentValue = {
      concerns: [],
      items: [
        { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
      ],
      orders: [],
    };
    const { form, onResponse, latest, lookupProps } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      assessmentValue,
      { seedConcerns: [hypertensionConcern] }
    );
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    act(() =>
      form.getState().setResponse('conditions', {
        answer: JSON.stringify({
          concerns: [
            {
              ...hypertensionConcern,
              assertions: [
                ...hypertensionConcern.assertions,
                {
                  ...hypertensionConcern.assertions[0],
                  id: 'hypertension-refined',
                  text: 'Hypertensive heart disease',
                  changeType: 'refinement',
                  supersedes: 'hypertension-assertion',
                  coding: [{ system: 'ICD-10-CM', code: 'I11.9' }],
                },
              ],
            },
          ],
        }),
      })
    );
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(
      screen.queryByText('Hypertensive heart disease')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
    expect(assessmentValue.items).toEqual([
      { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
    ]);

    act(() =>
      lookupProps().onSelect?.({
        ...conditionPick,
        fullid: 'ICD10|I11.9',
        fullcode: 'I11.9',
        label: 'Hypertensive heart disease',
      })
    );
    expect(latest()).toEqual({
      concerns: [],
      items: [
        { concernId: 'hypertension', assertionId: 'hypertension-refined' },
      ],
      orders: [],
    });
    expect(screen.getByText('Hypertensive heart disease')).toBeInTheDocument();
    expect(
      screen.queryByText('Essential hypertension')
    ).not.toBeInTheDocument();
  });

  it('displays the locally recorded imported assertion when a canonical Conditions record shares its IDs', () => {
    const localAssessment = {
      concerns: [hypertensionConcern],
      items: [
        { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
      ],
      orders: [],
    };
    const { onResponse } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      localAssessment,
      {
        seedConcerns: [
          {
            ...hypertensionConcern,
            assertions: [
              {
                ...hypertensionConcern.assertions[0],
                text: 'Externally updated condition',
                coding: [{ system: 'ICD-10-CM', code: 'I11.9' }],
              },
            ],
          },
        ],
      }
    );
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    expect(screen.getByText('(I10)')).toBeInTheDocument();
    expect(
      screen.queryByText('Externally updated condition')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('(I11.9)')).not.toBeInTheDocument();
    expect(onResponse).not.toHaveBeenCalled();
    expect(localAssessment.concerns[0]).toEqual(hypertensionConcern);
  });

  it('drops to order-only capture with a notice when the host provides no encounter date', () => {
    const { lookupProps } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      { concerns: [], items: [], orders: [] },
      { encounterDate: null }
    );
    // New diagnoses would create undated assertions — the affordance is
    // removed and the add row collapses to orders only.
    expect(
      screen.getByText(/No encounter date — new diagnoses are disabled/)
    ).toBeInTheDocument();
    const modeSelect = screen.getByLabelText('What to add');
    expect(within(modeSelect).getAllByRole('option')).toHaveLength(1);
    expect(
      within(modeSelect).getByRole('option', { name: 'Add order' })
    ).toBeInTheDocument();
    expect(lookupProps().domains).not.toContain('condition');
  });

  it('falls back to a free-text add row without a coding provider and keeps uncoded per-problem orders', () => {
    const { latest } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment',
      {
        concerns: [hypertensionConcern],
        items: [
          { concernId: 'hypertension', assertionId: 'hypertension-assertion' },
        ],
        orders: [],
      },
      { provider: false }
    );
    expect(screen.getByText('Essential hypertension')).toBeInTheDocument();
    // Without a catalog the unified add row still captures plain free text.
    const freeText = screen.getByLabelText('Add as free text');
    fireEvent.change(freeText, {
      target: { value: 'Smoking cessation referral' },
    });
    fireEvent.keyDown(freeText, { key: 'Enter' });
    // Auto mode asks what the text is; file it as an order.
    fireEvent.click(
      within(
        screen.getByRole('group', { name: /smoking cessation referral/i })
      ).getByRole('button', { name: 'Order' })
    );
    expect(
      latest<{ orders: Record<string, unknown>[] }>().orders[0]
    ).toMatchObject({ display: 'Smoking cessation referral' });
    expect(
      latest<{ orders: Record<string, unknown>[] }>().orders[0]
    ).not.toHaveProperty('code');
    // The per-problem order form still allows plain-text orders.
    fireEvent.click(screen.getByRole('button', { name: 'Add order' }));
    const orderForm = screen.getByRole('form', { name: /add order for/i });
    fireEvent.change(within(orderForm).getByLabelText('Order description'), {
      target: { value: 'Lifestyle counseling' },
    });
    fireEvent.click(within(orderForm).getByRole('button', { name: 'Add' }));
    expect(
      latest<{ orders: Record<string, unknown>[] }>().orders[1]
    ).toMatchObject({
      concernId: 'hypertension',
      display: 'Lifestyle counseling',
    });
  });
});

describe('clinical native response metadata', () => {
  it.each([
    {
      component: EncounterConditionsField,
      fieldType: 'encounterConditions',
      empty: { concerns: [] },
      pick: conditionPick,
    },
    {
      component: EncounterPlanField,
      fieldType: 'encounterPlan',
      empty: { orders: [] },
      pick: labPick,
    },
    {
      component: EncounterAssessmentField,
      fieldType: 'encounterAssessment',
      empty: { concerns: [], items: [], orders: [] },
      pick: conditionPick,
    },
  ])(
    'preserves host response extensions and marks $fieldType human edits explicitly',
    ({ component, fieldType, empty, pick }) => {
      const original: FieldResponse = {
        answer: JSON.stringify(empty),
        attributes: { hostExtension: 'original', provenance: 'retained' },
        signatureData: 'opaque-host-payload',
        selected: { id: 'stale', value: 'Unrelated option' },
        _ai: true,
      };
      const { form, onResponse, lookupProps } = renderClinicalField(
        component,
        fieldType,
        undefined,
        { initialResponse: original, pick }
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Pick coded finding' })
      );
      const first = onResponse.mock.calls.at(-1)![0] as FieldResponse;
      expect(first).toMatchObject({
        attributes: original.attributes,
        signatureData: 'opaque-host-payload',
        _ai: false,
      });
      expect(first.answer).not.toBe(original.answer);
      expect(first).not.toHaveProperty('selected');
      act(() =>
        form.getState().setResponse('test-field', {
          ...first,
          attributes: {
            ...first.attributes,
            hostExtension: 'live-host-update',
          },
          _ai: true,
        })
      );
      // A distinct code — Conditions ignores a pick matching an existing concern.
      act(() =>
        lookupProps().onSelect?.({
          ...pick,
          fullid: `${pick.codetype}|${pick.fullcode}0`,
          fullcode: `${pick.fullcode}0`,
        })
      );
      const edited = onResponse.mock.calls.at(-1)![0] as FieldResponse;
      expect(edited).toMatchObject({
        attributes: {
          hostExtension: 'live-host-update',
          provenance: 'retained',
        },
        signatureData: 'opaque-host-payload',
        _ai: false,
      });
      expect(original.attributes).toEqual({
        hostExtension: 'original',
        provenance: 'retained',
      });
    }
  );
});

describe('free-text clinical capture through the shared add row', () => {
  it('captures a free-text plan order as an uncoded procedure', () => {
    const { latest, lookupProps } = renderClinicalField(
      EncounterPlanField,
      'encounterPlan'
    );
    act(() => lookupProps().onFreeText?.('Explicitly entered clinical text'));
    const value = latest<{ orders: Record<string, unknown>[] }>();
    expect(value.orders[0]).toMatchObject({
      type: 'procedure',
      display: 'Explicitly entered clinical text',
    });
    expect(JSON.stringify(value)).not.toContain('coding');
  });

  it('asks what free text is in the assessment auto mode and records a concern', () => {
    const { latest, lookupProps } = renderClinicalField(
      EncounterAssessmentField,
      'encounterAssessment'
    );
    act(() => lookupProps().onFreeText?.('Explicitly entered clinical text'));
    fireEvent.click(screen.getByRole('button', { name: 'Concern' }));
    const value = latest<{ concerns: Record<string, unknown>[] }>();
    expect(value.concerns).toHaveLength(1);
    expect(JSON.stringify(value)).toContain('Explicitly entered clinical text');
    expect(JSON.stringify(value)).not.toContain('coding');
  });
});

describe('clinical translation ownership', () => {
  it.each([
    {
      component: EncounterPlanField,
      fieldType: 'encounterPlan',
      label: 'Add plan order',
    },
    {
      component: EncounterAssessmentField,
      fieldType: 'encounterAssessment',
      label: 'Add assessment or order',
    },
  ])(
    'translates $fieldType labels and search prompts exactly once',
    ({ component, fieldType, label }) => {
      const translate = vi.fn((message: string) => `localized ${message}`);
      const { lookupProps } = renderClinicalField(
        component,
        fieldType,
        undefined,
        { messages: { translate } }
      );
      expect(
        screen.getByRole('form', { name: `localized ${label}` })
      ).toBeInTheDocument();
      const placeholder = lookupProps().placeholder;
      expect(placeholder).toMatch(/^localized /);
      expect(placeholder).not.toMatch(/^localized localized /);
      expect(
        translate.mock.calls.some(([message]) =>
          message.startsWith('localized ')
        )
      ).toBe(false);
    }
  );
});
