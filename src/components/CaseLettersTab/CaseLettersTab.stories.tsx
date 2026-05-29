import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseLettersTab,
  type CaseLetter,
  type CaseLetterInput,
} from './CaseLettersTab';

const meta: Meta<typeof CaseLettersTab> = {
  title: 'Components/Case Management/CaseLettersTab',
  component: CaseLettersTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const templates = [
  {
    code: 'welcome-letter',
    name: 'Welcome Letter',
    content: '<p>Dear {{employeeName}},</p><p>Welcome to your case.</p>',
    active: true,
  },
  { code: 'std-approval', name: 'STD Approval', content: '<p>Your STD claim is approved.</p>', active: true },
];

const caseManagers = [
  { value: 'Jane Doe', label: 'Jane Doe' },
  { value: 'John Smith', label: 'John Smith' },
];

const initial: CaseLetter[] = [
  {
    id: '1',
    letterType: 'Welcome Letter',
    template: 'welcome-letter',
    sentFrom: 'Jane Doe',
    content: '<p>Dear Employee, welcome.</p>',
    createdDate: '2025-09-01',
    status: 'Sent',
    sentDate: '2025-09-01',
    attachmentItemTypes: ['eap-flyer', 'maven-flyer', 'nj-forms'],
  },
];

function Example() {
  const [letters, setLetters] = useState(initial);

  const upsert = (input: CaseLetterInput, status: 'Draft' | 'Sent') => {
    setLetters((prev) => {
      if (input.id) {
        return prev.map((l) =>
          l.id === input.id
            ? { ...l, ...input, status, sentDate: status === 'Sent' ? new Date().toISOString() : l.sentDate }
            : l
        );
      }
      return [
        ...prev,
        {
          id: `${Date.now()}`,
          letterType: input.letterType,
          template: input.template,
          sentFrom: input.sentFrom,
          content: input.content,
          attachmentItemTypes: input.attachmentItemTypes,
          createdDate: new Date().toISOString(),
          sentDate: status === 'Sent' ? new Date().toISOString() : undefined,
          status,
        },
      ];
    });
  };

  return (
    <CaseLettersTab
      letters={letters}
      templates={templates}
      caseManagers={caseManagers}
      defaultSentFrom="Jane Doe"
      onSaveDraft={(input) => upsert(input, 'Draft')}
      onSendLetter={(input) => upsert(input, 'Sent')}
      onDeleteLetter={(id) => setLetters((prev) => prev.filter((l) => l.id !== id))}
      onSaveAsTemplate={(t) => window.alert(`Saved template ${t.code}`)}
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
