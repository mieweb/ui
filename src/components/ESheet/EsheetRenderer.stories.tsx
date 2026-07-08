import { useRef, useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
};

// ============================================================================
// Renderer Stories
// ============================================================================

const rendererMeta: Meta<typeof EsheetRenderer> = {
  title: 'Components/Forms & Inputs/eSheet/Renderer',
  component: EsheetRenderer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Read-only form renderer that auto-detects eSheet, SurveyJS, and MCP elicitation formats.

\`\`\`tsx
import { EsheetRenderer } from '@mieweb/ui/esheet';

<EsheetRenderer formDataInput={formDefinition} ref={rendererRef} />
\`\`\`
        `,
      },
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
      fields: [
        {
          id: 'meds',
          fieldType: 'medicationList',
          question: 'Presenting medications',
          medications: [
            { id: 'm1', name: 'lisinopril 10 mg tablet', status: 'taking' },
            { id: 'm2', name: 'metformin 500 mg tablet', status: 'unreconciled' },
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
    } as unknown as FormDefinition,
    strict: false,
  },
  render: (args) => <RendererDemo {...args} />,
};

