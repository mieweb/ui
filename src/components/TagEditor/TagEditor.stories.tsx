import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { TagEditor, type TagEditorProps } from './TagEditor';

function Stateful(
  props: Omit<TagEditorProps, 'onChange'> & { delay?: number; fail?: boolean }
) {
  const { delay, fail, ...rest } = props;
  const [tags, setTags] = React.useState(rest.value);
  return (
    <div className="w-96">
      <TagEditor
        {...rest}
        value={tags}
        onChange={async (next) => {
          if (delay) await new Promise((r) => setTimeout(r, delay));
          if (fail) throw new Error('rejected');
          setTags(next);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof TagEditor> = {
  id: 'text-inputs-tageditor',
  title: 'Inputs/Text inputs/TagEditor',
  component: TagEditor,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

Edits a list of free-form tags. Each tag is a chip with a remove button; an input after the chips adds a tag on Enter or comma, and Backspace on an empty input removes the last one. Optional \`suggestions\` open a listbox you can walk with the arrow keys.

### Use it when

- Users label a record with their own vocabulary (custom tags, keywords, aliases).
- The set is open-ended but you want to nudge towards existing values with \`suggestions\`.

### Don't use it when

- Values must come from a fixed list — use \`Select\` with \`multiple\` or \`PillSelect\`.
- You need a single free-text value — use \`Input\`.

### Example

\`\`\`tsx
<TagEditor
  label="Tags"
  value={clinic.tags}
  suggestions={allTags}
  maxTags={10}
  validate={(t) => (t.length > 30 ? 'Keep tags under 30 characters' : undefined)}
  onChange={(tags) => saveClinic({ tags })}
/>
\`\`\`

The caller owns \`value\`. \`onChange\` may return a promise: the field shows a spinner and stays read-only until it settles, and a rejection shows an error (the chips still reflect \`value\`).

### Limitations

- Duplicates are rejected case-insensitively; leading and trailing whitespace is trimmed. Pasting comma-separated text adds each piece.
- A non-empty draft is added when focus leaves the input.
- The input is a \`role="combobox"\` controlling a portalled \`role="listbox"\` via \`aria-activedescendant\`; chips are a labelled \`<ul>\`. Errors render in \`role="alert"\` and are linked with \`aria-describedby\`.
- At \`maxTags\` the input becomes read-only (Backspace still removes).
- English defaults are overridable through \`labels\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'data-display-badge',
          why: 'Each tag chip is a removable Badge (onRemove + removeLabel); TagEditor adds the input, suggestions and async save around them.',
        },
      ],
    },
  },
  argTypes: {
    value: { description: 'Current tags (controlled).' },
    onChange: {
      description: 'Receives the next list. May return a promise.',
      control: false,
    },
    suggestions: { description: 'Values offered while typing.' },
    maxTags: { description: 'Maximum number of tags.', control: 'number' },
    validate: {
      description: 'Return a message to reject a tag.',
      control: false,
    },
    label: { description: 'Visible label.', control: 'text' },
    readOnly: { description: 'Show chips only.' },
    disabled: { description: 'Disable editing.' },
    size: {
      description: 'Field size.',
      control: 'radio',
      options: ['sm', 'md'],
    },
    labels: { description: 'Translatable strings.', control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Stateful label="Tags" value={['VIP', 'Renewal Q4']} />,
};

export const WithSuggestions: Story = {
  render: () => (
    <Stateful
      label="Tags"
      value={['Enterprise']}
      suggestions={[
        'Enterprise',
        'Expansion',
        'Churn risk',
        'Pilot',
        'Reference account',
      ]}
    />
  ),
};

export const MaxAndValidation: Story = {
  render: () => (
    <Stateful
      label="Keywords (max 3)"
      value={['occupational', 'health']}
      maxTags={3}
      validate={(t) =>
        t.length > 12 ? 'Keep it under 12 characters' : undefined
      }
    />
  ),
};

export const AsyncSave: Story = {
  render: () => <Stateful label="Tags" value={['VIP']} delay={800} />,
};

export const SaveFails: Story = {
  render: () => <Stateful label="Tags" value={['VIP']} delay={500} fail />,
};

export const ReadOnly: Story = {
  args: {
    label: 'Tags',
    value: ['VIP', 'Renewal Q4'],
    readOnly: true,
    onChange: () => undefined,
  },
};
