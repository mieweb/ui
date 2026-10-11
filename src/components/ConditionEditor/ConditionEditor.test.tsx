import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithDarkTheme, renderWithTheme } from '../../test/test-utils';
import { ConditionEditor } from './ConditionEditor';
import { MessagesProvider } from '../../utils/messages';
import type { ConditionConcern } from '../ProblemList';

const concern: ConditionConcern = {
  concernId: 'concern-1',
  clinicalStatus: 'active',
  assertions: [
    {
      id: 'assertion-1',
      date: '2026-09-16',
      text: 'Essential hypertension',
      verificationStatus: 'confirmed',
      coding: [
        {
          system: 'ICD-10-CM',
          code: 'I10',
          display: 'Essential hypertension',
          primary: true,
        },
        {
          system: 'SNOMED',
          code: '59621000',
          display: 'Essential hypertension',
        },
      ],
    },
  ],
};

function editor(
  overrides: Partial<React.ComponentProps<typeof ConditionEditor>> = {}
) {
  const onOpenChange = vi.fn();
  const onSave = vi.fn();
  const view = renderWithTheme(
    <ConditionEditor
      mode="refine"
      open
      concern={concern}
      renderCodeSearch={false}
      onOpenChange={onOpenChange}
      onSave={onSave}
      {...overrides}
    />
  );
  return { ...view, onOpenChange, onSave };
}

