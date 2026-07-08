import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EsheetRenderer,
  registerAllergyListFieldType,
  type FormDefinition,
} from '../esheet';
import { CodeLookup } from '../components/CodeLookup';

// Register the custom field type once, before any story renders.
// CodeLookup wiring gives the allergy editor offline RxNorm/FDB coding.
registerAllergyListFieldType({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});

const SAMPLE_FORM = {
  id: 'allergy-demo',
  title: 'Encounter — Allergy Review',
  fields: [
    {
      id: 'allergies',
      fieldType: 'allergyList',
      question: 'Allergies',
      allergies: [
        {
          id: '1',
          allergen: 'penicillin',
          type: 'drug',
          reaction: 'hives',
          severity: 'moderate',
          onsetDate: '2019',
        },
        {
          id: '2',
          allergen: 'sulfa drugs',
          type: 'drug',
          reaction: 'rash',
          severity: 'mild',
        },
        {
          id: '3',
          allergen: 'peanuts',
          type: 'food',
          reaction: 'anaphylaxis',
          severity: 'severe',
          note: 'Carries EpiPen',
        },
      ],
    },
  ],
} as unknown as FormDefinition;

const meta: Meta<typeof EsheetRenderer> = {
  title: 'Components/Forms & Inputs/eSheet/AllergyListField',
  component: EsheetRenderer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The \`allergyList\` **custom eSheet field type** — the allergy / intolerance
list as a form question, backed by \`AllergyManager\` (see
*Healthcare/AllergyList* for the standalone component).

### Setup (once, at module load, before the builder/renderer mounts)

\`\`\`tsx
import { registerAllergyListFieldType } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup'; // optional — offline RxNorm/FDB coding

registerAllergyListFieldType({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});
\`\`\`

> Registering **both** medical fields at once? Use
> \`registerMieEsheetFields({ codeLookup })\` instead.

### Field definition

\`\`\`jsonc
{
  "id": "allergies",
  "fieldType": "allergyList",
  "question": "Allergies",              // rendered as the card title
  "allergies": [ /* seed list, shown until a response exists */ ]
}
\`\`\`

### Behavior to know about

- The response persists as JSON in \`response.answer\`:
  \`{ "allergies": […], "noKnownAllergies"?: boolean }\` — additions,
  corrections, notes, ordering, and the tri-state NKA flag all round-trip
- Recording any allergy automatically clears the *no known allergies* flag
- Interactive **only in fill-out mode** (preview + enabled); read-only on
  the builder canvas or when conditionally disabled
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

export const EmptyIntake: Story = {
  args: {
    formDataInput: {
      id: 'allergy-intake',
      title: 'Patient Intake — Allergies',
      fields: [
        {
          id: 'allergies',
          fieldType: 'allergyList',
          question: 'Do you have any allergies?',
        },
      ],
    } as unknown as FormDefinition,
  },
  parameters: {
    docs: {
      description: {
        story: `
Patient-facing intake from an empty list. The empty state reads
**"Allergy status not recorded."** until *no known allergies* is
explicitly confirmed — an empty list must never silently imply "no
allergies".
        `,
      },
    },
  },
};
