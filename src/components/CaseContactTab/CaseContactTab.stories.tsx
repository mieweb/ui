import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseContactTab,
  type CaseContactRow,
  type ContactSearchResult,
  type PreviousCaseContacts,
} from './CaseContactTab';

const meta: Meta<typeof CaseContactTab> = {
  title: 'Components/Case Management/CaseContactTab',
  component: CaseContactTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const available: ContactSearchResult[] = [
  {
    id: 'c1',
    name: 'Dr. Emily Carter',
    email: 'ecarter@clinic.com',
    phone: '(555) 111-2222',
    type: ['Physician'],
  },
  {
    id: 'c2',
    name: 'Mark Stevens',
    email: 'mstevens@adjusters.com',
    phone: '(555) 333-4444',
    type: ['Adjuster'],
  },
];

const initialContacts: CaseContactRow[] = [
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

const previousCases: PreviousCaseContacts[] = [
  {
    caseNumber: '20240101-0001',
    caseType: 'STD',
    contacts: [
      {
        id: 'p1',
        contactId: 'c2',
        name: 'Mark Stevens',
        email: 'mstevens@adjusters.com',
        phone: '(555) 333-4444',
        type: ['Adjuster'],
        relationship: 'Claims Adjuster',
        isPrimary: false,
        isActive: true,
        caseNumber: '20240101-0001',
      },
    ],
  },
];

function Example() {
  const [contacts, setContacts] = useState(initialContacts);

  return (
    <CaseContactTab
      contacts={contacts}
      availableContacts={available}
      contactTypes={[
        { value: 'physician', label: 'Treating Physician' },
        { value: 'adjuster', label: 'Claims Adjuster' },
        { value: 'attorney', label: 'Attorney' },
      ]}
      previousCases={previousCases}
      onAddContact={({ contact, relationship, isPrimary }) =>
        setContacts((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            contactId: contact.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            type: contact.type,
            relationship,
            isPrimary,
            isActive: true,
            caseNumber: '20251101-2234',
          },
        ])
      }
      onRemoveContact={(id) =>
        setContacts((prev) => prev.filter((c) => c.id !== id))
      }
      onImportContacts={(from, ids) =>
        window.alert(`Import ${ids.length} from ${from}`)
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
