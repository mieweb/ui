import { useRef, useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// eSheet compiled CSS is loaded globally in .storybook/preview.tsx so the
// builder + renderer stylesheets always apply in a deterministic order.
import {
  EsheetRenderer,
  registerMieEsheetFields,
  type EsheetRendererProps,
  type EsheetRendererHandle,
  type FormDefinition,
} from '../../esheet';
import { CodeLookup } from '../CodeLookup';

// Register the @mieweb/ui custom field types (medicationList + allergyList)
// once, before any story renders.
registerMieEsheetFields({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});

// ============================================================================
// Sample Form Definition
// ============================================================================

const SAMPLE_FORM: FormDefinition = {
  id: 'storybook-demo',
  title: 'Patient Intake Form',
  pages: [
    {
      id: 'page-1',
      fields: [
        {
          id: 'name',
          fieldType: 'text',
          question: 'Full Name',
        },
        {
          id: 'email',
          fieldType: 'text',
          question: 'Email Address',
          inputType: 'email',
        },
        {
          id: 'reason',
          fieldType: 'radio',
          question: 'Reason for Visit',
          options: [
            { id: 'r1', value: 'New Patient' },
            { id: 'r2', value: 'Follow-up' },
            { id: 'r3', value: 'Referral' },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// Renderer Stories
// ============================================================================

const rendererMeta: Meta<typeof EsheetRenderer> = {
  id: 'composite-forms-esheet-renderer',
  title: 'Inputs/Composite forms/ESheet Renderer',
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  component: EsheetRenderer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The **fill-out side of eSheet**: renders a form definition as live fields and collects the answers. Re-exported from \`@esheet/renderer\` via \`@mieweb/ui/esheet\`. \`formDataInput: unknown\` accepts an eSheet \`FormDefinition\`, a SurveyJS schema, an MCP elicitation envelope, or any of those as a JSON/YAML string — formats are auto-detected and converted unless \`strict\` is set (then only a valid \`FormDefinition\` is accepted). \`initialResponses?: FormResponse\` pre-fills answers, \`onReady()\` fires once the definition is parsed into the store, \`className\` styles the root (add \`dark\` for dark mode). Responses are read through a ref: \`EsheetRendererHandle\` exposes \`getValidResponse()\` → \`{ response: FormResponse | null, errors: ValidationError[] }\` (\`response\` is \`null\` when there are errors), \`getRawResponse()\`, \`getFormStore()\` and \`getUIStore()\`. Register @mieweb/ui field types (\`registerMieEsheetFields\`) before mounting when definitions use \`medicationList\` / \`allergyList\`.

### Use it when

- Patients or staff fill in a **template someone authored** (in \`ESheet Builder\` or exported from SurveyJS / an MCP tool) and you need validated answers back.
- You want one component that tolerates several schema dialects — or \`strict\` when you must reject anything but eSheet.

### Don't use it when

- You need to **edit the form definition** — \`ESheet Builder\`.
- The form is fixed and developer-authored — compose \`Input\`, \`Select\`, \`DateInput\` etc. directly.
- Users add free key/value extras to an otherwise fixed form — \`AdditionalFields\`.
- You need a submit button, autosave or server persistence out of the box — the renderer has none; the host calls \`getValidResponse()\` and posts.

### Example

\`\`\`tsx
import { EsheetRenderer, type EsheetRendererHandle, type FormDefinition } from '@mieweb/ui/esheet';

function IntakeForm({ definition, draft }: { definition: FormDefinition; draft?: FormResponse }) {
  const ref = useRef<EsheetRendererHandle>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const submit = async () => {
    const { response, errors } = ref.current!.getValidResponse();
    setErrors(errors);
    if (response) await saveIntake(definition.id, response);   // host owns persistence
  };

  return (
    <>
      <EsheetRenderer ref={ref} formDataInput={definition} initialResponses={draft} strict />
      {errors.length > 0 && <Alert variant="error">{errors.length} answers need attention</Alert>}
      <Button onClick={submit}>Submit</Button>
    </>
  );
}
\`\`\`

### Limitations

- Separate install: \`@esheet/renderer\` (and \`@esheet/core\` for types) are optional peers behind \`@mieweb/ui/esheet\`. The compiled stylesheet (\`index.output.css\`) lives in the package's \`src/\` and is not in its \`exports\`, so the host must copy/alias it (Storybook imports it from the submodule source); load it before the builder's when both are present.
- Imperative API: there is no \`onChange\` / \`onSubmit\` and no submit button — read answers via the ref. Validation runs only when you call \`getValidResponse()\`; \`getRawResponse()\` returns unvalidated state.
- Accessibility depends on \`@esheet/fields\`' field markup; the renderer shell itself sets one \`aria-*\` attribute and no landmark roles. A known upstream contrast failure on the selected option card (mieweb/eSheet#170) is excluded from axe in the *PreFilled* story.
- i18n / RTL: no locale, direction or translation hooks were found in the renderer source; built-in strings are English and layout is LTR. Dark mode is a \`dark\` class on \`className\`, not the @mieweb/ui theme provider.
- Format auto-detection converts SurveyJS / MCP input to a \`FormDefinition\` internally — the response shape you get back is eSheet's \`FormResponse\`, not the source dialect's. Custom field types require a core that accepts them (mieweb/eSheet#91).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: ['@esheet/renderer', '@esheet/core'],
      relationships: [
        {
          type: 'composes with',
          target: 'composite-forms-esheet-builder',
          why: 'The Renderer displays and collects responses for the FormDefinition JSON that the Builder produces.',
        },
        {
          type: 'contains',
          target: 'clinical-lists-medicationlistfield-esheet',
          why: 'Renders the medicationList custom field type once registerMieEsheetFields() has run.',
        },
        {
          type: 'contains',
          target: 'clinical-lists-allergylistfield-esheet',
          why: 'Renders the allergyList custom field type once registerMieEsheetFields() has run.',
        },
      ],
    },
  },
  argTypes: {
    strict: {
      control: 'boolean',
      description:
        'When true, disables auto-detection — requires a valid eSheet FormDefinition.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the root container.',
    },
  },
};

export default rendererMeta;
type RendererStory = StoryObj<typeof EsheetRenderer>;

function RendererDemo(props: EsheetRendererProps) {
  const rendererRef = useRef<EsheetRendererHandle>(null);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = () => {
    if (!rendererRef.current) return;
    const result = rendererRef.current.getValidResponse();
    if (result.errors.length > 0) {
      console.warn('Validation errors:', result.errors);
    } else {
      console.log('Form response:', result.response);
    }
  };

  return (
    <div style={{ minWidth: 400, maxWidth: 600 }}>
      <EsheetRenderer
        {...props}
        ref={rendererRef}
        className={[isDark ? 'dark' : '', props.className]
          .filter(Boolean)
          .join(' ')}
      />
      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '0.5rem 1.5rem',
            background: 'var(--mieweb-primary-800, #1e40af)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/**
 * The default form renderer displaying the sample patient intake form.
 */
export const Default: RendererStory = {
  args: {
    formDataInput: SAMPLE_FORM,
    strict: false,
  },
  render: (args) => <RendererDemo {...args} />,
};

/**
 * Renderer with pre-filled initial responses.
 */
export const PreFilled: RendererStory = {
  args: {
    formDataInput: SAMPLE_FORM,
    initialResponses: {
      name: { answer: 'Jane Doe' },
      email: { answer: 'jane@example.com' },
      reason: { selected: { id: 'r2', value: 'Follow-up' } },
    },
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          // eSheet's selected option card (selection-controls redesign,
          // mieweb/eSheet#150) paints white text on `--msprimary`, which
          // fails WCAG AA contrast (~2.6:1 with our brand primary; even
          // eSheet's own #3b82f6 default is only ~3.7:1). Tracked upstream
          // as mieweb/eSheet#170 — remove this exclusion once the selected
          // state ships accessible colors.
          { id: 'color-contrast', enabled: false },
        ],
      },
    },
  },
  render: (args) => <RendererDemo {...args} />,
};

/**
 * Renderer with the @mieweb/ui medical custom field types — medication
 * reconciliation and the allergy list — as form questions.
 *
 * Both are registered at module load via `registerMieEsheetFields()`.
 */
export const MedicalFields: RendererStory = {
  args: {
    formDataInput: {
      id: 'medical-demo',
      title: 'Encounter — Medications & Allergies',
      pages: [
        {
          id: 'page-1',
          fields: [
            {
              id: 'meds',
              fieldType: 'medicationList',
              question: 'Presenting medications',
              medications: [
                { id: 'm1', name: 'lisinopril 10 mg tablet', status: 'taking' },
                {
                  id: 'm2',
                  name: 'metformin 500 mg tablet',
                  status: 'unreconciled',
                },
              ],
            },
            {
              id: 'allergies',
              fieldType: 'allergyList',
              question: 'Allergies',
              allergies: [
                {
                  id: 'a1',
                  allergen: 'penicillin',
                  type: 'drug',
                  reaction: 'hives',
                  severity: 'moderate',
                },
              ],
            },
          ],
        },
      ],
    } as unknown as FormDefinition,
    strict: false,
  },
  render: (args) => <RendererDemo {...args} />,
};
