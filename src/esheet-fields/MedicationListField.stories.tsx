import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EsheetRenderer,
  registerMedicationListFieldType,
  type FormDefinition,
} from '../esheet';
import { CodeLookup } from '../components/CodeLookup';

// Register the custom field type once, before any story renders.
// CodeLookup wiring gives the medication editor offline RxNorm/FDB coding.
registerMedicationListFieldType({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});

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
The \`medicationList\` **custom eSheet field type** — medication
reconciliation as a form question, backed by \`MedicationReconciliation\`
(see *Healthcare/MedicationList* for the standalone component).

### Setup (once, at module load, before the builder/renderer mounts)

\`\`\`tsx
import { registerMedicationListFieldType } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup'; // optional — offline RxNorm/FDB coding

registerMedicationListFieldType({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});
\`\`\`

### Field definition

\`\`\`jsonc
{
  "id": "meds",
  "fieldType": "medicationList",
  "question": "Presenting medications",       // rendered as the card title
  "medications": [ /* seed list, shown until a response exists */ ],
  "quickAddOptions": ["aspirin 81 mg tablet"] // quick-add pills
}
\`\`\`

### Behavior to know about

- The response persists as JSON in \`response.answer\`:
  \`{ "medications": […] }\` — statuses, corrections, notes, tasks,
  ordering, additions, removals all round-trip
- Interactive **only in fill-out mode** (preview + enabled); read-only on
  the builder canvas or when conditionally disabled
- Requires \`@esheet/core\` ≥ the custom-field schema fix
  ([mieweb/eSheet#91](https://github.com/mieweb/eSheet/pull/91)) — older
  cores reject custom field types at validation with
  "Invalid form definition"
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
  parameters: {
    docs: {
      description: {
        story: `
The field running inside the **real \`EsheetRenderer\`** (fill-out mode) —
not a mock: the form definition above is validated by \`@esheet/core\`, the
field component is resolved from the registry, and every interaction writes
through the form store via \`onResponse\`. This is exactly what a deployed
eSheet form does, so use this story to sanity-check the integration after
changing the field, the component, or the eSheet packages.
        `,
      },
    },
  },
};
