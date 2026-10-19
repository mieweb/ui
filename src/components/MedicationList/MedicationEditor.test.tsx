import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  MedicationEditor,
  lookupToMedicationFields,
  type MedicationLookupProps,
  type IndicationLookupProps,
} from './MedicationEditor';
import { CodeLookupProvider } from '../CodeLookup/context';
import type { CodeLookupProps } from '../CodeLookup/CodeLookup';
import type { ConditionConcern } from '../ProblemList';
import type { Medication } from './MedicationList';
import {
  completeUiPrescription,
  prescribingUiConfiguration,
  uiReadiness,
} from '../PrescriptionReadiness/storyData';
import type { PrescriptionIssue } from '../../prescribing/types';

const heartFailureConcern: ConditionConcern = {
  concernId: 'chart-concern-heart-failure',
  clinicalStatus: 'active',
  assertions: [
    {
      id: 'assertion-old',
      date: '2025-01-01',
      text: 'Edema',
      verificationStatus: 'provisional',
      coding: [{ system: 'ICD-10-CM', code: 'R60.9' }],
    },
    {
      id: 'assertion-current',
      date: '2026-10-01',
      text: 'Heart failure',
      verificationStatus: 'confirmed',
      coding: [{ system: 'ICD-10-CM', code: 'I50.9', primary: true }],
    },
  ],
};

function ConditionLookup(props: IndicationLookupProps) {
  const [query, setQuery] = React.useState(props.initialQuery ?? '');
  return (
    <div>
      <input
        id={props.id}
        aria-label={props['aria-label']}
        aria-invalid={props['aria-invalid']}
        aria-describedby={props['aria-describedby']}
        disabled={props.disabled}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          props.onQueryChange?.(event.target.value);
        }}
      />
      <button
        disabled={props.disabled}
        onClick={() => {
          setQuery('Heart failure');
          props.onSelect?.({
            label: 'Heart failure',
            codetype: 'ICD10',
            fullcode: 'I50.9',
            fullid: 'catalog-row-not-a-concern-id',
            codeVersion: '2026',
          });
        }}
      >
        Select coded concern
      </button>
      <button
        disabled={props.disabled}
        onClick={() => {
          setQuery('Edema');
          props.onSelect?.({
            label: 'Edema',
            codetype: 'ICD10',
            fullcode: 'R60.9',
            fullid: 'another-catalog-row',
          });
        }}
      >
        Select historical code
      </button>
    </div>
  );
}

