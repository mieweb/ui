import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseDetailsTab,
  type CaseDetailsValue,
  type CaseSelectOption,
  type CloseCasePayload,
} from './CaseDetailsTab';

const statusOptions = ['Open', 'Closed'].map((x) => ({ value: x, label: x }));
const caseTypeOptions = [{ value: 'STD', label: 'Short Term Disability' }];
const caseManagerOptions = [{ value: 'Jane Smith', label: 'Jane Smith' }];
const closureReasonOptions = [{ value: 'RTW', label: 'Returned to Work' }];
const adjusterOptions: CaseSelectOption[] = [
  { value: 'a1', label: 'Sarah Johnson', phone: '(555) 111-2222', email: 's@x.com' },
];

function Harness({
  initial = {},
  onCloseCase,
  openTodos,
}: {
  initial?: CaseDetailsValue;
  onCloseCase?: (p: CloseCasePayload) => void;
  openTodos?: { id: string; activity: string }[];
}) {
  const [value, setValue] = useState<CaseDetailsValue>(initial);
  return (
    <CaseDetailsTab
      value={value}
      onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
      statusOptions={statusOptions}
      caseTypeOptions={caseTypeOptions}
      caseManagerOptions={caseManagerOptions}
      closureReasonOptions={closureReasonOptions}
      adjusterOptions={adjusterOptions}
      openTodos={openTodos}
      onCloseCase={onCloseCase}
    />
  );
}

describe('CaseDetailsTab', () => {
  it('renders section headers', () => {
    renderWithTheme(<Harness />);
    expect(screen.getByText('Case Information')).toBeInTheDocument();
    expect(screen.getByText('Work Comp Details')).toBeInTheDocument();
  });

  it('edits a text field through onChange', () => {
    renderWithTheme(<Harness />);
    const input = screen.getByLabelText('Case severity');
    fireEvent.change(input, { target: { value: 'High' } });
    expect((input as HTMLInputElement).value).toBe('High');
  });

  it('auto-fills adjuster contact info on selection', async () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Adjuster' }));
    fireEvent.click(screen.getByRole('option', { name: 'Sarah Johnson' }));
    await waitFor(() => {
      expect((screen.getByLabelText('Adjuster Phone') as HTMLInputElement).value).toBe(
        '(555) 111-2222'
      );
    });
  });

  it('shows a confidential warning before marking confidential', async () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByLabelText('Confidential Case'));
    expect(
      await screen.findByText('Mark Case as Confidential?')
    ).toBeInTheDocument();
  });

  it('opens the close-case review when there are open to-dos', async () => {
    const onCloseCase = vi.fn();
    renderWithTheme(
      <Harness
        onCloseCase={onCloseCase}
        openTodos={[{ id: 't1', activity: 'Verify RTW' }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close Case' }));
    expect(
      await screen.findByText('Close Case - Review Open Items')
    ).toBeInTheDocument();
  });
});
