import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseContactTab,
  type CaseContactRow,
  type ContactSearchResult,
} from './CaseContactTab';

const available: ContactSearchResult[] = [
  {
    id: 'c1',
    name: 'Dr. Emily Carter',
    email: 'ecarter@clinic.com',
    phone: '(555) 111-2222',
    type: ['Physician'],
  },
];

const contacts: CaseContactRow[] = [
  {
    id: '1',
    contactId: 'c1',
    name: 'Dr. Emily Carter',
    email: 'ecarter@clinic.com',
    phone: '(555) 111-2222',
    type: ['Physician'],
    relationship: 'Treating Physician',
    isPrimary: true,
    isActive: true,
    caseNumber: '20251101-2234',
  },
];

function setup(overrides = {}) {
  const onAddContact = vi.fn();
  const onRemoveContact = vi.fn();
  renderWithTheme(
    <CaseContactTab
      contacts={contacts}
      availableContacts={available}
      contactTypes={[{ value: 'physician', label: 'Treating Physician' }]}
      onAddContact={onAddContact}
      onRemoveContact={onRemoveContact}
      {...overrides}
    />
  );
  return { onAddContact, onRemoveContact };
}

describe('CaseContactTab', () => {
  it('renders the contacts table', () => {
    setup();
    expect(screen.getByText('Dr. Emily Carter')).toBeInTheDocument();
    expect(screen.getByText('Treating Physician')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 contacts')).toBeInTheDocument();
  });

  it('calls onRemoveContact when the remove button is clicked', () => {
    const { onRemoveContact } = setup();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Dr. Emily Carter' })
    );
    expect(onRemoveContact).toHaveBeenCalledWith('1');
  });

  it('opens the add-contact dialog', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    expect(screen.getByText('Add Contact to Case')).toBeInTheDocument();
  });

  it('hides the import button when onImportContacts is not provided', () => {
    setup();
    expect(
      screen.queryByRole('button', { name: /import from previous case/i })
    ).not.toBeInTheDocument();
  });

  it('shows the import button when onImportContacts is provided', () => {
    setup({ onImportContacts: vi.fn(), previousCases: [] });
    expect(
      screen.getByRole('button', { name: /import from previous case/i })
    ).toBeInTheDocument();
  });
});
