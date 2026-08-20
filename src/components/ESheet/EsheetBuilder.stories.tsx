import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// eSheet no longer self-imports its compiled CSS (see mieweb/eSheet#145);
// consumers load it explicitly. Path is relative because the @esheet aliases
// in .storybook/main.ts only cover bare package specifiers.
import '../../../packages/esheet/packages/builder/src/index.output.css';
import {
  EsheetBuilder,
  registerMieEsheetFields,
  type EsheetBuilderProps,
  type FormDefinition,
} from '../../esheet';
import { CodeLookup } from '../CodeLookup';

// Register the @mieweb/ui custom field types (medicationList + allergyList)
// once, before any story renders, so they appear in the builder palette.
registerMieEsheetFields({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});

// ============================================================================
// Sample Form Definition
// ============================================================================

// Cast: the sample includes the medicationList/allergyList custom field types,
// which aren't part of @esheet/core's built-in fieldType union.
const SAMPLE_FORM = {
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
        {
          id: 'meds',
          fieldType: 'medicationList',
          question: 'Presenting medications',
        },
        {
          id: 'allergies',
          fieldType: 'allergyList',
          question: 'Allergies',
        },
      ],
    },
  ],
} as unknown as FormDefinition;

// ============================================================================
// Builder Stories
// ============================================================================

const builderMeta: Meta<typeof EsheetBuilder> = {
  title: 'Components/Forms & Inputs/eSheet/Builder',
  component: EsheetBuilder,
  parameters: {
    layout: 'fullscreen',
    a11y: {
      config: {
        rules: [
          // TODO(esheet): the active mode tab (`.ms:bg-msprimary-active` +
          // white label) fails WCAG AA contrast. The fix belongs in the
          // esheet submodule (BuilderHeader.tsx / msprimary tokens) — a
          // separate repo/PR. Re-enable once that lands.
          { id: 'color-contrast', enabled: false },
          // TODO(esheet): esheet 0d6d9a7 renders two unlabeled <aside>
          // landmarks (`.panel-tools-wrap`), tripping landmark-unique.
          // Fix belongs in the esheet submodule (add distinct aria-labels
          // to the tool panels). Re-enable once that lands.
          { id: 'landmark-unique', enabled: false },
          // TODO(esheet): esheet v0.0.5 field drag handles are plain
          // <div aria-label="Drag to reorder"> elements — aria-label is
          // prohibited on role-less divs. Fix belongs in the esheet
          // submodule (use role="button"/<button> on the drag handle).
          // Re-enable once that lands.
          { id: 'aria-prohibited-attr', enabled: false },
        ],
      },
    },
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
    const emptyDef: FormDefinition = {
      id: 'empty',
      pages: [{ id: 'page-1', fields: [] }],
    };
    return <BuilderDemo {...args} definition={emptyDef} />;
  },
};
