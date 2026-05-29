import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseNotesTab, type CaseNoteItem } from './CaseNotesTab';

const activityOptions = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
];
const caseManagerOptions = [{ value: 'Jane Smith', label: 'Jane Smith' }];

const notes: CaseNoteItem[] = [
  {
    id: 'n1',
    noteDate: '2025-08-01',
    activity: 'phone',
    caseManager: 'Jane Smith',
    notes: '<p>Spoke with the employee.</p>',
    dateEntered: '2025-08-01T10:00:00.000Z',
    currentVersion: 1,
    versions: [],
  },
];

function setup(overrides = {}) {
  const onSaveNote = vi.fn();
  const onDeleteNote = vi.fn();
  const onToggleLock = vi.fn();
  renderWithTheme(
    <CaseNotesTab
      notes={notes}
      activityOptions={activityOptions}
      caseManagerOptions={caseManagerOptions}
      defaultCaseManager="Jane Smith"
      onSaveNote={onSaveNote}
      onDeleteNote={onDeleteNote}
      onToggleLock={onToggleLock}
      {...overrides}
    />
  );
  return { onSaveNote, onDeleteNote, onToggleLock };
}

describe('CaseNotesTab', () => {
  it('renders the note count and existing notes', () => {
    setup();
    expect(screen.getByText('1 note for this case')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('deletes a note', () => {
    const { onDeleteNote } = setup();
    fireEvent.click(screen.getByLabelText('Delete note: phone'));
    expect(onDeleteNote).toHaveBeenCalledWith('n1');
  });

  it('opens the editor and validates required fields', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Add Case Note/ }));
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /Create Note/ })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Note' }));
    expect(
      screen.getByText(/Please fill in the required fields/)
    ).toBeInTheDocument();
  });

  it('creates a note with required fields filled', async () => {
    const { onSaveNote } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Add Case Note/ }));
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /Create Note/ })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Note activity' }));
    fireEvent.click(screen.getByRole('option', { name: 'Phone Call' }));
    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { innerHTML: 'New note content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Note' }));
    expect(onSaveNote).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'phone', notes: expect.any(String) })
    );
  });

  it('toggles a note lock when permitted', () => {
    const { onToggleLock } = setup({ canLock: true });
    fireEvent.click(screen.getByLabelText('Lock note: phone'));
    expect(onToggleLock).toHaveBeenCalledWith('n1');
  });
});
