import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';
import { Input } from '../Input';

const meta: Meta<typeof Textarea> = {
  id: 'text-inputs-textarea',
  title: 'Inputs/Text inputs/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

The multi-line counterpart of \`Input\`, sharing its anatomy — \`label\` (\`labelVariant\` \`stacked\` | \`floating\`, \`hideLabel\`), \`helperText\`, \`error\`, \`required\` + \`requiredVariant\`, \`size\`, \`hasError\` — and adding what long text needs: \`maxLength\` + \`showCount\` (a live \`n/max\` counter), \`autoResize\` (on by default — an empty textarea starts at the same height as a single-line \`Input\` and grows/shrinks with content, while the native drag handle still works and sets a new minimum) and \`resize\` \`none\` | \`vertical\` | \`horizontal\` | \`both\`. The folder exports \`Textarea\` and \`textareaVariants\`.

### Use it when

- The user writes a sentence or more: notes, comments, descriptions, reasons.
- There is a character budget the user should see while typing (\`maxLength\` + \`showCount\`).

### Don't use it when

- The value fits on one line — \`Input\`.
- The value is HTML and the writer occasionally needs headings, lists or macros in a
  textarea-like surface — \`TextAreaRich\`.
- The text needs formatting, headings or collaborative editing — \`RichEditor\` (\`@mieweb/ui/kerebron\`).
- You need a fixed-height, read-only block — plain \`Text\`.

### Example

\`\`\`tsx
const [note, setNote] = React.useState('');

<Textarea
  label="Visit note"
  value={note}
  onChange={(e) => setNote(e.target.value)}
  maxLength={500}
  showCount
  helperText="Visible to the patient."
/>
\`\`\`

Pass \`value\` for controlled use; with \`defaultValue\` the component keeps an internal copy only so the counter stays correct. The field starts at single-line height and grows with content; pass \`rows\` for a taller floor or \`autoResize={false}\` for classic fixed sizing.

### Limitations

- Same wiring as \`Input\`: \`<label htmlFor>\`, \`aria-invalid\` always rendered, \`aria-describedby\` → error (\`<p role="alert">\`) or helper text, plus the counter's id when \`showCount\` is on. Helper text is hidden while an error shows.
- The counter turns red at \`maxLength\` but does not announce it; \`maxLength\` is enforced by the native attribute, so the user is simply stopped from typing.
- \`autoResize\` (the default) syncs \`style.height\` from \`scrollHeight\` (typing, controlled updates, mount-time prefill, and width changes via ResizeObserver). The native drag handle stays available: a dragged height — like a consumer-configured initial height (\`rows\`, a height class or inline style) — becomes the growth floor, and a \`max-h-*\` class caps growth and restores internal scrolling. \`autoResize={false}\` keeps the classic fixed \`min-h\` sizing. In condensed density the empty field matches the condensed Input height.
- \`ref\` is forwarded through \`useImperativeHandle\`, so it is populated after mount, not during the first render.
- RTL-safe (\`start-3\`, \`ms-1\`); the footer uses \`justify-between\` so the counter sits at the end. Dark mode via the same semantic tokens as \`Input\`.
- No built-in strings; depends on \`Input\` for \`RequiredMark\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-input',
          why: 'Textarea for multi-line text with character count and auto-resize; Input for one line.',
        },
        {
          type: 'alternative to',
          target: 'editors-richeditor',
          why: 'RichEditor when the text needs formatting or collaboration; Textarea for plain multi-line text.',
        },
        {
          type: 'alternative to',
          target: 'editors-richtexteditor',
          why: 'RichTextEditor when the note needs bold/lists/alignment, merge variables or dictation; Textarea for plain multi-line text.',
        },
        {
          type: 'alternative to',
          target: 'editors-textarearich',
          why: 'TextAreaRich looks like Textarea at rest but emits HTML with markdown shortcuts, a block gutter menu and macros; Textarea when the consumer needs plain text.',
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
    labelVariant: {
      control: 'select',
      options: ['stacked', 'floating'],
      description:
        'stacked: label above the field. floating: label rests inside and floats on focus/value (ignores placeholder).',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both'],
      description:
        'User resize handle; with autoResize, dragging it sets a new growth floor.',
    },
    showCount: {
      control: 'boolean',
    },
    autoResize: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    hasError: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    maxLength: {
      control: 'number',
    },
    rows: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
    size: 'md',
    resize: 'vertical',
    showCount: false,
    autoResize: true,
    disabled: false,
    hasError: false,
    helperText: '',
    error: '',
    maxLength: undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Bio"
        placeholder="Tell us about yourself..."
        helperText="Write a brief description of yourself"
      />
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Tweet"
        placeholder="What's happening?"
        maxLength={280}
        showCount
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Message"
        placeholder="Enter your message..."
        error="Message is required"
        hasError
      />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="w-80">
      <Textarea label="Comment" placeholder="Add a comment..." size="sm" />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="w-80">
      <Textarea label="Article" placeholder="Write your article..." size="lg" />
    </div>
  ),
};

export const NoResize: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Fixed size"
        placeholder="This textarea cannot be resized"
        resize="none"
      />
    </div>
  ),
};

export const AutoResize: Story = {
  name: 'Auto-grow (default)',
  render: () => (
    <div className="w-80">
      <Textarea
        label="Auto-grow"
        placeholder="Starts one line tall…"
        helperText="Grows with content and shrinks when it's removed; dragging the handle sets a new minimum"
      />
    </div>
  ),
};

export const MatchesInputHeight: Story = {
  name: 'Matches Input height',
  render: () => (
    <div className="w-80 space-y-4">
      <Input label="Single-line input" placeholder="Input" />
      <Textarea label="Empty textarea" placeholder="Textarea" />
      <p className="text-muted-foreground text-xs">
        An empty auto-growing textarea matches the single-line input height for
        each size.
      </p>
    </div>
  ),
};

export const Prefilled: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Prefilled"
        defaultValue={
          'Prefilled content is measured on first render,\nso this textarea mounts at three lines tall\nwithout any typing.'
        }
      />
    </div>
  ),
};

export const RowsFloor: Story = {
  name: 'Rows as growth floor',
  render: () => (
    <div className="w-80">
      <Textarea
        label="Comments"
        rows={4}
        placeholder="Starts four lines tall…"
        helperText="rows={4} keeps the field at least four lines; content can still grow it"
      />
    </div>
  ),
};

export const FixedHeight: Story = {
  name: 'Fixed height (autoResize off)',
  render: () => (
    <div className="w-80">
      <Textarea
        label="Fixed height"
        autoResize={false}
        placeholder="Classic fixed-height textarea…"
        helperText="Keeps the fixed min-height; no auto-growing"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Disabled"
        placeholder="This textarea is disabled"
        disabled
        defaultValue="You cannot edit this content"
      />
    </div>
  ),
};

export const MaxLengthReached: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Limited input"
        maxLength={50}
        showCount
        defaultValue="This text is at the maximum character limit!"
      />
    </div>
  ),
};

function ControlledTextareaDemo() {
  const [value, setValue] = React.useState('');

  return (
    <div className="w-80 space-y-4">
      <Textarea
        label="Controlled textarea"
        placeholder="Type something..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        showCount
        maxLength={200}
      />
      <p className="text-muted-foreground text-xs">
        Characters: <code className="font-mono">{value.length}</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTextareaDemo />,
};

export const ContactForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <h3 className="text-lg font-semibold">Contact Us</h3>
      <Textarea
        label="Your message"
        placeholder="How can we help you?"
        rows={5}
        maxLength={1000}
        showCount
        helperText="Please provide as much detail as possible"
      />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Textarea label="Small" placeholder="Small textarea" size="sm" />
      <Textarea
        label="Medium"
        placeholder="Medium textarea (default)"
        size="md"
      />
      <Textarea label="Large" placeholder="Large textarea" size="lg" />
    </div>
  ),
};

export const FloatingLabel: Story = {
  args: {
    label: 'Description',
    labelVariant: 'floating',
  },
};

export const FloatingLabelWithValue: Story = {
  args: {
    label: 'Description',
    labelVariant: 'floating',
    defaultValue: 'A multi-line note that sits below the floated label.',
  },
};

export const FloatingLabelSizes: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Textarea label="Small" labelVariant="floating" size="sm" />
      <Textarea label="Medium" labelVariant="floating" size="md" />
      <Textarea label="Large" labelVariant="floating" size="lg" />
    </div>
  ),
};

export const FloatingLabelWithError: Story = {
  args: {
    label: 'Description',
    labelVariant: 'floating',
    defaultValue: 'Too short',
    error: 'Description must be at least 20 characters.',
  },
};
