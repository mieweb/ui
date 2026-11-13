import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  MedicationEditor,
  labelToMedicationFields,
  parseMedicationLabel,
  type MedicationLookupProps,
  type MedicationLookupResult,
} from './MedicationEditor';
import { expandSig } from './sig';
import type { Medication } from './MedicationList';

describe('parseMedicationLabel', () => {
  it('keeps dose-form qualifiers so products stay distinct', () => {
    expect(
      parseMedicationLabel('Xanax XR 1 mg tablet,extended release')
    ).toEqual({ strength: '1 mg', doseForm: 'tablet,extended release' });
    expect(
      parseMedicationLabel(
        '24 HR alprazolam 3 MG Extended Release Oral Tablet [Xanax]'
      )
    ).toEqual({ strength: '3 mg', doseForm: 'extended release oral tablet' });
    expect(parseMedicationLabel('lisinopril 20 mg tablet')).toEqual({
      strength: '20 mg',
      doseForm: 'tablet',
    });
  });

  it('derives the quantity unit from the base dose form', () => {
    expect(
      labelToMedicationFields('Xanax XR 1 mg tablet,extended release')
    ).toMatchObject({ quantityUnit: 'tablet' });
  });
});

describe('expandSig', () => {
  it('expands practitioner shorthand into patient directions', () => {
    expect(expandSig('1 tab po bid with food')).toBe(
      'Take 1 tablet by mouth twice a day with food.'
    );
  });

  it('pluralizes whole counts but not fractions', () => {
    expect(expandSig('2 caps po qhs')).toBe(
      'Take 2 capsules by mouth at bedtime.'
    );
    expect(expandSig('1/2 tab po q6h prn')).toBe(
      'Take 1/2 tablet by mouth every 6 hours as needed.'
    );
  });

  it('returns an empty string for blank input', () => {
    expect(expandSig('   ')).toBe('');
  });

  it('expands non-oral forms and "__" amount blanks', () => {
    expect(expandSig('insert 1 supp pr qhs')).toBe(
      'Insert 1 suppository rectally at bedtime.'
    );
    expect(expandSig('__ ml po bid')).toBe('Take __ mL by mouth twice a day.');
  });
});

function renderEditor(
  props: Partial<React.ComponentProps<typeof MedicationEditor>> = {}
) {
  const onSave = vi.fn<(med: Medication) => void>();
  renderWithTheme(
    <MedicationEditor
      open
      codeLookup={false}
      onClose={() => {}}
      onSave={onSave}
      {...props}
    />
  );
  return { onSave };
}

const patientSigInput = () => screen.getByLabelText('Sig (patient directions)');

