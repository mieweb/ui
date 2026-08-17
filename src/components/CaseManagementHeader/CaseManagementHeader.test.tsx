import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { CaseManagementHeader, CaseContextBar } from './CaseManagementHeader';

const caseInfo = {
  caseNumber: 'S2025-0001',
  status: 'Open',
  caseType: 'Absence management',
  daysOpen: 568,
};

const patient = { name: 'Eleanor Washburn', mrn: 'MR-004821' };

const details = [
  { label: 'Case Manager', value: 'Unassigned' },
  { label: 'Opened', value: 'Jan 21, 2025' },
];

describe('CaseContextBar', () => {
  it('renders case number, status, and type', () => {
    renderWithTheme(<CaseContextBar caseInfo={caseInfo} />);
    const caseNumber = screen.getByText('#S2025-0001');
    expect(caseNumber).toBeInTheDocument();
    expect(caseNumber).toHaveAttribute('title', 'Case# S2025-0001');
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Absence management')).toBeInTheDocument();
  });

  it('supports translated labels', () => {
    renderWithTheme(
      <CaseContextBar
        caseInfo={caseInfo}
        labels={{ caseNumberTooltip: (n) => `Fall Nr. ${n}` }}
      />
    );
    expect(screen.getByText('#S2025-0001')).toHaveAttribute(
      'title',
      'Fall Nr. S2025-0001'
    );
  });
});

describe('CaseManagementHeader', () => {
  it('renders patient name with MRN and DOB placeholder', () => {
    renderWithTheme(
      <CaseManagementHeader caseInfo={caseInfo} patient={patient} />
    );
    expect(screen.getByText('Eleanor Washburn')).toBeInTheDocument();
    expect(screen.getByText('MRN: MR-004821')).toBeInTheDocument();
    expect(screen.getByText('DOB: \u2014')).toBeInTheDocument();
  });

  it('hides details until the toggle is expanded', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        details={details}
      />
    );
    expect(screen.queryByText('Case Manager')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Show case details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByText('Case Manager')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    // Built-in days-open item is appended to the grid.
    expect(screen.getByText('Days Open')).toBeInTheDocument();
    expect(screen.getByText('568')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Hide case details' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('computes days open from openedDate when daysOpen is omitted', async () => {
    const user = userEvent.setup();
    const opened = new Date(Date.now() - 3 * 86_400_000).toISOString();
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={{ caseNumber: 'X', status: 'Open', openedDate: opened }}
        patient={patient}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Show case details' }));
    expect(screen.getByText('Days Open')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('supports controlled expansion', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        details={details}
        expanded={false}
        onExpandedChange={onExpandedChange}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Show case details' }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    // Controlled: stays collapsed without a prop change.
    expect(screen.queryByText('Case Manager')).not.toBeInTheDocument();
  });

  it('omits the toggle when there are no details', () => {
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={{ caseNumber: 'X', status: 'Open' }}
        patient={patient}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Show case details' })
    ).not.toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        showBackButton
        onBack={onBack}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('hides the context bar when showContextBar is false', () => {
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        showContextBar={false}
      />
    );
    expect(screen.queryByTestId('case-context-bar')).not.toBeInTheDocument();
  });

  it('renders the alert slot', () => {
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        alert={<div role="alert">Complete these required fields</div>}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Complete these required fields'
    );
  });

  it('renders age next to the DOB when provided', () => {
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={{ ...patient, dob: '03/18/1978', age: 48 }}
      />
    );
    expect(screen.getByText('DOB: 03/18/1978 (48 y.o.)')).toBeInTheDocument();
  });

  it('wraps actions in a ButtonGroup', () => {
    const { container } = renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        actions={<button>Custom Action</button>}
      />
    );
    const group = container.querySelector('[data-slot="button-group"]');
    expect(group).toHaveTextContent('Custom Action');
  });

  it('renders built-in actions with mobile twins and fires their callbacks', async () => {
    const user = userEvent.setup();
    const onAddCaseNote = vi.fn();
    const onCloseCase = vi.fn();
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        onAddCaseNote={onAddCaseNote}
        onCloseCase={onCloseCase}
      />
    );
    // Each action ships a desktop text button plus an icon-only mobile twin.
    const addButtons = screen.getAllByRole('button', { name: 'Add Case Note' });
    const closeButtons = screen.getAllByRole('button', { name: 'Close Case' });
    expect(addButtons).toHaveLength(2);
    expect(closeButtons).toHaveLength(2);

    await user.click(addButtons[0]);
    await user.click(addButtons[1]);
    expect(onAddCaseNote).toHaveBeenCalledTimes(2);

    await user.click(closeButtons[0]);
    expect(onCloseCase).toHaveBeenCalledTimes(1);
  });

  it('supports translated labels for the built-in actions', () => {
    renderWithTheme(
      <CaseManagementHeader
        caseInfo={caseInfo}
        patient={patient}
        onAddCaseNote={() => {}}
        labels={{ addCaseNote: 'Notiz hinzuf\u00fcgen' }}
      />
    );
    expect(
      screen.getAllByRole('button', { name: 'Notiz hinzuf\u00fcgen' })
    ).toHaveLength(2);
  });
});
