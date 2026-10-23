import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';
import { TextAreaPlain } from '../TextAreaPlain';

const meta: Meta<typeof Textarea> = {
  id: 'text-inputs-textarea',
  title: 'Inputs/Text inputs/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The default multi-line field — and it is **rich text underneath**. \`Textarea\`
keeps the classic plain-text contract (\`value\`, \`defaultValue\` and
\`onChange\`'s \`event.target.value\` are plain strings, \`name\` posts plain
text, \`ref.current.value\` reads plain text) while rendering \`TextAreaRich\`:
toolbar hidden until requested, markdown block shortcuts (\`##\` + space →
heading), and the Notion-style block gutter menu. Every note field gets
formatting for free without changing its data layer.

Field anatomy follows \`Input\`: \`label\` (+ \`hideLabel\`), \`helperText\`,
\`error\`, \`required\` + \`requiredVariant\`, \`size\`, \`hasError\`, and
\`maxLength\` + \`showCount\` render a live character counter.

### Use it when

- The user writes a sentence or more: notes, comments, descriptions, reasons.
- The host stores plain text but writers benefit from visible structure while
  composing.

### Don't use it when

- The host should **persist** the formatting — use \`TextAreaRich\` (its
  \`value\`/\`onChange\` carry HTML).
- You need the native \`<textarea>\` element: hard \`maxLength\` enforcement,
  native validation/autofill, drag-resize, floating labels — use
  \`TextAreaPlain\`.
- The value fits on one line — \`Input\`.
- The text needs the always-on toolbar, merge variables or dictation —
  \`RichTextEditor\`.

### Example

\`\`\`tsx
const [note, setNote] = React.useState('');

<Textarea
  label="Visit note"
  value={note}
  onChange={(e) => setNote(e.target.value)}
  helperText="Visible to the patient."
/>
\`\`\`

### Limitations

- Formatting the user applies is visible while editing but **only plain text
  is reported** — headings/bold/lists are flattened to lines. Hosts that echo
  the controlled value back unchanged keep the on-screen formatting; hosts
  that transform it (uppercase, trim) reset the field to plain paragraphs.
- \`maxLength\` is not enforced while typing (the counter still shows the
  budget and turns red); \`labelVariant="floating"\`, \`resize\` and
  \`autoResize={false}\` fall back with a one-time dev console warning. Use
  \`TextAreaPlain\` when those native behaviours are requirements.
- A hidden \`<textarea>\` mirrors the plain value so \`name\` form posts and
  \`ref.current.value\` keep working; \`ref.current.focus()\` focuses the
  editor. CSS selectors targeting a visible \`textarea\` element no longer
  match — style via \`[data-slot]\` hooks instead.
- Error/helper/count are wired to the editable region via
  \`aria-describedby\`. External \`<label htmlFor={id}>\` pairs keep working:
  the field bridges them via \`aria-labelledby\` and click-to-focus, since a
  contenteditable region cannot be targeted by \`htmlFor\` natively.

### TextAreaPlain — the native escape hatch

\`TextAreaPlain\` (exported from \`@mieweb/ui\`) is the previous native
\`<textarea>\` implementation with the exact same props: hard \`maxLength\`
enforcement, native validation/autofill, drag-resize (\`resize\`), fixed
heights (\`autoResize={false}\`, \`rows\`), and \`labelVariant="floating"\`.
Swap the import — \`Textarea\` → \`TextAreaPlain\` — and nothing else
changes. See the escape-hatch stories below.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'editors-textarearich',
          why: 'Textarea is TextAreaRich with a plain-text value contract and Input-style field chrome; TextAreaRich when the host persists the HTML.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-input',
          why: 'Textarea for multi-line text; Input for one line.',
        },
        {
          type: 'alternative to',
          target: 'editors-richtexteditor',
          why: 'RichTextEditor when the host persists HTML and needs the always-on toolbar, merge variables or dictation; Textarea keeps a plain-text contract.',
        },
        {
          type: 'alternative to',
          target: 'editors-richeditor',
          why: 'RichEditor when the text needs Markdown, links/tables/code or collaboration; Textarea for plain multi-line text.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showCount: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: 'Notes',
    placeholder: 'Add a note…',
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: 'Visit note',
    placeholder: 'Describe the visit…',
    helperText: 'Visible to the patient.',
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const WithCharacterCount: Story = {
  args: {
    label: 'Bio',
    placeholder: 'Tell us about yourself…',
    maxLength: 280,
    showCount: true,
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: 'Reason',
    error: 'A reason is required.',
    required: true,
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const Prefilled: Story = {
  args: {
    label: 'Assessment',
    defaultValue: 'Patient reports feeling well.\n\nNo acute distress.',
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: 'Locked note',
    defaultValue: 'Signed and locked.',
    disabled: true,
  },
  render: (args) => (
    <div className="w-96">
      <Textarea {...args} />
    </div>
  ),
};

/**
 * The plain-text contract in action: formatting is visible while editing, but
 * `onChange` reports plain text — shown live under the field.
 */
export const PlainTextContract: Story = {
  render: function PlainTextContractStory() {
    const [value, setValue] = React.useState(
      'Try the block menu or type ## and a space.'
    );
    return (
      <div className="w-96 space-y-3">
        <Textarea
          label="Note"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <pre className="bg-muted text-muted-foreground max-h-40 overflow-auto rounded-md p-2 text-xs whitespace-pre-wrap">
          {JSON.stringify(value)}
        </pre>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Textarea label="Small" size="sm" placeholder="Small" />
      <Textarea label="Medium" size="md" placeholder="Medium" />
      <Textarea label="Large" size="lg" placeholder="Large" />
    </div>
  ),
};

/**
 * `TextAreaPlain` is the previous native `<textarea>` implementation with the
 * same props — swap the import when you need hard `maxLength` enforcement,
 * native validation/autofill, drag-resize or fixed heights.
 */
export const EscapeHatchTextAreaPlain: Story = {
  name: 'TextAreaPlain (native escape hatch)',
  render: () => (
    <div className="w-96 space-y-4">
      <TextAreaPlain
        label="Hard character limit"
        maxLength={80}
        showCount
        helperText="The native maxLength stops typing at 80."
      />
      <TextAreaPlain
        label="Fixed height, drag to resize"
        autoResize={false}
        rows={3}
        resize="vertical"
      />
    </div>
  ),
};

/**
 * `TextAreaPlain` also keeps the floating label variant, which the rich
 * surface cannot render.
 */
export const EscapeHatchFloatingLabel: Story = {
  name: 'TextAreaPlain (floating label)',
  render: () => (
    <div className="w-96 space-y-4">
      <TextAreaPlain label="Floating label" labelVariant="floating" />
      <TextAreaPlain
        label="Floating with value"
        labelVariant="floating"
        defaultValue="Prefilled content keeps the label floated."
      />
    </div>
  ),
};