describe('prescription draft editor', () => {
  it('saves an incomplete draft and persists the displayed substitution default', async () => {
    const save = vi.fn();
    const close = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        onSave={save}
        onClose={close}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Lasix', substitution: '0' })
      )
    );
    await waitFor(() => expect(close).toHaveBeenCalled());
  });
  it('preserves explicit structured directions when Sig changes', () => {
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'rx-ui-1',
          status: 'unreconciled',
          ...completeUiPrescription,
          name: 'SimDrug A',
        }}
        codeLookup={false}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Sig (patient directions)'), {
      target: { value: 'Complex taper: use as instructed.' },
    });
    expect(screen.getByLabelText('Route')).toHaveValue('oral');
    expect(screen.getByLabelText('Frequency')).toHaveValue('Once daily');
  });
  it('requires confirmation of parser suggestions and invalidates stale drug fields', async () => {
    const save = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'rx-ui-1',
          status: 'unreconciled',
          name: 'SimDrug A 5 mg tablet',
          sig: 'Take by mouth daily',
          code: { system: 'RxNorm', code: 'old' },
          strength: '5 mg',
          route: 'oral',
        }}
        codeLookup={false}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Medication' }), {
      target: { value: 'SimDrug B 10 mg tablet' },
    });
    expect(screen.getByLabelText('Product strength')).toHaveValue('');
    expect(screen.getByLabelText('Route')).toHaveValue('');
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm suggested details' })
    );
    expect(screen.getByLabelText('Product strength')).toHaveValue('10 mg');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ code: undefined, strength: '10 mg' })
      )
    );
  });
  it('focuses an issue field and retains entered values after a failed save', async () => {
    const close = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        initialIssueField="prescription.quantity"
        onSave={() => Promise.reject(new Error('Persistence unavailable'))}
        onClose={close}
      />
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Quantity')).toHaveFocus()
    );
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '-3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Persistence unavailable'
      )
    );
    expect(screen.getByLabelText('Quantity')).toHaveValue('-3');
    expect(close).not.toHaveBeenCalled();
  });
  it('discards changes on cancellation', () => {
    const save = vi.fn();
    const close = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        onSave={save}
        onClose={close}
      />
    );
    fireEvent.change(screen.getByLabelText('Quantity'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(save).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});

it('captures the opener for a persistently mounted controlled editor under StrictMode', async () => {
  function Host() {
    const [open, setOpen] = React.useState(false);
    return (
      <React.StrictMode>
        <button onClick={() => setOpen(true)}>Open prescription</button>
        <MedicationEditor
          open={open}
          medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
          codeLookup={false}
          onSave={vi.fn()}
          onClose={() => setOpen(false)}
        />
      </React.StrictMode>
    );
  }
  renderWithTheme(<Host />);
  const opener = screen.getByRole('button', { name: 'Open prescription' });
  opener.focus();
  fireEvent.click(opener);
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Medication' })).toHaveFocus()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(opener).toHaveFocus());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('accepts verified product metadata from an injected lookup and clears dependent directions', async () => {
  const save = vi.fn();
  function Catalog({ onSelect }: MedicationLookupProps) {
    return (
      <div>
        <input aria-label="Medication" />
        <button
          onClick={() =>
            onSelect?.({
              label: 'SimDrug A',
              codetype: 'urn:mieweb:simulation-drug',
              fullcode: 'sim-a',
              productId: 'sim-a',
              strength: '5 mg',
              doseForm: 'tablet',
              quantityUnit: 'tablet',
              conceptSpecificity: 'product',
              controlledSchedule: 'non-controlled',
            })
          }
        >
          Select catalog product
        </button>
      </div>
    );
  }
  renderWithTheme(
    <MedicationEditor
      open
      medication={{
        id: 'rx-ui-1',
        name: 'Old drug',
        sig: 'Old directions',
        dose: '2',
        route: 'oral',
        status: 'unreconciled',
      }}
      prescribing={prescribingUiConfiguration}
      initialIssueField="prescription.productId"
      codeLookup={{ component: Catalog, indexUrl: '/catalog' }}
      onSave={save}
      onClose={vi.fn()}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Select catalog product' })
  );
  expect(screen.getByLabelText('Product strength')).toHaveValue('5 mg');
  expect(screen.getByLabelText('Dose per administration')).toHaveValue('');
  expect(screen.getByLabelText('Sig (patient directions)')).toHaveValue('');
  expect(
    screen.queryByLabelText('Resolved product identifier')
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SimDrug A',
        productId: 'sim-a',
        code: expect.objectContaining({ code: 'sim-a' }),
        quantityUnit: 'tablet',
      })
    )
  );
});

it('retains versioned catalog coding in the draft and its trusted product preview', async () => {
  const save = vi.fn();
  const selection = {
    label: 'SimDrug A',
    codetype: 'urn:mieweb:simulation-drug',
    fullcode: 'sim-a',
    codeVersion: '2026-10',
    productId: 'sim-a',
    strength: '5 mg',
    doseForm: 'tablet',
    quantityUnit: 'tablet',
    controlledSchedule: 'non-controlled' as const,
  };
  expect(lookupToMedicationFields(selection).code).toEqual({
    system: selection.codetype,
    code: selection.fullcode,
    display: selection.label,
    version: selection.codeVersion,
  });
  function Catalog({ onSelect }: MedicationLookupProps) {
    return (
      <button onClick={() => onSelect?.(selection)}>
        Select versioned catalog product
      </button>
    );
  }
  renderWithTheme(
    <MedicationEditor
      open
      medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
      prescribing={prescribingUiConfiguration}
      codeLookup={{ component: Catalog, indexUrl: '/catalog' }}
      onSave={save}
      onClose={vi.fn()}
    />
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Select versioned catalog product' })
  );
  expect(
    screen.queryByText('Drug code does not match the selected product.')
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: expect.objectContaining({
          code: selection.fullcode,
          version: selection.codeVersion,
        }),
      })
    )
  );
});

