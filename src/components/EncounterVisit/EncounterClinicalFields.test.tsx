import * as React from 'react';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
  type FieldResponse,
} from '@esheet/core';
import { renderWithTheme } from '../../test/test-utils';
import { CodeLookupProvider } from '../CodeLookup/context';
import type { CodeLookupProps } from '../CodeLookup/CodeLookup';
import type { CodifyResult } from '../CodeLookup/engine';
import { EncounterMedicationField } from './EncounterMedicationField';
import { EncounterAllergyField } from './EncounterAllergyField';
import { MedicationReconciliation } from '../MedicationList';
import { AllergyManager } from '../AllergyList';

function Catalog(props: CodeLookupProps): React.JSX.Element {
  const isSubstance = props.domains?.includes('condition');
  return (
    <div aria-label={props.placeholder}>
      <span data-testid="catalog-domain">{props.domains?.join(',')}</span>
      <span data-testid="catalog-system">
        {props.searchCodetypes?.join(',')}
      </span>
      <button
        type="button"
        onClick={() =>
          props.onSelect?.({
            fullid: isSubstance ? 'SNOMED US|762952008' : 'RxNORM|314076',
            label: isSubstance ? 'Peanut substance' : 'lisinopril 10 mg tablet',
            codetype: isSubstance ? 'SNOMED US' : 'RxNORM',
            fullcode: isSubstance ? '762952008' : '314076',
            domain: isSubstance ? 'condition' : 'med',
            score: 1,
            viaAlias: false,
          })
        }
      >
        Select {isSubstance ? 'substance' : 'medication'} result
      </button>
      <button
        type="button"
        onClick={() =>
          props.onSelect?.({
            fullid: '',
            label: 'Incomplete catalog item',
            codetype: '',
            fullcode: '',
            domain: 'med',
            score: 1,
            viaAlias: false,
          })
        }
      >
        Select incomplete result
      </button>
      {props.onFreeText && (
        <button
          type="button"
          onClick={() => props.onFreeText?.('Unknown drug')}
        >
          Use free text
        </button>
      )}
    </div>
  );
}