describe('MedicationEditor', () => {
  it('fills the patient sig from the practitioner sig until it is hand-edited', () => {
    renderEditor();
    const sig = screen.getByLabelText('Practitioner sig');

    fireEvent.change(sig, { target: { value: '1 tab po qd' } });
    expect(patientSigInput()).toHaveValue('Take 1 tablet by mouth once a day.');

    fireEvent.change(patientSigInput(), {
      target: { value: 'Custom directions' },
    });
    fireEvent.change(sig, { target: { value: '1 tab po bid' } });
    expect(patientSigInput()).toHaveValue('Custom directions');
  });

  it('never overwrites a patient sig that did not come from the practitioner sig', () => {
    renderEditor({
      medication: {
        id: 'm1',
        name: 'aspirin',
        status: 'unreconciled',
        patientSig: 'As directed',
      },
    });
    fireEvent.change(screen.getByLabelText('Practitioner sig'), {
      target: { value: '1 tab po qd' },
    });
    expect(patientSigInput()).toHaveValue('As directed');
  });

  it('pre-fills the patient sig for a medication that only has a sig', () => {
    renderEditor({
      medication: {
        id: 'm2',
        name: 'atenolol',
        status: 'unreconciled',
        sig: '1 tab po bid',
      },
    });
    expect(screen.getByLabelText('Practitioner sig')).toHaveValue(
      '1 tab po bid'
    );
    expect(patientSigInput()).toHaveValue(
      'Take 1 tablet by mouth twice a day.'
    );
  });

  it('applies directions and duration presets', () => {
    renderEditor({
      sigPresets: [{ label: 'Twice a day', sig: 'bid' }],
    });

    // No dose form yet → the timing alone
    const preset = screen.getByRole('button', { name: 'Twice a day' });
    fireEvent.click(preset);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Practitioner sig')).toHaveValue('bid');
    expect(patientSigInput()).toHaveValue('Twice a day.');

    fireEvent.click(screen.getByRole('button', { name: /90 days supply/ }));
    expect(screen.getByLabelText('Days supply')).toHaveValue('90');
  });

  it('builds preset directions from the dose form, following form changes', () => {
    renderEditor({
      sigPresets: [{ label: 'Twice a day', sig: 'bid' }],
    });
    const form = screen.getByLabelText('Dose form');
    const sig = screen.getByLabelText('Practitioner sig');

    fireEvent.change(form, { target: { value: 'tablet' } });
    fireEvent.click(screen.getByRole('button', { name: 'Twice a day' }));
    expect(sig).toHaveValue('1 tab po bid');
    expect(patientSigInput()).toHaveValue(
      'Take 1 tablet by mouth twice a day.'
    );

    fireEvent.change(form, { target: { value: 'oral solution' } });
    expect(sig).toHaveValue('__ ml po bid');
    expect(patientSigInput()).toHaveValue('Take __ mL by mouth twice a day.');

    // route words win over the base form: no "by mouth" for eye drops
    fireEvent.change(form, { target: { value: 'ophthalmic solution' } });
    expect(sig).toHaveValue('instill __ gtts in __ eye bid');

    fireEvent.change(form, { target: { value: 'cream' } });
    expect(patientSigInput()).toHaveValue('Apply topically twice a day.');

    // a hand-edited sig is left alone
    fireEvent.change(sig, { target: { value: 'apply thin layer bid' } });
    fireEvent.change(form, { target: { value: 'tablet' } });
    expect(sig).toHaveValue('apply thin layer bid');
  });

  it('calculates quantity on blur after a relevant change', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Dose form'), {
      target: { value: 'tablet' },
    });
    fireEvent.change(screen.getByLabelText('Practitioner sig'), {
      target: { value: '1 tab po bid' },
    });
    const days = screen.getByLabelText('Days supply');
    fireEvent.change(days, { target: { value: '2w' } });
    fireEvent.blur(days);

    const quantity = screen.getByLabelText('Quantity');
    expect(days).toHaveValue('14');
    expect(quantity).toHaveValue('28');

    // a typed quantity survives blurs that changed nothing relevant
    fireEvent.change(quantity, { target: { value: '30' } });
    fireEvent.blur(quantity);
    expect(quantity).toHaveValue('30');

    fireEvent.click(screen.getByRole('button', { name: 'Calculate quantity' }));
    expect(quantity).toHaveValue('28');
  });

  it('explains when quantity cannot be calculated', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Dose form'), {
      target: { value: 'suppository' },
    });
    expect(screen.getByLabelText('Quantity unit')).toHaveTextContent(
      'Suppositories'
    );
    fireEvent.change(screen.getByLabelText('Dose form'), {
      target: { value: 'cream' },
    });
    fireEvent.change(screen.getByLabelText('Practitioner sig'), {
      target: { value: 'apply topically bid' },
    });
    fireEvent.click(screen.getByRole('button', { name: /30 days supply/ }));
    expect(screen.getByRole('status')).toHaveTextContent(
      "Quantity can't be calculated for this dose form"
    );
  });

  it('steps refills within 0–99', () => {
    renderEditor();
    const refills = screen.getByLabelText('Refills');
    const decrease = screen.getByRole('button', { name: 'Decrease refills' });

    expect(decrease).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Increase refills' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase refills' }));
    expect(refills).toHaveValue('2');
    fireEvent.click(decrease);
    expect(refills).toHaveValue('1');

    fireEvent.change(refills, { target: { value: '99' } });
    expect(
      screen.getByRole('button', { name: 'Increase refills' })
    ).toBeDisabled();

    fireEvent.change(refills, { target: { value: '1a50' } });
    expect(refills).toHaveValue('15');
  });

  it('saves the prescriber and the new sig fields', () => {
    const { onSave } = renderEditor();
    fireEvent.change(screen.getByRole('textbox', { name: 'Medication' }), {
      target: { value: 'naproxen 500 mg tablet' },
    });
    fireEvent.change(screen.getByLabelText('Practitioner sig'), {
      target: { value: '1 tab po bid' },
    });
    fireEvent.change(screen.getByLabelText('Prescriber'), {
      target: { value: 'Dr. Ruiz' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'naproxen 500 mg tablet',
        sig: '1 tab po bid',
        patientSig: 'Take 1 tablet by mouth twice a day.',
        frequency: 'Twice daily',
        route: 'oral',
        prescriber: 'Dr. Ruiz',
      })
    );
  });

  it('edits stored ISO dates as MM/DD/YYYY and saves them back as ISO', () => {
    const { onSave } = renderEditor({
      medication: {
        id: 'm1',
        name: 'Lisinopril',
        status: 'taking',
        startDate: '2026-10-10',
      },
    });
    expect(screen.getByLabelText('Start date')).toHaveValue('10/10/2026');
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '11/05/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-10-10',
        endDate: '2026-11-05',
      })
    );
  });
});

