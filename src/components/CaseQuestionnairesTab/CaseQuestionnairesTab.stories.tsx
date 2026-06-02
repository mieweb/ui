import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CaseQuestionnairesTab,
  type DARActions,
} from './CaseQuestionnairesTab';

const meta: Meta<typeof CaseQuestionnairesTab> = {
  title: 'Components/Case Management/CaseQuestionnairesTab',
  component: CaseQuestionnairesTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function ControlledExample() {
  const [actions, setActions] = useState<DARActions>({
    setTask: true,
    sendLetter: false,
    createInvoice: false,
    addAttachment: false,
    ltdSubmission: false,
  });
  const [notes, setNotes] = useState('Follow up next week.');

  return (
    <CaseQuestionnairesTab
      responseDate="09/06/2025"
      actions={actions}
      onActionsChange={setActions}
      notes={notes}
      onNotesChange={setNotes}
      onCreateDAR={() => window.alert('Create DAR')}
    />
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
};
