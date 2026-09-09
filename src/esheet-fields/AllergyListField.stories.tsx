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
  id: 'clinical-lists-allergylistfield-esheet',
  title: 'Healthcare/Clinical lists/AllergyListField (eSheet)',
  component: EsheetRenderer,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The \`allergyList\` **custom eSheet field type** — the allergy / intolerance list as a form question. \`AllergyListField\` is a thin adapter (same pattern as \`MedicationListField\`) that maps the eSheet field contract (\`field.definition\`, \`response\`, \`isPreview\` / \`isEnabled\`, \`onResponse\`) onto [AllergyList](?path=/docs/clinical-lists-allergylist--docs)'s \`AllergyManager\`. \`registerAllergyListFieldType({ codeLookup? })\` registers it with \`@esheet/fields\` (label "Allergy List", category \`rich\`, \`answerType: 'text'\`), or register both clinical fields at once with \`registerMieEsheetFields({ codeLookup })\`. The response persists as JSON in \`response.answer\`: \`{ "allergies": Allergy[], "noKnownAllergies"?: boolean }\` — additions, corrections, notes, ordering **and the tri-state NKA flag** all round-trip; recording any allergy clears the flag. The field seeds from \`definition.allergies\` until a response exists, uses \`definition.question\` as the card title, turns on \`inlineAddSearch\` whenever a lookup is available (registration option or ambient \`CodeLookupProvider\`), and is interactive **only in fill-out mode** (\`isPreview && isEnabled\`).

### Use it when

- A patient intake or encounter **eSheet form** asks "Do you have any allergies?" and the answer must distinguish *not asked* from *asked — none* (NKA) from a list.
- Form authors should drop the question in from the \`EsheetBuilder\` palette with an optional seed list.

### Don't use it when

- The allergy list lives outside an eSheet form — use \`AllergyManager\` from the main entry directly.
- You need the medication question — [MedicationListField (eSheet)](?path=/docs/clinical-lists-medicationlistfield-esheet--docs).
- Your \`@esheet/core\` predates the custom-field schema fix ([mieweb/eSheet#91](https://github.com/mieweb/eSheet/pull/91)).

### Example

\`\`\`tsx
// once, at module load, before EsheetBuilder / EsheetRenderer mounts
import { registerAllergyListFieldType, EsheetRenderer, type EsheetRendererHandle } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup'; // optional — coded drug allergens, app bundler only

registerAllergyListFieldType({ codeLookup: { component: CodeLookup, indexUrl: '/codify' } });

const form: FormDefinition = {
  id: 'intake',
  title: 'Patient Intake — Allergies',
  fields: [{ id: 'allergies', fieldType: 'allergyList', question: 'Do you have any allergies?' }],
};

const renderer = useRef<EsheetRendererHandle>(null);
<EsheetRenderer ref={renderer} formDataInput={form} />
<Button onClick={() => {
  const { response } = renderer.current!.getValidResponse();
  if (response) {
    const { allergies, noKnownAllergies } = JSON.parse(response.allergies.answer) as AllergyListFieldValue;
    save({ allergies, noKnownAllergies }); // persist both — an empty list without the flag means "not asked"
  }
}}>Submit</Button>
\`\`\`

State ownership is the eSheet form store; the field writes through \`onResponse\` on every change and the host reads the answer back through the renderer handle.

### Limitations

- **Inherits everything from AllergyList** — accessibility (\`RowActionToolbar\` hover reveal, only reorders announced, NKA is a toggling \`Button\`), clinical caveats (no drug–allergy cross-check, no allergen normalisation, coded search only for drugs) and English strings. See that page.
- **Registration is global and one-shot**: the \`codeLookup\` chosen at registration applies to every form; there is no per-field override. Without it the field still consults an ambient \`CodeLookupProvider\` (and enables the inline search when one exists), otherwise falls back to plain text.
- **Answer shape** is a JSON string in a \`text\` answer type; malformed or non-object JSON degrades to an empty list with no NKA flag. Nothing validates the allergies against a schema.
- **Read-only outside fill-out mode** — the builder canvas shows the seed list but cannot edit it inline; \`definition.allergies\` is edited as JSON.
- **Dependencies / entry.** \`@mieweb/ui/esheet\` (not the main barrel); peers \`@esheet/renderer\` (or \`@esheet/builder\`), \`@esheet/core\`, \`@esheet/fields\` — currently listed only as devDependencies of \`@mieweb/ui\`, so install them yourself. \`CodeLookup\` is not in the package build.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: ['@esheet/renderer', '@esheet/core', '@esheet/fields'],
      relationships: [
        {
          type: 'uses',
          target: 'clinical-lists-allergylist',
          why: 'The field renders AllergyManager and serialises its Allergy[] plus the NKA flag into response.answer.',
        },
        {
          type: 'depends on',
          target: 'composite-forms-esheet-renderer',
          why: 'Only meaningful inside an EsheetRenderer / EsheetBuilder after registerAllergyListFieldType() has run.',
        },
      ],
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
