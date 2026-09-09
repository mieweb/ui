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
  id: 'clinical-lists-medicationlistfield-esheet',
  title: 'Healthcare/Clinical lists/MedicationListField (eSheet)',
  component: EsheetRenderer,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The \`medicationList\` **custom eSheet field type** — medication reconciliation as a form question. \`MedicationListField\` is a thin adapter that maps the eSheet field contract (\`field.definition\`, \`response\`, \`isPreview\` / \`isEnabled\`, \`onResponse\`) onto [MedicationList](?path=/docs/clinical-lists-medicationlist--docs)'s \`MedicationReconciliation\`; all reconciliation UI and behaviour lives there. \`registerMedicationListFieldType({ codeLookup? })\` registers it with \`@esheet/fields\` (label "Medication Reconciliation", category \`rich\`, \`answerType: 'text'\`), or register both clinical fields at once with \`registerMieEsheetFields({ codeLookup })\`. The response persists as JSON in \`response.answer\`: \`{ "medications": Medication[] }\` — statuses, corrections, notes, tasks, ordering, additions and removals all round-trip. The field seeds from \`definition.medications\` until a response exists, uses \`definition.question\` as the card title and \`definition.quickAddOptions\` as the quick-add pills, and is interactive **only in fill-out mode** (\`isPreview && isEnabled\`) — read-only on the builder canvas or when conditionally disabled.

### Use it when

- A clinical intake or encounter **eSheet form** needs a reconciled medication list as one of its questions, stored with the rest of the form's responses.
- Form authors should be able to drop the question in from the \`EsheetBuilder\` palette (after registration) with a seed list and quick-add options in the definition.

### Don't use it when

- The medication list lives on a page that is **not an eSheet form** — use \`MedicationReconciliation\` from the main entry directly; the adapter adds nothing but the form contract.
- You need the allergy question — [AllergyListField (eSheet)](?path=/docs/clinical-lists-allergylistfield-esheet--docs).
- Your \`@esheet/core\` predates the custom-field schema fix ([mieweb/eSheet#91](https://github.com/mieweb/eSheet/pull/91)) — older cores reject custom field types at validation with "Invalid form definition".

### Example

\`\`\`tsx
// once, at module load, before EsheetBuilder / EsheetRenderer mounts
import { registerMedicationListFieldType, EsheetRenderer, type EsheetRendererHandle, type FormDefinition } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup'; // optional — offline RxNorm / FDB coding, app bundler only

registerMedicationListFieldType({ codeLookup: { component: CodeLookup, indexUrl: '/codify' } });

// the form definition carries the seed list; the renderer owns the response store
const form: FormDefinition = {
  id: 'med-rec',
  title: 'Encounter — Medication Reconciliation',
  fields: [
    { id: 'meds', fieldType: 'medicationList', question: 'Presenting medications',
      medications: [{ id: '1', name: 'lisinopril 10 mg tablet', status: 'unreconciled' }],
      quickAddOptions: ['aspirin 81 mg tablet'] },
  ],
};

const renderer = useRef<EsheetRendererHandle>(null);
<EsheetRenderer ref={renderer} formDataInput={form} />
<Button onClick={() => {
  const { response } = renderer.current!.getValidResponse();
  if (response) save(JSON.parse(response.meds.answer).medications as Medication[]);
}}>Submit</Button>
\`\`\`

State ownership is the eSheet form store: every change goes through \`onResponse({ answer: JSON.stringify(…) })\`; the host reads \`Medication[]\` back out of the answer via the renderer handle (\`getRawResponse\` / \`getValidResponse\`).

### Limitations

- **Inherits everything from MedicationList** — accessibility (\`RowActionToolbar\` hover reveal, \`useLiveAnnouncement\` for status / reorder only), clinical caveats (no interaction or dose checking, heuristic sig parsing) and English strings. See that page.
- **Registration is global and one-shot**: \`registerCustomFieldTypes\` mutates the \`@esheet/fields\` registry, so the \`codeLookup\` chosen at registration applies to every form; there is no per-field override. Omit it and \`MedicationReconciliation\` falls back to an ambient \`CodeLookupProvider\`, then to a plain name input.
- **Answer shape** is a JSON string in a \`text\` answer type; malformed or non-object JSON degrades to an empty list rather than throwing. Nothing validates the medications against a schema.
- **Read-only outside fill-out mode** means the builder canvas shows the seed list but cannot edit it inline — authors edit \`definition.medications\` as JSON.
- **Dependencies / entry.** \`@mieweb/ui/esheet\` (not the main barrel); peers \`@esheet/renderer\` (or \`@esheet/builder\`), \`@esheet/core\`, \`@esheet/fields\` — currently listed only as devDependencies of \`@mieweb/ui\`, so install them yourself. \`CodeLookup\` is not in the package build.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: ['@esheet/renderer', '@esheet/core', '@esheet/fields'],
      relationships: [
        {
          type: 'uses',
          target: 'clinical-lists-medicationlist',
          why: 'The field renders MedicationReconciliation and serialises its Medication[] into response.answer.',
        },
        {
          type: 'depends on',
          target: 'composite-forms-esheet-renderer',
          why: 'Only meaningful inside an EsheetRenderer / EsheetBuilder after registerMedicationListFieldType() has run.',
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
