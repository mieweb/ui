import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseLettersTab, type CaseLetter } from './CaseLettersTab';

const letters: CaseLetter[] = [
  {
    id: '1',
    letterType: 'Welcome Letter',
    template: 'welcome-letter',
    sentFrom: 'Jane Doe',
    content: '<p>Hello</p>',
    createdDate: '2025-09-01',
    status: 'Sent',
    attachmentItemTypes: ['eap-flyer'],
  },
];

const templates = [
  {
    code: 'welcome-letter',
    name: 'Welcome Letter',
    content: '<p>Hi</p>',
    active: true,
  },
];

const caseManagers = [{ value: 'Jane Doe', label: 'Jane Doe' }];

function setup(overrides = {}) {
  const onSaveDraft = vi.fn();
  const onSendLetter = vi.fn();
  const onDeleteLetter = vi.fn();
  renderWithTheme(
    <CaseLettersTab
      letters={letters}
      templates={templates}
      caseManagers={caseManagers}
      defaultSentFrom="Jane Doe"
      onSaveDraft={onSaveDraft}
      onSendLetter={onSendLetter}
      onDeleteLetter={onDeleteLetter}
      {...overrides}
    />
  );
  return { onSaveDraft, onSendLetter, onDeleteLetter };
}

describe('CaseLettersTab', () => {
  it('renders the letter count and existing letter', () => {
    setup();
    expect(screen.getByText('1 letter for this case')).toBeInTheDocument();
    expect(screen.getByText('welcome-letter')).toBeInTheDocument();
  });

  it('opens the editor when creating a letter', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Create Letter/ }));
    expect(screen.getByText('Letter Sent From')).toBeInTheDocument();
  });

  it('saves a draft from the editor', () => {
    const { onSaveDraft } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Create Letter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    expect(onSaveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ sentFrom: 'Jane Doe' })
    );
  });

  it('sends a letter from the editor', () => {
    const { onSendLetter } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Create Letter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Letter' }));
    expect(onSendLetter).toHaveBeenCalled();
  });

  it('deletes a letter after confirmation', () => {
    const { onDeleteLetter } = setup();
    fireEvent.click(screen.getByLabelText('Delete letter: Welcome Letter'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteLetter).toHaveBeenCalledWith('1');
  });

  it('hides Save as Template when no callback is provided', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Create Letter/ }));
    expect(
      screen.queryByRole('button', { name: 'Save as Template' })
    ).not.toBeInTheDocument();
  });
});
