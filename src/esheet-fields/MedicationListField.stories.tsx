import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EsheetRenderer,
  registerMedicationListFieldType,
  type FormDefinition,
} from '../esheet';

// Register the custom field type once, before any story renders.
registerMedicationListFieldType();

const SAMPLE_FORM = {
  id: 'med-rec-demo',
  title: 'Encounter — Medication Reconciliation',
  fields: [
    {
      id: 'meds',
      fieldType: 'medicationList',
      question: 'Presenting medications',
      medications: [
        { id: '1', name: 'calcium 500 mg tablet', status: 'unreconciled' },
        {
          id: '2',
          name: 'Lasix 20 mg tablet',
          sig: '1 tablet by mouth weekly; take if weight greater than 149 pounds',
          status: 'unreconciled',
        },
        {
          id: '3',
          name: 'lisinopril 10 mg tablet',
          status: 'unreconciled',
          expired: true,
        },
        { id: '4', name: 'Coumadin 5 mg tablet', status: 'taking' },
        {
          id: '5',
          name: 'ibuprofen 600 mg tablet',
          sig: 'As needed pain, not to exceed 4 tablets in 24 hours period',
          status: 'taking-noncompliant',
          expired: true,
        },
        {
          id: '6',
          name: 'aspirin 81 mg tablet,delayed release',
          status: 'not-taking',
          expired: true,
        },
      ],
      quickAddOptions: [
        'aspirin 81 mg tablet',
        'atorvastatin 20 mg tablet',
        'metformin 500 mg tablet',
      ],
    },
  ],
} as unknown as FormDefinition;

const meta: Meta<typeof EsheetRenderer> = {
  title: 'Components/Forms & Inputs/eSheet/MedicationListField',
  component: EsheetRenderer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The \`medicationList\` custom eSheet field type, backed by the \`MedicationList\` component.

\`\`\`tsx
import { registerMedicationListFieldType } from '@mieweb/ui/esheet';

registerMedicationListFieldType(); // once, before rendering
\`\`\`

Hover a row to reconcile; Correct / Notes / Add Task open modals; Move Up/Down
reorders; quick-add pills and "Other…" add medications. All state persists to
the field response as JSON.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EsheetRenderer>;

export const InRenderer: Story = {
  args: {
    formDataInput: SAMPLE_FORM,
  },
};
