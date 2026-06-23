import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import {
  AIReconciliationPanel,
  defaultReconciliationIsEqual,
  type ReconciliationProposal,
} from './Reconciliation';

const basicSource = { label: "Driver's License" };

const baseProposals: ReconciliationProposal[] = [
  {
    id: 'fullName',
    label: 'Legal name',
    current: 'old name',
    proposed: 'New Name',
    confidence: 0.95,
  },
  {
    id: 'dob',
    label: 'Date of birth',
    current: null,
    proposed: '1990-04-12',
    confidence: 0.92,
  },
  {
    id: 'license',
    label: 'License number',
    current: '',
    proposed: 'OH-D123',
    confidence: 0.4,
    hint: 'Low confidence',
  },
];

describe('defaultReconciliationIsEqual', () => {
  it('treats null/undefined/empty string as equal', () => {
    expect(defaultReconciliationIsEqual(null, '')).toBe(true);
    expect(defaultReconciliationIsEqual(undefined, '')).toBe(true);
    expect(defaultReconciliationIsEqual('', null)).toBe(true);
  });

  it('normalizes string whitespace and case', () => {
    expect(defaultReconciliationIsEqual('Jane Public', 'jane  public')).toBe(
      true
    );
  });

  it('compares Dates by epoch', () => {
    const d1 = new Date('2020-01-01');
    const d2 = new Date('2020-01-01');
    expect(defaultReconciliationIsEqual(d1, d2)).toBe(true);
  });

  it('returns false for genuinely different values', () => {
    expect(defaultReconciliationIsEqual('a', 'b')).toBe(false);
  });
});

describe('AIReconciliationPanel', () => {
  it('renders title, description, and only differing rows', () => {
    renderWithTheme(
      <AIReconciliationPanel
        title="Update your profile"
        description="Pick which to apply."
        source={basicSource}
        proposals={[
          ...baseProposals,
          {
            id: 'same',
            label: 'Already matches',
            current: 'Hello',
            proposed: 'hello',
          },
        ]}
        onApply={vi.fn()}
      />
    );

    expect(screen.getByText('Update your profile')).toBeInTheDocument();
    expect(screen.getByText('Pick which to apply.')).toBeInTheDocument();
    expect(screen.getByText('Legal name')).toBeInTheDocument();
    expect(screen.getByText('Date of birth')).toBeInTheDocument();
    expect(screen.getByText('License number')).toBeInTheDocument();
    expect(screen.queryByText('Already matches')).not.toBeInTheDocument();
  });

  it('defaults low-confidence rows to unchecked, high to checked', () => {
    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
      />
    );

    const nameCheckbox = screen.getByRole('checkbox', {
      name: /apply update for legal name/i,
    });
    const licenseCheckbox = screen.getByRole('checkbox', {
      name: /apply update for license number/i,
    });
    expect(nameCheckbox).toBeChecked();
    expect(licenseCheckbox).not.toBeChecked();
  });

  it('calls onApply with only accepted rows and their values', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={baseProposals}
        onApply={onApply}
      />
    );

    // Apply button label reflects accepted count (2 of 3 default-on)
    const applyBtn = screen.getByRole('button', { name: /apply 2 updates/i });
    await user.click(applyBtn);

    expect(onApply).toHaveBeenCalledTimes(1);
    const accepted = onApply.mock.calls[0][0] as Array<{
      id: string;
      value: unknown;
    }>;
    expect(accepted.map((a) => a.id).sort()).toEqual(['dob', 'fullName']);
    expect(accepted.find((a) => a.id === 'fullName')?.value).toBe('New Name');
  });

  it('bulk toggle selects and deselects all non-required rows', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
      />
    );

    const bulk = screen.getByRole('checkbox', { name: /accept all/i });
    await user.click(bulk);

    const licenseCheckbox = screen.getByRole('checkbox', {
      name: /apply update for license number/i,
    });
    expect(licenseCheckbox).toBeChecked();

    const rejectAll = screen.getByRole('checkbox', { name: /reject all/i });
    await user.click(rejectAll);

    expect(licenseCheckbox).not.toBeChecked();
  });

  it('disables apply when nothing is accepted', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
      />
    );

    const nameCheckbox = screen.getByRole('checkbox', {
      name: /apply update for legal name/i,
    });
    const dobCheckbox = screen.getByRole('checkbox', {
      name: /apply update for date of birth/i,
    });
    await user.click(nameCheckbox);
    await user.click(dobCheckbox);

    const applyBtn = screen.getByRole('button', { name: /apply 0 updates/i });
    expect(applyBtn).toBeDisabled();
  });

  it('fires onSkip when skip button is clicked', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
        onSkip={onSkip}
      />
    );

    await user.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('required rows cannot be unchecked', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={[
          {
            id: 'fullName',
            label: 'Legal name',
            current: 'old',
            proposed: 'new',
            required: true,
          },
        ]}
        onApply={vi.fn()}
      />
    );

    const cb = screen.getByRole('checkbox', {
      name: /apply update for legal name/i,
    });
    expect(cb).toBeChecked();
    expect(cb).toBeDisabled();
    await user.click(cb);
    expect(cb).toBeChecked();
  });

  it('renders nothing in panel variant when all proposals match', () => {
    const onNothing = vi.fn();
    const { container } = renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={[
          {
            id: 'fullName',
            label: 'Legal name',
            current: 'Same',
            proposed: 'same',
          },
        ]}
        onApply={vi.fn()}
        onNothingToReconcile={onNothing}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(onNothing).toHaveBeenCalledTimes(1);
  });

  it('inline editor updates the value sent to onApply', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(
      <AIReconciliationPanel
        title="t"
        source={basicSource}
        proposals={[
          {
            id: 'fullName',
            label: 'Legal name',
            current: 'Old',
            proposed: 'New',
            renderEditor: (value, onChange) => (
              <input
                type="text"
                aria-label="edit legal name"
                value={String(value ?? '')}
                onChange={(e) => onChange(e.target.value)}
              />
            ),
          },
        ]}
        onApply={onApply}
      />
    );

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    const input = screen.getByRole('textbox', { name: /edit legal name/i });
    await user.clear(input);
    await user.type(input, 'Edited');

    await user.click(screen.getByRole('button', { name: /apply 1 update/i }));

    expect(onApply).toHaveBeenCalledTimes(1);
    const accepted = onApply.mock.calls[0][0] as Array<{
      id: string;
      value: unknown;
    }>;
    expect(accepted[0]).toEqual({ id: 'fullName', value: 'Edited' });
  });

  it('modal variant renders inside dialog when open', () => {
    renderWithTheme(
      <AIReconciliationPanel
        title="Confirm scan"
        variant="modal"
        open
        onOpenChange={vi.fn()}
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Confirm scan')).toBeInTheDocument();
    expect(within(dialog).getByText('Legal name')).toBeInTheDocument();
  });

  it('modal variant does not render when closed', () => {
    renderWithTheme(
      <AIReconciliationPanel
        title="Confirm scan"
        variant="modal"
        open={false}
        onOpenChange={vi.fn()}
        source={basicSource}
        proposals={baseProposals}
        onApply={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
