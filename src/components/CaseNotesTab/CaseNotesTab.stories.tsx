import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseNotesTab,
  type CaseNoteInput,
  type CaseNoteItem,
} from './CaseNotesTab';

const meta: Meta<typeof CaseNotesTab> = {
  title: 'Components/Case Management/CaseNotesTab',
  component: CaseNotesTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const activityOptions = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'review', label: 'Case Review' },
];

const templateOptions = [
  {
    value: 'intro',
    label: 'Initial Contact',
    content: 'Made initial contact with the employee.\n\nDiscussed return-to-work plan.',
  },
];

const caseManagerOptions = [
  { value: 'Jane Smith', label: 'Jane Smith' },
  { value: 'John Doe', label: 'John Doe' },
];

const initialNotes: CaseNoteItem[] = [
  {
    id: 'n1',
    noteDate: '2025-08-01',
    activity: 'phone',
    caseManager: 'Jane Smith',
    notes: '<p>Spoke with the employee about their progress.</p>',
    dateEntered: '2025-08-01T10:00:00.000Z',
    currentVersion: 2,
    versions: [
      {
        id: 'v1',
        content: '<p>Initial call notes.</p>',
        editedBy: 'Jane Smith',
        editedAt: '2025-07-31T09:00:00.000Z',
      },
    ],
  },
  {
    id: 'n2',
    noteDate: '2025-08-05',
    activity: 'email',
    caseManager: 'John Doe',
    notes: '<p>Sent follow-up documentation.</p>',
    dateEntered: '2025-08-05T14:00:00.000Z',
    currentVersion: 1,
    isLocked: true,
    lockedBy: 'Admin',
  },
];

function Example() {
  const [notes, setNotes] = useState(initialNotes);

  const handleSave = (input: CaseNoteInput) => {
    if (input.id) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === input.id
            ? {
                ...n,
                noteDate: input.noteDate,
                activity: input.activity,
                caseManager: input.caseManager,
                notes: input.notes,
                currentVersion: n.currentVersion + 1,
                versions: [
                  ...(n.versions ?? []),
                  {
                    id: `v-${Date.now()}`,
                    content: n.notes,
                    editedBy: n.caseManager,
                    editedAt: n.dateEntered,
                  },
                ],
              }
            : n
        )
      );
    } else {
      setNotes((prev) => [
        ...prev,
        {
          id: `n-${Date.now()}`,
          noteDate: input.noteDate,
          activity: input.activity,
          caseManager: input.caseManager,
          notes: input.notes,
          dateEntered: new Date().toISOString(),
          currentVersion: 1,
          versions: [],
        },
      ]);
    }
  };

  return (
    <CaseNotesTab
      notes={notes}
      activityOptions={activityOptions}
      templateOptions={templateOptions}
      caseManagerOptions={caseManagerOptions}
      defaultCaseManager="Jane Smith"
      canLock
      onSaveNote={handleSave}
      onDeleteNote={(id) =>
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lineout: true } : n))
        )
      }
      onToggleLock={(id) =>
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isLocked: !n.isLocked } : n))
        )
      }
      renderDiff={(oldContent, newContent) =>
        `<del>${oldContent}</del><ins>${newContent}</ins>`
      }
      quickAbsenceStatusOptions={[
        { value: 'FD', label: 'FD -- Full Duty' },
        { value: 'LWD', label: 'LWD -- Lost Work Days' },
        { value: 'OTH', label: 'OTH -- Other' },
      ]}
      onQuickAddAbsence={() => {}}
      quickRestrictionOptions={[
        { value: 'No Lifting Over 25 lbs', label: 'No Lifting Over 25 lbs' },
      ]}
      onQuickAddRestriction={() => {}}
      onQuickAddTodo={() => {}}
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
