import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// eSheet compiled CSS is loaded globally in .storybook/preview.tsx so the
// builder + renderer stylesheets always apply in a deterministic order.
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
  id: 'composite-forms-esheet-builder',
  title: 'Inputs/Composite forms/ESheet Builder',
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
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
        component: `### What it's for

The **eSheet form designer**: a full-screen authoring surface where a non-developer builds a \`FormDefinition\` — pages, fields (text, radio, … plus registered custom types such as \`medicationList\` / \`allergyList\`), options and question text — with a palette, properties panel and drag-and-drop ordering. It is a thin re-export of \`@esheet/builder\` through the \`@mieweb/ui/esheet\` entry. Props: \`definition?: FormDefinition\` (initial), \`onChange?(definition)\` (fires on every edit — you own the state), \`dragEnabled\` (default \`true\`; turn off on slow devices), \`className\` (add \`dark\` for dark mode), \`children\` (rendered under the header for custom status/debug panels). The \`FormDefinition\` type comes from \`@esheet/core\`. Call \`registerMieEsheetFields({ codeLookup })\` once at module load to add the @mieweb/ui clinical field types to the palette.

### Use it when

- Administrators must **design or edit form templates** (intake, screening, questionnaires) that will later be filled through \`ESheet Renderer\`.
- You need the definition as portable JSON to store, version and render elsewhere (including the Blaze/standalone renderers in the eSheet monorepo).

### Don't use it when

- You only need to **display and fill** an existing definition — \`ESheet Renderer\`.
- The "custom fields" are a handful of loose key/value pairs typed by the end user — \`AdditionalFields\`.
- You are mapping spreadsheet columns onto existing fields — \`CSVColumnMapper\`.
- The form is developer-authored — compose \`Input\`, \`Select\`, \`DateInput\`, etc. directly; a builder is overhead when the schema never changes at runtime.

### Example

\`\`\`tsx
import { EsheetBuilder, registerMieEsheetFields, type FormDefinition } from '@mieweb/ui/esheet';
// plus the eSheet stylesheets — see Limitations

registerMieEsheetFields({ codeLookup: { component: CodeLookup, indexUrl: '/codify' } }); // once, module scope

function TemplateEditor({ template }: { template: FormTemplate }) {
  const [definition, setDefinition] = useState<FormDefinition>(template.definition);
  const dirty = definition !== template.definition;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EsheetBuilder definition={definition} onChange={setDefinition} dragEnabled>
        <Button disabled={!dirty} onClick={() => saveTemplate(template.id, definition)}>Save</Button>
      </EsheetBuilder>
    </div>
  );
}
\`\`\`

### Limitations

- Separate install: \`@esheet/builder\` (and \`@esheet/core\` for the type) are optional peers, imported from \`@mieweb/ui/esheet\`, not the main barrel. Styling is **not** bundled: each package's compiled \`index.output.css\` lives in its \`src/\` and is not listed in the package \`exports\`, so the host must copy/alias those two files itself (Storybook imports them from the submodule source) — load the renderer's first, then the builder's, as both define the same utility classes.
- Persistence is entirely yours: nothing is saved, autosaved, fetched or validated against a server; \`onChange\` fires on every keystroke, so debounce before persisting.
- Accessibility (as shipped in the pinned submodule): several axe rules are disabled in this story because the upstream markup fails them — active mode tab contrast (\`color-contrast\`), duplicate unlabeled \`<aside>\` tool panels (\`landmark-unique\`), and drag handles that are \`<div aria-label>\` without a role (\`aria-prohibited-attr\`). Drag-and-drop has no documented keyboard alternative beyond disabling it.
- Layout: expects to fill its container (the stories use \`height: 100vh\`); it is a desktop authoring tool, not designed for small screens. Dark mode is opt-in via a \`dark\` class on \`className\`, independent of the @mieweb/ui theme provider.
- i18n / RTL: no locale, direction or translation hooks were found in the builder source — UI strings are English and layout is LTR.
- Custom field types (\`medicationList\`, \`allergyList\`) are not part of \`@esheet/core\`'s built-in \`fieldType\` union; definitions containing them need a cast and require a core version that accepts custom field types (mieweb/eSheet#91).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: ['@esheet/builder', '@esheet/core'],
      relationships: [
        {
          type: 'composes with',
          target: 'composite-forms-esheet-renderer',
          why: 'The Builder produces the FormDefinition JSON that the Renderer displays and collects responses for.',
        },
        {
          type: 'alternative to',
          target: 'composite-forms-additionalfields',
          why: 'ESheet Builder lets an author define typed, reusable fields up front; AdditionalFields lets the person filling a form add loose text key/value pairs.',
        },
        {
          type: 'contains',
          target: 'clinical-lists-medicationlistfield-esheet',
          why: 'After registerMieEsheetFields(), the medicationList custom field type appears in the builder palette.',
        },
        {
          type: 'contains',
          target: 'clinical-lists-allergylistfield-esheet',
          why: 'After registerMieEsheetFields(), the allergyList custom field type appears in the builder palette.',
        },
      ],
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