function fieldProps(
  fieldType: string,
  overrides: Partial<FieldComponentProps> = {},
  requireCoding = true
): FieldComponentProps {
  return {
    field: {
      definition: {
        id: 'clinical-field',
        fieldType,
        _sourceData: { encounterRequireCoding: requireCoding },
        question:
          fieldType === 'encounterMedications' ? 'Medications' : 'Allergies',
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

function renderField(
  Component: React.ComponentType<FieldComponentProps>,
  fieldType: string,
  value?: unknown,
  options: {
    catalog?: boolean;
    requireCoding?: boolean;
    response?: FieldResponse;
    fieldProps?: Partial<FieldComponentProps>;
  } = {}
) {
  const onResponse = vi.fn();
  function Harness() {
    const [response, setResponse] = React.useState<FieldResponse | undefined>(
      options.response ??
        (value === undefined ? undefined : { answer: JSON.stringify(value) })
    );
    const field = (
      <Component
        {...fieldProps(fieldType, options.fieldProps, options.requireCoding)}
        response={response}
        onResponse={(next) => {
          onResponse(next);
          setResponse(next);
        }}
      />
    );
    return options.catalog === false ? (
      field
    ) : (
      <CodeLookupProvider component={Catalog} indexUrl="/test-catalog">
        {field}
      </CodeLookupProvider>
    );
  }
  const rendered = renderWithTheme(<Harness />);
  const latest = <T,>(): T =>
    JSON.parse(onResponse.mock.calls.at(-1)![0].answer);
  return { ...rendered, onResponse, latest };
}

describe('Encounter coded clinical fields', () => {
  it('adds coded medications through the inline catalog search and retains the selected code and native metadata', () => {
    const { onResponse, latest } = renderField(
      EncounterMedicationField,
      'encounterMedications',
      undefined,
      {
        response: {
          answer: '{"medications":[],"hostExtension":"retained"}',
          attributes: { host: 'retained' },
          selected: { id: 'stale', value: 'Stale selection' },
          _ai: true,
        },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(screen.queryByRole('button', { name: 'Use free text' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select incomplete result' })
    );
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select medication result' })
    );
    expect(latest()).toMatchObject({
      hostExtension: 'retained',
      medications: [
        {
          name: 'lisinopril 10 mg tablet',
          status: 'unreconciled',
          strength: '10 mg',
          doseForm: 'tablet',
          code: {
            system: 'RxNORM',
            code: '314076',
            display: 'lisinopril 10 mg tablet',
          },
        },
      ],
    });
    expect(onResponse.mock.calls.at(-1)![0]).toMatchObject({
      attributes: { host: 'retained' },
      _ai: false,
    });
    expect(onResponse.mock.calls.at(-1)![0]).not.toHaveProperty('selected');
  });

  it('holds inline prescription details in a local draft until a catalog pick names and codes the medication', () => {
    const { onResponse, latest } = renderField(
      EncounterMedicationField,
      'encounterMedications'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const sig = screen.getByLabelText('Sig (patient directions)');
    sig.innerHTML = '<p>1 tablet by mouth daily</p>';
    fireEvent.input(sig);
    expect(onResponse).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select medication result' })
    );
    expect(onResponse).toHaveBeenCalledOnce();
    expect(latest()).toMatchObject({
      medications: [
        {
          name: 'lisinopril 10 mg tablet',
          code: { system: 'RxNORM', code: '314076' },
          route: 'oral',
          frequency: 'Once daily',
          sig: '1 tablet by mouth daily',
        },
      ],
    });
  });

  it('records explicit no-known-allergies and replaces it with a coded allergen without losing the addition', () => {
    const { onResponse, latest } = renderField(
      EncounterAllergyField,
      'encounterAllergies'
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'No known allergies (NKA)' })
    );
    expect(latest()).toEqual({ allergies: [], noKnownAllergies: true });
    fireEvent.click(screen.getByRole('button', { name: 'Add allergy' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select incomplete result' })
    );
    expect(onResponse).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select medication result' })
    );
    expect(latest()).toMatchObject({
      allergies: [
        {
          allergen: 'lisinopril 10 mg tablet',
          type: 'drug',
          code: { system: 'RxNORM', code: '314076' },
        },
      ],
    });
    expect(latest()).not.toHaveProperty('noKnownAllergies');
    expect(screen.queryByText('No known allergies (NKA)')).toBeNull();
  });

  it('codes non-drug allergens through SNOMED substance search in the inline allergy card', () => {
    const { onResponse, latest } = renderField(
      EncounterAllergyField,
      'encounterAllergies'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add allergy' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('combobox', { name: 'Type' }));
    fireEvent.click(screen.getByRole('option', { name: 'Food' }));
    expect(screen.getByTestId('catalog-domain')).toHaveTextContent('condition');
    expect(screen.getByTestId('catalog-system')).toHaveTextContent('SNOMED US');
    expect(onResponse).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Use free text' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Select substance result' })
    );
    fireEvent.change(screen.getByLabelText('Reaction'), {
      target: { value: 'Hives' },
    });
    expect(latest()).toMatchObject({
      allergies: [
        {
          allergen: 'Peanut substance',
          type: 'food',
          reaction: 'Hives',
          code: { system: 'SNOMED US', code: '762952008' },
        },
      ],
    });
  });

  it('retains imported uncoded medications and permits prescription details without assigning a made-up code', () => {
    const { latest } = renderField(
      EncounterMedicationField,
      'encounterMedications',
      {
        medications: [
          { id: 'legacy', name: 'Imported drug', status: 'taking' },
        ],
      }
    );
    expect(
      screen.getByText(/Imported medications without a code/)
    ).toBeInTheDocument();
    const card = within(screen.getByRole('group', { name: 'Medication 1' }));
    const sig = card.getByLabelText('Sig (patient directions)');
    sig.innerHTML = '<p>Continue prior directions</p>';
    fireEvent.input(sig);
    expect(latest()).toEqual({
      medications: [
        {
          id: 'legacy',
          name: 'Imported drug',
          status: 'taking',
          sig: 'Continue prior directions',
        },
      ],
    });
  });

  it.each([
    [EncounterMedicationField, 'encounterMedications', { medications: [] }],
    [EncounterAllergyField, 'encounterAllergies', { allergies: [] }],
  ])(
    'has no uncoded add workaround without a terminology provider for %s',
    (Component, fieldType, value) => {
      renderField(Component, fieldType, value, { catalog: false });
      expect(
        screen.getByText(/Connect .* terminology catalog/)
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Other…' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Add allergy' })).toBeNull();
    }
  );

  it.each([
    [EncounterMedicationField, 'encounterMedications'],
    [EncounterAllergyField, 'encounterAllergies'],
  ])(
    'preserves malformed saved answers and blocks silent overwrite for %s',
    (Component, fieldType) => {
      const { onResponse } = renderField(Component, fieldType, undefined, {
        response: { answer: '{"bad":"saved data"}' },
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        '{"bad":"saved data"}'
      );
      expect(screen.queryByRole('button')).toBeNull();
      const original = screen.getByLabelText(
        fieldType === 'encounterMedications'
          ? 'Original medication answer'
          : 'Original allergy answer'
      );
      expect(original).toHaveAttribute('tabindex', '0');
      original.focus();
      expect(original).toHaveFocus();
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it.each([
    [EncounterMedicationField, 'encounterMedications'],
    [EncounterAllergyField, 'encounterAllergies'],
  ])('honors native read-only state for %s', (Component, fieldType) => {
    const { onResponse } = renderField(Component, fieldType, undefined, {
      fieldProps: { isReadOnly: true },
    });
    expect(screen.queryByRole('button')).toBeNull();
    expect(onResponse).not.toHaveBeenCalled();
  });

  it.each([
    [EncounterMedicationField, 'encounterMedications'],
    [EncounterAllergyField, 'encounterAllergies'],
  ])(
    'blocks delayed catalog capture after native FormStore freezes for %s',
    (Component, fieldType) => {
      const form = createFormStore();
      const onResponse = vi.fn();
      let delayedPick: CodeLookupProps['onSelect'];
      function DeferredCatalog(props: CodeLookupProps) {
        delayedPick = props.onSelect;
        return <Catalog {...props} />;
      }
      renderWithTheme(
        <CodeLookupProvider component={DeferredCatalog}>
          <Component {...fieldProps(fieldType, { form, onResponse })} />
        </CodeLookupProvider>
      );
      if (fieldType === 'encounterMedications')
        fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
      const pick = delayedPick;
      act(() => form.getState().setReadOnly(true));
      expect(screen.queryByRole('button')).toBeNull();
      const result: CodifyResult = {
        fullid: 'FDB244899',
        label: 'lisinopril 10 mg tablet',
        codetype: 'FDB',
        fullcode: '244899',
        domain: 'med',
        score: 1,
        viaAlias: false,
      };
      act(() => pick?.(result));
      expect(onResponse).not.toHaveBeenCalled();
    }
  );

  it('keeps free-text capture available in standalone healthcare components by default', () => {
    const medChange = vi.fn();
    const allergyChange = vi.fn();
    renderWithTheme(
      <CodeLookupProvider component={Catalog}>
        <MedicationReconciliation
          medications={[]}
          onChange={medChange}
          inlineAddSearch
        />
        <AllergyManager
          allergies={[]}
          onChange={allergyChange}
          inlineAddSearch
        />
      </CodeLookupProvider>
    );
    const freeText = screen.getAllByRole('button', { name: 'Use free text' });
    fireEvent.click(freeText[0]);
    fireEvent.click(freeText[1]);
    expect(medChange.mock.calls[0][0]).toMatchObject([
      { name: 'Unknown drug' },
    ]);
    expect(medChange.mock.calls[0][0][0]).not.toHaveProperty('code');
    expect(allergyChange.mock.calls[0][0]).toMatchObject([
      { allergen: 'Unknown drug' },
    ]);
    expect(allergyChange.mock.calls[0][0][0]).not.toHaveProperty('code');
  });
});

describe('optional coding in encounter medication and allergy adapters', () => {
  it.each([
    {
      component: EncounterMedicationField,
      fieldType: 'encounterMedications',
      key: 'medications',
      value: 'name',
    },
    {
      component: EncounterAllergyField,
      fieldType: 'encounterAllergies',
      key: 'allergies',
      value: 'allergen',
    },
  ])(
    'permits explicit uncoded $fieldType capture only with requireCoding false',
    ({ component, fieldType, key, value }) => {
      const { latest } = renderField(component, fieldType, undefined, {
        requireCoding: false,
      });
      fireEvent.click(
        screen.getByRole('button', {
          name:
            fieldType === 'encounterMedications'
              ? 'Add medication'
              : 'Add allergy',
        })
      );
      fireEvent.click(screen.getByRole('button', { name: 'Use free text' }));
      const entries = latest<Record<string, Record<string, unknown>[]>>()[key];
      expect(entries[0][value]).toBe('Unknown drug');
      expect(entries[0]).not.toHaveProperty('code');
    }
  );
  it('captures uncoded medications through the inline name input without a catalog only with requireCoding false', () => {
    const { latest } = renderField(
      EncounterMedicationField,
      'encounterMedications',
      undefined,
      { requireCoding: false, catalog: false }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add medication' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(screen.getByLabelText('Medication'), {
      target: { value: 'Aspirin' },
    });
    const { medications } = latest<{
      medications: Record<string, unknown>[];
    }>();
    expect(medications[0]).toMatchObject({ name: 'Aspirin' });
    expect(medications[0]).not.toHaveProperty('code');
  });
  it('captures uncoded allergies through the inline allergen input without a catalog only with requireCoding false', () => {
    const { latest } = renderField(
      EncounterAllergyField,
      'encounterAllergies',
      undefined,
      { requireCoding: false, catalog: false }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add allergy' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(screen.getByLabelText('Allergen'), {
      target: { value: 'Pollen' },
    });
    const { allergies } = latest<{ allergies: Record<string, unknown>[] }>();
    expect(allergies[0]).toMatchObject({ allergen: 'Pollen' });
    expect(allergies[0]).not.toHaveProperty('code');
  });
});
