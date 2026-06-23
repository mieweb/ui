import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  EsheetBuilder,
  type EsheetBuilderProps,
  type FormDefinition,
} from '../../esheet';

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
// Builder Stories
// ============================================================================

const builderMeta: Meta<typeof EsheetBuilder> = {
  title: 'Components/Forms & Inputs/eSheet/Builder',
  component: EsheetBuilder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Separate install required.** The eSheet form builder is not included in the base \`@mieweb/ui\` package.

\`\`\`bash
npm install @esheet/builder @esheet/renderer
\`\`\`

Then import from the dedicated entry point:

\`\`\`tsx
import { EsheetBuilder, EsheetRenderer } from '@mieweb/ui/esheet';
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    dragEnabled: {
      control: 'boolean',
      description: 'Whether drag-and-drop reordering is enabled.',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name.',
    },
  },
};

export default builderMeta;
type BuilderStory = StoryObj<typeof EsheetBuilder>;

function BuilderDemo(props: EsheetBuilderProps) {
  const [def, setDef] = useState<FormDefinition>(
    props.definition ?? SAMPLE_FORM
  );
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EsheetBuilder
        {...props}
        definition={def}
        onChange={setDef}
        className={[isDark ? 'dark' : '', props.className]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  );
}

/**
 * The default eSheet form builder with drag-and-drop field editing.
 */
export const Default: BuilderStory = {
  args: {
    dragEnabled: true,
  },
  render: (args) => <BuilderDemo {...args} />,
};

/**
 * Builder with an empty form — start from scratch.
 */
export const EmptyForm: BuilderStory = {
  args: {
    dragEnabled: true,
  },
  render: (args) => {
    const emptyDef: FormDefinition = { id: 'empty', fields: [] };
    return <BuilderDemo {...args} definition={emptyDef} />;
  },
};