it('shows parsed contradictions without overwriting confirmed fields or blocking draft save', () => {
  renderWithTheme(
    <MedicationEditor
      open
      medication={{
        id: 'rx-ui-1',
        name: 'SimDrug A',
        status: 'unreconciled',
        route: 'oral',
        frequency: 'Once daily',
      }}
      prescribing={prescribingUiConfiguration}
      codeLookup={false}
      onSave={vi.fn()}
      onClose={vi.fn()}
    />
  );
  fireEvent.change(screen.getByLabelText('Sig (patient directions)'), {
    target: { value: 'Inject subcutaneously twice daily.' },
  });
  expect(
    screen.getByText(
      'Directions suggest route subcutaneous; the structured route is oral.'
    )
  ).toBeVisible();
  expect(
    screen.getByText(
      'Directions suggest twice daily; the structured frequency is once daily.'
    )
  ).toBeVisible();
  expect(screen.getByLabelText('Route')).toHaveValue('oral');
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
});

describe('inline prescription alerts', () => {
  function describedIssues(control: HTMLElement): HTMLElement {
    const id = control.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    const description = document.getElementById(id!);
    expect(description).not.toBeNull();
    return description!;
  }

  it('keeps the collapsed summary outside the scrolling inputs and associates product issues with Medication', () => {
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const dialog = screen.getByRole('dialog');
    const summary = dialog.querySelector(
      '[data-slot="prescription-issue-summary"]'
    )!;
    expect(summary.closest('[data-slot="modal-body"]')).toBeNull();
    expect(summary).toHaveClass('max-h-[20dvh]');
    const toggle = screen.getByRole('button', {
      name: /^Expand prescription issues:/,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('button', { name: /^Resolve issue:/ })
    ).not.toBeInTheDocument();

    const medication = screen.getByRole('textbox', { name: 'Medication' });
    expect(medication).toHaveAttribute('aria-invalid', 'true');
    expect(medication).toHaveClass('border-destructive');
    expect(describedIssues(medication)).toHaveTextContent(
      'Drug product is required'
    );
    expect(describedIssues(medication)).toHaveTextContent(
      'Drug code is required'
    );
    expect(medication).toHaveAttribute(
      'aria-errormessage',
      medication.getAttribute('aria-describedby')
    );

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(describedIssues(medication)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
  });

  it('updates an input alert immediately as a missing or invalid value is corrected', () => {
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const quantity = screen.getByLabelText('Quantity');
    expect(describedIssues(quantity)).toHaveTextContent(
      'Dispense quantity is required'
    );
    fireEvent.change(quantity, { target: { value: '-1' } });
    expect(quantity).toHaveAttribute('aria-invalid', 'true');
    expect(describedIssues(quantity)).toHaveTextContent(
      'Dispense quantity must be a positive decimal.'
    );
    fireEvent.change(quantity, { target: { value: '30' } });
    expect(quantity).not.toHaveAttribute('aria-invalid', 'true');
    expect(quantity).not.toHaveAttribute('aria-describedby');
    expect(quantity).not.toHaveAttribute('aria-errormessage');
    expect(quantity).not.toHaveClass('border-destructive');
    expect(screen.getByLabelText('Product strength')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('associates injected catalog inputs and their group with aliased product alerts and focuses the search', async () => {
    function Catalog(props: MedicationLookupProps) {
      return (
        <input
          id={props.id}
          aria-label="Medication"
          aria-invalid={props['aria-invalid']}
          aria-describedby={props['aria-describedby']}
        />
      );
    }
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'rx-ui-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={{ component: Catalog, indexUrl: '/catalog' }}
        prescribing={prescribingUiConfiguration}
        initialIssueField="context.product.coding"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const medication = screen.getByRole('textbox', { name: 'Medication' });
    const group = screen.getByRole('group', { name: 'Medication' });
    expect(describedIssues(medication)).toHaveTextContent(
      'Drug product is required'
    );
    expect(group).toHaveAttribute(
      'aria-describedby',
      medication.getAttribute('aria-describedby')
    );
    await waitFor(() => expect(medication).toHaveFocus());
    fireEvent.click(
      screen.getByRole('button', { name: /^Expand prescription issues:/ })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /^Resolve issue: Drug code is required/,
      })
    );
    expect(medication).toHaveFocus();
  });

  it('shows deduplicated clinical warnings and context alerts without marking valid input values invalid', () => {
    const routeWarning: PrescriptionIssue = {
      code: 'CLINICAL_ROUTE_REVIEW',
      ruleId: 'test.route-review',
      ruleSource: 'clinical-provider',
      fieldPath: 'prescription.route',
      message: 'Review the route for this patient.',
      severity: 'warning',
      blocks: [],
      remediation: 'clinical-review',
    };
    const productContext: PrescriptionIssue = {
      ...routeWarning,
      code: 'CONTEXT_PRODUCT_REVIEW',
      fieldPath: 'context.product',
      message: 'Refresh the product catalog context.',
      severity: 'error',
      remediation: 'system',
    };
    const readiness = uiReadiness(completeUiPrescription);
    readiness.validation.issues = [routeWarning, routeWarning, productContext];
    readiness.workflow = {
      evaluationId: 'review',
      evaluationRevision: '1',
      inputFingerprint: 'input',
      workflowFingerprint: 'workflow',
      projectedAt: prescribingUiConfiguration.input.evaluatedAt,
      expiresAt: null,
      validity: 'current',
      gates: { review: 'pass', sign: 'unknown', transmit: 'unknown' },
      issues: [routeWarning],
    };
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'rx-ui-1',
          status: 'unreconciled',
          ...completeUiPrescription,
          name: 'SimDrug A',
        }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        readiness={readiness}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const route = screen.getByLabelText('Route');
    expect(route).not.toHaveAttribute('aria-invalid', 'true');
    expect(
      within(describedIssues(route)).getAllByText(routeWarning.message)
    ).toHaveLength(1);
    expect(
      within(describedIssues(route)).getByText(routeWarning.message)
    ).toHaveClass('text-warning-900');
    const medication = screen.getByRole('textbox', { name: 'Medication' });
    expect(medication).not.toHaveAttribute('aria-invalid', 'true');
    expect(describedIssues(medication)).toHaveTextContent(
      productContext.message
    );
  });

  it('associates substitution issues with both choices and keeps read-only alerts visible', () => {
    const readiness = uiReadiness(completeUiPrescription);
    readiness.validation.issues = [
      {
        code: 'SUBSTITUTION_INVALID',
        ruleId: 'test.substitution',
        ruleSource: 'product',
        fieldPath: 'prescription.substitution',
        message: 'Confirm the substitution choice.',
        severity: 'error',
        blocks: ['review'],
        remediation: 'edit-prescription',
      },
    ];
    renderWithTheme(
      <MedicationEditor
        open
        readOnly
        medication={{
          id: 'rx-ui-1',
          status: 'unreconciled',
          ...completeUiPrescription,
          name: 'SimDrug A',
        }}
        codeLookup={false}
        prescribing={prescribingUiConfiguration}
        readiness={readiness}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const permitted = screen.getByRole('radio', {
      name: 'Substitution permitted',
    });
    const daw = screen.getByRole('radio', {
      name: 'Dispense as written (DAW)',
    });
    expect(permitted).toBeDisabled();
    expect(daw).toBeDisabled();
    expect(permitted.id).not.toBe(daw.id);
    expect(describedIssues(permitted)).toHaveTextContent(
      'Confirm the substitution choice.'
    );
    expect(describedIssues(daw)).toBe(describedIssues(permitted));
    expect(permitted).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.queryByRole('button', { name: 'Save draft' })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /^Expand prescription issues:/ })
    );
    expect(
      screen.queryByRole('button', { name: /^Resolve issue:/ })
    ).not.toBeInTheDocument();
  });

  it('does not show inline alerts from an outdated order revision', () => {
    const readiness = uiReadiness(completeUiPrescription);
    readiness.validation.issues = [
      {
        code: 'OLD_ROUTE_ERROR',
        ruleId: 'test.old-route',
        ruleSource: 'product',
        fieldPath: 'prescription.route',
        message: 'This alert belongs to the older order.',
        severity: 'error',
        blocks: ['review'],
        remediation: 'edit-prescription',
      },
    ];
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'rx-ui-1',
          status: 'unreconciled',
          ...completeUiPrescription,
          name: 'SimDrug A',
          prescriptionRevision: '2',
        }}
        codeLookup={false}
        readiness={readiness}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(
      screen.queryByText('This alert belongs to the older order.')
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Route')).not.toHaveAttribute(
      'aria-describedby'
    );
  });
});

