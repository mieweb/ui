import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CreateCaseWizard,
  type OpenCaseSummary,
  type WizardEmployee,
} from './CreateCaseWizard';
import { Input } from '../Input';

const caseTypeOptions = [
  {
    value: 'Occupational injury / illness',
    label: 'Occupational injury / illness',
  },
  {
    value: 'Non-occupational injury / illness',
    label: 'Non-occupational injury / illness',
  },
];
const caseManagerOptions = [
  { value: 'Unassigned', label: 'Unassigned' },
  { value: 'Jane Smith', label: 'Jane Smith' },
];

const openCases: OpenCaseSummary[] = [
  { caseNumber: 'C-1', caseType: 'X', status: 'Open' },
];

function renderWizard(
  overrides: Partial<React.ComponentProps<typeof CreateCaseWizard>> = {}
) {
  const onCreateCase = vi.fn();
  const onComplete = vi.fn();
  const employee: WizardEmployee = {
    name: 'Alex Employee',
    number: 'E-1001',
    location: 'Main Plant',
  };
  renderWithTheme(
    <CreateCaseWizard
      onComplete={onComplete}
      onCreateCase={onCreateCase}
      caseTypeOptions={caseTypeOptions}
      caseManagerOptions={caseManagerOptions}
      renderEmployeeSearch={(onSelect) => (
        <Input
          aria-label="Employee search"
          onKeyDown={(e) => e.key === 'Enter' && onSelect(employee)}
        />
      )}
      {...overrides}
    />
  );
  return { onCreateCase, onComplete };
}

describe('CreateCaseWizard', () => {
  it('renders step 1 by default', () => {
    renderWizard();
    expect(
      screen.getAllByText('Employee Information').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('populates employee fields from the search slot', () => {
    renderWizard();
    fireEvent.keyDown(screen.getByLabelText('Employee search'), {
      key: 'Enter',
    });
    expect(
      (screen.getByLabelText('Employee Number') as HTMLInputElement).value
    ).toBe('E-1001');
  });

  it('warns about open cases for the selected employee', () => {
    renderWizard({ findOpenCases: () => openCases });
    fireEvent.keyDown(screen.getByLabelText('Employee search'), {
      key: 'Enter',
    });
    expect(screen.getByText('Open Cases Found')).toBeInTheDocument();
  });

  it('advances through steps and creates a case', () => {
    const { onCreateCase, onComplete } = renderWizard();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(
      screen.getByRole('heading', { name: 'Review & Create' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Create Case/ }));
    expect(onCreateCase).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('disables the Back button on the first step', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled();
  });
});