describe('ConditionEditor', () => {
  it('uses the standard wide modal and aligned coding rows', () => {
    const { container } = editor();

    expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-2xl');
    expect(
      container.querySelectorAll('[data-slot="condition-coding-row"]')
    ).toHaveLength(2);
    const header = container.querySelector(
      '[data-slot="condition-coding-header"]'
    );
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('System');
    expect(header).toHaveTextContent('Code');
    expect(header).toHaveTextContent('Display');
  });

  it('distinguishes severity from its certainty controls', () => {
    editor();

    expect(screen.getByText('Severity', { selector: 'span' })).toBeVisible();
    expect(screen.getByText('Certainty', { selector: 'span' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Severity' })).toBeVisible();
    expect(
      screen.getByRole('group', { name: 'Certainty for Severity' })
    ).toBeVisible();
  });

  it('describes confidence without confusing it with the severity value', () => {
    editor();
    fireEvent.click(screen.getByRole('button', { name: 'moderate' }));
    const certainty = screen.getByRole('group', {
      name: 'Certainty for Severity',
    });

    fireEvent.click(
      within(certainty).getByRole('button', {
        name: 'Severity confidence medium',
      })
    );

    expect(
      screen.getByText('Uncertainty recorded: medium confidence in severity')
    ).toBeVisible();
  });

  it('adds and removes a coding row without detaching its controls', async () => {
    const user = userEvent.setup();
    const { container } = editor();

    await user.click(screen.getByRole('button', { name: 'Add code' }));
    expect(
      container.querySelectorAll('[data-slot="condition-coding-row"]')
    ).toHaveLength(3);
    expect(screen.getByLabelText('Coding system 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove code 3' }));
    expect(
      container.querySelectorAll('[data-slot="condition-coding-row"]')
    ).toHaveLength(2);
  });

  it('persists the selected primary code in the saved draft', async () => {
    const user = userEvent.setup();
    const { onSave } = editor();
    const rows = screen.getAllByRole('radio', { name: /^Primary code:/ });

    expect(
      screen.getByRole('radiogroup', { name: 'Primary display code' })
    ).toBeVisible();

    await user.click(rows[1]);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0];
    expect(saved.coding).toEqual([
      expect.objectContaining({ code: 'I10', primary: false }),
      expect.objectContaining({ code: '59621000', primary: true }),
    ]);
  });

  it('selects a fallback primary code when the primary row is removed', async () => {
    const user = userEvent.setup();
    const { onSave } = editor();

    await user.click(screen.getByRole('button', { name: 'Remove code 1' }));

    expect(
      screen.getByRole('radio', { name: 'Primary code: SNOMED 59621000' })
    ).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave.mock.calls[0][0].coding).toEqual([
      expect.objectContaining({ code: '59621000', primary: true }),
    ]);
  });

  it('persists exact onset as ISO and keeps exact and fuzzy onset exclusive', () => {
    const { onSave } = editor();
    const exact = screen.getByLabelText('Onset date (exact)');
    const fuzzy = screen.getByLabelText('Onset (fuzzy)');

    fireEvent.change(exact, { target: { value: '09/01/2020' } });
    fireEvent.change(fuzzy, { target: { value: 'since childhood' } });
    expect(exact).toHaveValue('');

    fireEvent.change(exact, { target: { value: '09/01/2020' } });
    expect(fuzzy).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave.mock.calls[0][0].onset).toEqual({
      date: '2020-09-01',
      fuzzy: undefined,
    });
  });

  it('prefers an exact onset when prior data also contains a fuzzy onset', () => {
    const conflictingOnsetConcern: ConditionConcern = {
      ...concern,
      assertions: concern.assertions.map((assertion) => ({
        ...assertion,
        onset: { date: '2020-09-01', fuzzy: 'since childhood' },
      })),
    };

    editor({ concern: conflictingOnsetConcern });

    expect(screen.getByLabelText('Onset date (exact)')).toHaveValue(
      '09/01/2020'
    );
    expect(screen.getByLabelText('Onset (fuzzy)')).toHaveValue('');
  });

  it.each(['09/01', '02/31/2020'])(
    'blocks an invalid exact onset date: %s',
    (onsetDate) => {
      const { onSave } = editor();
      const exact = screen.getByLabelText('Onset date (exact)');

      fireEvent.change(exact, { target: { value: onsetDate } });
      fireEvent.blur(exact);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(
        screen.getByText('Please enter a valid date (MM/DD/YYYY)')
      ).toBeVisible();
      expect(saveButton).toBeDisabled();
      fireEvent.click(saveButton);
      expect(onSave).not.toHaveBeenCalled();
    }
  );

  it('disables coding inputs when coding is explicitly unknown', () => {
    editor();
    const certainty = screen.getByRole('group', {
      name: 'Certainty for Coding',
    });

    fireEvent.click(within(certainty).getByRole('button', { name: 'Unknown' }));

    expect(screen.getByLabelText('Coding system 1')).toBeDisabled();
    expect(screen.getByLabelText('Code 1')).toBeDisabled();
    expect(screen.getByLabelText('Display 1')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add code' })).toBeDisabled();
  });

  it('uses semantic warning styling for revisions in dark mode', () => {
    renderWithDarkTheme(
      <ConditionEditor
        mode="revise"
        open
        concern={concern}
        renderCodeSearch={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass(
      'border-warning/30',
      'bg-warning/10',
      'dark:text-warning-200'
    );
  });
});

describe('ConditionEditor message localization', () => {
  it('translates controls and status labels while retaining clinical text, terminology and enum values', () => {
    const onSave = vi.fn();
    renderWithTheme(
      <MessagesProvider
        messages={{
          labels: {
            'Problem name': 'Nom du problème',
            Severity: 'Gravité',
            'Verification status': 'Statut',
            mild: 'Léger',
            Save: 'Enregistrer',
            Note: 'Remarque',
          },
        }}
      >
        <ConditionEditor
          mode="refine"
          open
          concern={concern}
          renderCodeSearch={false}
          onOpenChange={() => {}}
          onSave={onSave}
        />
      </MessagesProvider>
    );
    expect(screen.getByLabelText(/Nom du problème/)).toHaveValue(
      'Essential hypertension'
    );
    expect(screen.getByLabelText('Code 1')).toHaveValue('I10');
    expect(screen.getByRole('group', { name: 'Gravité' })).toBeInTheDocument();
    expect(screen.getByLabelText('Statut')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Léger' }));
    fireEvent.change(screen.getByLabelText('Remarque'), {
      target: { value: 'Patient-authored English note.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave.mock.calls[0][0]).toMatchObject({
      text: 'Essential hypertension',
      verificationStatus: 'confirmed',
      severity: 'mild',
      note: 'Patient-authored English note.',
      coding: [
        { system: 'ICD-10-CM', code: 'I10', display: 'Essential hypertension' },
        { system: 'SNOMED', code: '59621000' },
      ],
    });
  });
});