describe('coded medication and concern indications', () => {
  it('disables both injected lookups and their selections until saving finishes', async () => {
    let finishSave!: () => void;
    const pendingSave = new Promise<void>((resolve) => {
      finishSave = resolve;
    });
    function MedicationLookup(props: MedicationLookupProps) {
      return (
        <div>
          <input
            id={props.id}
            aria-label={props['aria-label']}
            disabled={props.disabled}
            defaultValue={props.initialQuery}
          />
          <button disabled={props.disabled}>Select medication code</button>
        </div>
      );
    }
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={{ component: MedicationLookup, indexUrl: '/codify' }}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[heartFailureConcern]}
        onSave={() => pendingSave}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('textbox', { name: 'Medication' })).toBeDisabled();
    expect(
      screen.getByRole('textbox', { name: 'Indication (concern)' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Select medication code' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Select coded concern' })
    ).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Chart concern' })
    ).toBeDisabled();
    await act(async () => {
      finishSave();
    });
    expect(screen.getByRole('textbox', { name: 'Medication' })).toBeEnabled();
    expect(
      screen.getByRole('textbox', { name: 'Indication (concern)' })
    ).toBeEnabled();
  });

  it.each([
    {
      chartSystem: 'http://hl7.org/fhir/sid/icd-10-cm',
      catalogSystem: 'ICD10',
      code: 'I50.9',
    },
    {
      chartSystem: 'http://snomed.info/sct',
      catalogSystem: 'SNOMED US',
      code: '84114007',
    },
  ])(
    'links $catalogSystem selections to chart concerns with canonical FHIR system URIs',
    async ({ chartSystem, catalogSystem, code }) => {
      const save = vi.fn();
      const concern: ConditionConcern = {
        ...heartFailureConcern,
        assertions: [
          {
            ...heartFailureConcern.assertions[1],
            coding: [{ system: chartSystem, code }],
          },
        ],
      };
      function CanonicalConditionLookup(props: IndicationLookupProps) {
        return (
          <button
            onClick={() =>
              props.onSelect?.({
                label: 'Heart failure',
                codetype: catalogSystem,
                fullcode: code,
              })
            }
          >
            Select concern alias
          </button>
        );
      }
      renderWithTheme(
        <MedicationEditor
          open
          medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
          codeLookup={false}
          indicationCodeLookup={{
            component: CanonicalConditionLookup,
            indexUrl: '/codify',
          }}
          indicationConcerns={[concern]}
          onSave={save}
          onClose={vi.fn()}
        />
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Select concern alias' })
      );
      expect(
        screen.getByText('Linked chart concern: Heart failure')
      ).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith(
          expect.objectContaining({
            concernId: concern.concernId,
            indicationCode: expect.objectContaining({ code }),
          })
        )
      );
    }
  );

  it('uses the ambient lookup for both medication and condition domains', () => {
    const lookup = vi.fn((props: CodeLookupProps) => (
      <input id={props.id} aria-label={props['aria-label']} />
    ));
    renderWithTheme(
      <CodeLookupProvider component={lookup} indexUrl="/codify">
        <MedicationEditor
          open
          medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      </CodeLookupProvider>
    );
    expect(lookup).toHaveBeenCalledWith(
      expect.objectContaining({
        indexUrl: '/codify',
        domains: ['med'],
        'aria-label': 'Medication',
        onQueryChange: expect.any(Function),
      }),
      undefined
    );
    expect(lookup).toHaveBeenCalledWith(
      expect.objectContaining({
        indexUrl: '/codify',
        domains: ['condition'],
        'aria-label': 'Indication (concern)',
        onQueryChange: expect.any(Function),
      }),
      undefined
    );
  });

  it('saves coded indications with the durable concern link and reopens them', async () => {
    let saved: Medication | undefined;
    function Host() {
      const [medication, setMedication] = React.useState<Medication>({
        id: 'med-1',
        name: 'Lasix',
        status: 'unreconciled',
      });
      const [open, setOpen] = React.useState(true);
      return open ? (
        <MedicationEditor
          open
          medication={medication}
          codeLookup={false}
          indicationCodeLookup={{
            component: ConditionLookup,
            indexUrl: '/codify',
          }}
          indicationConcerns={[heartFailureConcern]}
          onSave={(next) => {
            saved = next;
            setMedication(next);
          }}
          onClose={() => setOpen(false)}
        />
      ) : (
        <button onClick={() => setOpen(true)}>Reopen prescription</button>
      );
    }
    renderWithTheme(<Host />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Select coded concern' })
    );
    expect(
      screen.getByText('Linked chart concern: Heart failure')
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(saved).toMatchObject({
        indication: 'Heart failure',
        concernId: heartFailureConcern.concernId,
        indicationCode: {
          system: 'ICD-10-CM',
          code: 'I50.9',
          display: 'Heart failure',
          version: '2026',
        },
      })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reopen prescription' })
      ).toBeVisible()
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Reopen prescription' })
    );
    expect(
      screen.getByRole('textbox', { name: 'Indication (concern)' })
    ).toHaveValue('Heart failure');
    expect(screen.getByText('Coded: ICD-10-CM I50.9')).toBeVisible();
    expect(
      screen.getByText('Linked chart concern: Heart failure')
    ).toBeVisible();
  });

  it('does not turn a catalog row or historical assertion into a concern link', async () => {
    const save = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[heartFailureConcern]}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Select historical code' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          indication: 'Edema',
          indicationCode: expect.objectContaining({ code: 'R60.9' }),
          concernId: undefined,
        })
      )
    );
  });

  it('allows an uncoded chart concern and clears its link immediately when typed text changes', async () => {
    const save = vi.fn();
    const uncodedConcern: ConditionConcern = {
      concernId: 'durable-uncoded-concern',
      clinicalStatus: 'active',
      assertions: [
        {
          id: 'uncoded-assertion',
          date: '2026-10-01',
          text: 'Leg swelling under evaluation',
          verificationStatus: 'unconfirmed',
        },
      ],
    };
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[uncodedConcern]}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Chart concern' }));
    fireEvent.click(
      screen.getByRole('option', { name: uncodedConcern.assertions[0].text })
    );
    const indication = screen.getByRole('textbox', {
      name: 'Indication (concern)',
    });
    expect(indication).toHaveValue(uncodedConcern.assertions[0].text);
    expect(
      screen.getByText(
        `Linked chart concern: ${uncodedConcern.assertions[0].text}`
      )
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          concernId: uncodedConcern.concernId,
          indicationCode: undefined,
        })
      )
    );
    fireEvent.change(indication, {
      target: { value: 'Another concern for later review' },
    });
    expect(
      screen.queryByText(/^Linked chart concern:/)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          indication: 'Another concern for later review',
          indicationCode: undefined,
          concernId: undefined,
        })
      )
    );
    expect(Object.hasOwn(save.mock.lastCall![0], 'concernId')).toBe(true);
  });

  it('clears stale medication coding on lookup typing without requiring Enter', async () => {
    const save = vi.fn();
    function MedicationLookup(props: MedicationLookupProps) {
      return (
        <input
          id={props.id}
          aria-label={props['aria-label']}
          defaultValue={props.initialQuery}
          onChange={(event) => props.onQueryChange?.(event.target.value)}
        />
      );
    }
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'med-1',
          name: 'Old medication',
          status: 'unreconciled',
          code: { system: 'RxNorm', code: 'old' },
          productId: 'old-product',
          strength: '5 mg',
        }}
        codeLookup={{ component: MedicationLookup, indexUrl: '/codify' }}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Medication' }), {
      target: { value: 'New draft medication' },
    });
    expect(
      screen.getByText('Free-text draft; select a product when ready.')
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New draft medication',
          code: undefined,
          productId: undefined,
          strength: undefined,
        })
      )
    );
  });

  it('clears a coded indication and its durable link before free-text submission', async () => {
    const save = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'med-1',
          name: 'Lasix',
          status: 'unreconciled',
          indication: 'Heart failure',
          concernId: heartFailureConcern.concernId,
          indicationCode: { system: 'ICD-10-CM', code: 'I50.9' },
        }}
        codeLookup={false}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[heartFailureConcern]}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Indication (concern)' }),
      {
        target: { value: 'Changed concern awaiting review' },
      }
    );
    expect(
      screen.queryByText('Coded: ICD-10-CM I50.9')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^Linked chart concern:/)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          indication: 'Changed concern awaiting review',
          indicationCode: undefined,
          concernId: undefined,
        })
      )
    );
    expect(Object.hasOwn(save.mock.lastCall![0], 'concernId')).toBe(true);
  });

  it('requires concern selection when more than one current concern has the selected code', async () => {
    const save = vi.fn();
    renderWithTheme(
      <MedicationEditor
        open
        medication={{ id: 'med-1', name: 'Lasix', status: 'unreconciled' }}
        codeLookup={false}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[
          heartFailureConcern,
          {
            ...heartFailureConcern,
            concernId: 'another-heart-failure-concern',
          },
        ]}
        onSave={save}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Select coded concern' })
    );
    expect(
      screen.queryByText(/^Linked chart concern:/)
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          indicationCode: expect.objectContaining({ code: 'I50.9' }),
          concernId: undefined,
        })
      )
    );
  });

  it('shows indication coding and concern feedback in a read-only editor without a picker', () => {
    renderWithTheme(
      <MedicationEditor
        open
        readOnly
        medication={{
          id: 'med-1',
          name: 'Lasix',
          status: 'unreconciled',
          indication: 'Heart failure',
          concernId: heartFailureConcern.concernId,
          indicationCode: { system: 'ICD-10-CM', code: 'I50.9' },
        }}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        indicationConcerns={[heartFailureConcern]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Indication')).toBeDisabled();
    expect(screen.getByLabelText('Indication')).toHaveValue('Heart failure');
    expect(screen.getByText('Coded: ICD-10-CM I50.9')).toBeVisible();
    expect(
      screen.getByText('Linked chart concern: Heart failure')
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Select coded concern' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Chart concern' })
    ).not.toBeInTheDocument();
  });

  it('places indication-code issues beside the lookup and focuses that field', async () => {
    const readiness = uiReadiness(completeUiPrescription);
    readiness.validation.issues = [
      {
        code: 'INDICATION_CODE_REVIEW',
        ruleId: 'test.indication-code',
        ruleSource: 'product',
        fieldPath: 'prescription.indicationCode.code',
        message: 'Complete the concern coding.',
        severity: 'error',
        blocks: ['review'],
        remediation: 'edit-prescription',
      },
    ];
    renderWithTheme(
      <MedicationEditor
        open
        medication={{
          id: 'rx-ui-1',
          name: 'SimDrug A',
          status: 'unreconciled',
          ...completeUiPrescription,
        }}
        codeLookup={false}
        indicationCodeLookup={{
          component: ConditionLookup,
          indexUrl: '/codify',
        }}
        prescribing={prescribingUiConfiguration}
        readiness={readiness}
        initialIssueField="prescription.indicationCode.code"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const indication = screen.getByRole('textbox', {
      name: 'Indication (concern)',
    });
    await waitFor(() => expect(indication).toHaveFocus());
    expect(indication).toHaveAttribute('aria-invalid', 'true');
    const messageId = indication.getAttribute('aria-describedby')!;
    expect(document.getElementById(messageId)).toHaveTextContent(
      'Complete the concern coding.'
    );
    expect(screen.getByRole('group', { name: 'Indication' })).toHaveAttribute(
      'aria-describedby',
      messageId
    );
  });
});
