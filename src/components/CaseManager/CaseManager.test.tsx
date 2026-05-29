import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseManager, type CaseManagerTab } from './CaseManager';

const tabs: CaseManagerTab[] = [
  { value: 'case', label: 'Case', content: <p>Case details content</p> },
  { value: 'contact', label: 'Contacts', content: <p>Contacts content</p> },
  { value: 'activity', label: 'Activity', content: <p>Activity content</p> },
];

const summary = {
  employeeName: 'Alex Employee',
  caseNumber: '20240115-A1',
  status: 'Open',
  caseManager: 'Jane Smith',
};

describe('CaseManager', () => {
  it('renders the case summary header', () => {
    renderWithTheme(<CaseManager summary={summary} tabs={tabs} />);
    expect(screen.getByText('Alex Employee')).toBeInTheDocument();
    expect(screen.getByText('20240115-A1')).toBeInTheDocument();
  });

  it('shows the first tab content by default', () => {
    renderWithTheme(<CaseManager summary={summary} tabs={tabs} />);
    expect(screen.getByText('Case details content')).toBeInTheDocument();
  });

  it('expands the header to show details and restrictions', () => {
    renderWithTheme(
      <CaseManager
        summary={summary}
        tabs={tabs}
        activeRestrictions={[{ id: 'r1', label: 'No lifting' }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand details' }));
    expect(screen.getByText('No lifting')).toBeInTheDocument();
  });

  it('opens the quick-note window and validates required fields', () => {
    const onSaveNote = vi.fn();
    renderWithTheme(
      <CaseManager summary={summary} tabs={tabs} onSaveNote={onSaveNote} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Case Note/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Note' }));
    expect(onSaveNote).not.toHaveBeenCalled();
    expect(screen.getByText(/Please fill in the required/)).toBeInTheDocument();
  });

  it('hides the Add Case Note control when onSaveNote is omitted', () => {
    renderWithTheme(<CaseManager summary={summary} tabs={tabs} />);
    expect(
      screen.queryByRole('button', { name: /Add Case Note/ })
    ).not.toBeInTheDocument();
  });
});