describe('MedicationEditor — drug-level picks', () => {
  const xanax = { label: 'Xanax', codetype: 'FDB MEDNAME', fullcode: '9259' };
  const xanaxFamily: MedicationLookupResult[] = [
    { label: 'Xanax 0.25 mg tablet', codetype: 'FDB', fullcode: '235411' },
    { label: 'Xanax 1 mg tablet', codetype: 'FDB', fullcode: '291828' },
    { label: 'Xanax Pill', codetype: 'RxNORM', fullcode: '1186301' },
    { label: 'Xanax XR', codetype: 'FDB MEDNAME', fullcode: '62837' },
    {
      label: 'Xanax XR 1 mg tablet,extended release',
      codetype: 'FDB',
      fullcode: '449766',
    },
  ];

  /** Stand-in for the injected CodeLookup: one button that picks Xanax and
   * reports its family, as CodeLookup's worker would. */
  function FakeLookup({ onSelect, onSelectFamily }: MedicationLookupProps) {
    return (
      <button
        type="button"
        onClick={() => {
          onSelect?.(xanax);
          onSelectFamily?.(xanaxFamily, xanax);
        }}
      >
        Pick Xanax
      </button>
    );
  }

  const renderWithXanax = () => {
    const result = renderEditor({
      codeLookup: { component: FakeLookup, indexUrl: '/codify' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pick Xanax' }));
    return result;
  };

  const optionsOf = (label: string) => {
    fireEvent.focus(screen.getByLabelText(label));
    return screen.getAllByRole('option').map((o) => o.textContent);
  };

  it('offers the products’ strengths and dose forms, skipping non-products', () => {
    renderWithXanax();
    expect(screen.getByRole('combobox', { name: 'Strength' })).toBeVisible();
    expect(optionsOf('Strength')).toEqual(['0.25 mg', '1 mg']);
    fireEvent.keyDown(screen.getByLabelText('Strength'), { key: 'Escape' });
    expect(optionsOf('Dose form')).toEqual([
      'tablet',
      'tablet,extended release',
    ]);
  });

  it('codes the product once a strength leaves a single match', () => {
    renderWithXanax();
    optionsOf('Strength');
    fireEvent.click(screen.getByRole('option', { name: '0.25 mg' }));

    expect(screen.getByLabelText('Dose form')).toHaveValue('tablet');
    expect(
      screen.getByText('Coded: FDB 235411 (Xanax 0.25 mg tablet)')
    ).toBeInTheDocument();
  });

  it('stays drug-level until strength + dose form pick one product', () => {
    const { onSave } = renderWithXanax();
    optionsOf('Strength');
    fireEvent.click(screen.getByRole('option', { name: '1 mg' }));
    expect(
      screen.getByText(
        'Coded: FDB MEDNAME 9259 — choose a strength and dose form to code the product'
      )
    ).toBeInTheDocument();

    optionsOf('Dose form');
    fireEvent.click(
      screen.getByRole('option', { name: 'tablet,extended release' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Xanax XR 1 mg tablet,extended release',
        code: {
          system: 'FDB',
          code: '449766',
          display: 'Xanax XR 1 mg tablet,extended release',
        },
        strength: '1 mg',
        doseForm: 'tablet,extended release',
        quantityUnit: 'tablet',
      })
    );
  });

  it('ignores a family that arrives after switching to free text', () => {
    function RacyLookup({
      onSelect,
      onSelectFamily,
      onFreeText,
    }: MedicationLookupProps) {
      return (
        <button
          type="button"
          onClick={() => {
            onSelect?.(xanax);
            onFreeText?.('my custom compound');
            onSelectFamily?.(xanaxFamily, xanax); // late reply
          }}
        >
          Race
        </button>
      );
    }
    renderEditor({ codeLookup: { component: RacyLookup, indexUrl: '/x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Race' }));
    expect(
      screen.queryByRole('combobox', { name: 'Strength' })
    ).not.toBeInTheDocument();
  });

  it('drops the uncoded type once the medication is coded', () => {
    const { onSave } = renderEditor({
      codeLookup: { component: FakeLookup, indexUrl: '/codify' },
      medication: {
        id: 'm3',
        name: 'magic mouthwash',
        status: 'unreconciled',
        uncodedType: 'CP',
      },
    });
    expect(screen.getByRole('button', { name: 'Compound' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pick Xanax' }));
    expect(
      screen.queryByRole('group', { name: 'Uncoded medication type' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave.mock.calls[0][0].uncodedType).toBeUndefined();
  });
});

describe('MedicationEditor — uncoded medications', () => {
  it('offers compound / supply for an uncoded medication', () => {
    const { onSave } = renderEditor();
    expect(
      screen.queryByRole('group', { name: 'Uncoded medication type' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Medication' }), {
      target: { value: 'test strips' },
    });
    const supply = screen.getByRole('button', { name: 'Supply' });
    const compound = screen.getByRole('button', { name: 'Compound' });
    expect(
      screen.getByRole('group', { name: 'Uncoded medication type' })
    ).toHaveAccessibleDescription(/compound or a supply/);

    fireEvent.click(compound);
    fireEvent.click(supply); // one or the other
    expect(supply).toHaveAttribute('aria-pressed', 'true');
    expect(compound).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test strips', uncodedType: 'SP' })
    );
  });

  it('can be cleared by clicking the selected type again', () => {
    renderEditor({
      medication: {
        id: 'm4',
        name: 'lancets',
        status: 'unreconciled',
        uncodedType: 'SP',
      },
    });
    const supply = screen.getByRole('button', { name: 'Supply' });
    fireEvent.click(supply);
    expect(supply).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('MedicationEditor — quantity unit', () => {
  it('defaults to the dose form and can be manually overridden', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Dose form'), {
      target: { value: 'tablet' },
    });
    const unit = screen.getByLabelText('Quantity unit');
    expect(unit).toHaveTextContent('Tablets');

    fireEvent.click(unit);
    fireEvent.click(screen.getByRole('option', { name: 'Grams' }));
    expect(unit).toHaveTextContent('Grams');

    // a manually-picked unit is not reset by further dose-form changes
    fireEvent.change(screen.getByLabelText('Dose form'), {
      target: { value: 'capsule' },
    });
    expect(unit).toHaveTextContent('Grams');
  });
});

describe('MedicationEditor — compound ingredients', () => {
  it('is hidden unless collecting ingredients for a compound', () => {
    renderEditor({ collectCompoundIngredients: true });
    expect(screen.queryByText('Ingredients')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add ingredient' })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Medication' }), {
      target: { value: 'triple antibiotic ointment' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Supply' }));
    expect(screen.queryByText('Ingredients')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add ingredient' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Compound' }));
    expect(screen.getByText('Ingredients')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add ingredient' })
    ).toBeInTheDocument();
    // the first row is pre-rendered — no click needed to start entering one
    expect(screen.getByLabelText('Drug, ingredient 1')).toHaveValue('');
  });

  it('is not shown without the collectCompoundIngredients prop', () => {
    renderEditor({
      medication: {
        id: 'm5',
        name: 'triple antibiotic ointment',
        status: 'unreconciled',
        uncodedType: 'CP',
      },
    });
    expect(
      screen.queryByRole('button', { name: 'Add ingredient' })
    ).not.toBeInTheDocument();
  });

  it('adds, fills, and removes ingredient rows; drops blank rows on save', () => {
    const { onSave } = renderEditor({
      collectCompoundIngredients: true,
      medication: {
        id: 'm6',
        name: 'triple antibiotic ointment',
        status: 'unreconciled',
        uncodedType: 'CP',
      },
    });

    // the first row is already there — fill it in directly
    fireEvent.change(screen.getByLabelText('Drug, ingredient 1'), {
      target: { value: 'bacitracin' },
    });
    fireEvent.change(screen.getByLabelText('Form, ingredient 1'), {
      target: { value: 'powder' },
    });
    fireEvent.change(screen.getByLabelText('Strength, ingredient 1'), {
      target: { value: '500 units' },
    });
    fireEvent.change(screen.getByLabelText('Quantity, ingredient 1'), {
      target: { value: '10' },
    });
    expect(
      screen.getByLabelText('Quantity unit, ingredient 1')
    ).toHaveTextContent('Grams');

    // a second, never-filled-in row is dropped on save
    fireEvent.click(screen.getByRole('button', { name: 'Add ingredient' }));
    expect(screen.getAllByLabelText(/^Drug, ingredient/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        uncodedType: 'CP',
        compoundIngredients: [
          expect.objectContaining({
            name: 'bacitracin',
            doseForm: 'powder',
            strength: '500 units',
            quantity: '10',
            quantityUnit: 'gram',
          }),
        ],
      })
    );
  });

  it('removing the only row clears it back to a blank placeholder', () => {
    renderEditor({
      collectCompoundIngredients: true,
      medication: {
        id: 'm7',
        name: 'triple antibiotic ointment',
        status: 'unreconciled',
        uncodedType: 'CP',
      },
    });
    fireEvent.change(screen.getByLabelText('Drug, ingredient 1'), {
      target: { value: 'bacitracin' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove ingredient 1' })
    );
    // a lone row resets rather than disappearing — there must always be a
    // row to enter the first ingredient into
    expect(screen.getByLabelText('Drug, ingredient 1')).toHaveValue('');
  });

  it('removes a second ingredient row entirely', () => {
    renderEditor({
      collectCompoundIngredients: true,
      medication: {
        id: 'm8',
        name: 'triple antibiotic ointment',
        status: 'unreconciled',
        uncodedType: 'CP',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add ingredient' }));
    expect(screen.getAllByLabelText(/^Drug, ingredient/)).toHaveLength(2);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove ingredient 2' })
    );
    expect(screen.getAllByLabelText(/^Drug, ingredient/)).toHaveLength(1);
  });
});
