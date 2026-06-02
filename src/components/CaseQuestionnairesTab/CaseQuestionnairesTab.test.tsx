import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseQuestionnairesTab } from './CaseQuestionnairesTab';

describe('CaseQuestionnairesTab', () => {
  it('renders the DAR action toggles', () => {
    renderWithTheme(<CaseQuestionnairesTab />);
    expect(screen.getByLabelText('Set DAR Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Send Letter')).toBeInTheDocument();
    expect(screen.getByLabelText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByLabelText('Add Attachment')).toBeInTheDocument();
    expect(screen.getByLabelText('LTD App Submission')).toBeInTheDocument();
  });

  it('defaults the response date to Auto-generated', () => {
    renderWithTheme(<CaseQuestionnairesTab />);
    expect(screen.getByText('Auto-generated')).toBeInTheDocument();
  });

  it('calls onCreateDAR when the button is clicked', () => {
    const onCreateDAR = vi.fn();
    renderWithTheme(<CaseQuestionnairesTab onCreateDAR={onCreateDAR} />);
    fireEvent.click(screen.getByRole('button', { name: /create dar/i }));
    expect(onCreateDAR).toHaveBeenCalledTimes(1);
  });

  it('emits the full action set when a toggle changes', () => {
    const onActionsChange = vi.fn();
    renderWithTheme(
      <CaseQuestionnairesTab onActionsChange={onActionsChange} />
    );
    fireEvent.click(screen.getByLabelText('Send Letter'));
    expect(onActionsChange).toHaveBeenCalledWith(
      expect.objectContaining({ sendLetter: true, setTask: false })
    );
  });

  it('emits notes changes', () => {
    const onNotesChange = vi.fn();
    renderWithTheme(<CaseQuestionnairesTab onNotesChange={onNotesChange} />);
    fireEvent.change(screen.getByPlaceholderText('Additional notes...'), {
      target: { value: 'hello' },
    });
    expect(onNotesChange).toHaveBeenCalledWith('hello');
  });
});
