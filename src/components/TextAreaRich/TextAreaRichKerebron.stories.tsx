import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextAreaRichKerebron as TextAreaRich } from './TextAreaRichKerebron';

const meta: Meta<typeof TextAreaRich> = {
  id: 'editors-textarearich-kerebron',
  title: 'Modules/Editors/TextAreaRich (Kerebron)',
  component: TextAreaRich,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**The Kerebron-engined \`TextAreaRich\`.** Same textarea-like surface and the same \`TextAreaRichProps\` contract as [TextAreaRich](?path=/docs/editors-textarearich--docs) — bordered, one Input row tall, auto-growing, toolbar hidden until requested, block gutter menu, \`.shortcut\` macros, \`value\`/\`onChange\` carrying HTML — but the editor underneath is Kerebron's \`CoreEditor\` (ProseMirror) instead of the legacy \`document.execCommand\` engine. That buys a real document model: reliable undo, deterministic markdown block shortcuts, the stock Kerebron toolbar when revealed, and dictation inserted through transactions.

Ships from the optional **\`@mieweb/ui/kerebron\`** entry, not the main barrel — upgrading is an import-path change:

\`\`\`tsx
import { TextAreaRich } from '@mieweb/ui/kerebron';
import '@mieweb/ui/kerebron.css';
\`\`\`

Install the \`@kerebron/*\` peers and serve the WASM assets exactly as for [RichEditor](?path=/docs/editors-richeditor--docs) (same entry, same setup, including the \`patches/@kerebron__*\` fixes).

### Use it when

- A comment-sized rich field should ride the ProseMirror engine — the host already ships \`@mieweb/ui/kerebron\` (eSheet narrative fields do this) or wants to retire \`document.execCommand\`.

### Don't use it when

- The host cannot add the Kerebron peers, WASM assets, or \`kerebron.css\` — use the main-barrel [TextAreaRich](?path=/docs/editors-textarearich--docs), which needs none of them.
- The consumer needs **plain text** — \`Textarea\`.
- The writer works in a full Markdown document with an always-on toolbar — \`RichEditor\`.

### Behavior deltas from the legacy engine

- The block gutter \`+\` button rests beside the field and docks inward on hover/focus (the legacy engine reserves the start padding permanently).
- \`sanitizeHtml\`, \`variableGroups\` and \`markdownShortcuts\` from \`RichTextEditorProps\` are not yet honored — hosts relying on them should stay on the main-barrel surface.
- Output HTML is ProseMirror-normalized (e.g. no \`style\` attributes from \`execCommand\`).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/kerebron',
      relationships: [
        {
          type: 'alternative to',
          target: 'editors-textarearich',
          why: 'Same TextAreaRichProps contract on the legacy engine with zero optional peers; this one trades peers + kerebron.css for the ProseMirror document model.',
        },
        {
          type: 'composes with',
          target: 'editors-richeditor',
          why: 'Same @mieweb/ui/kerebron entry, peers, CSS and WASM setup; RichEditor is the full Markdown document editor, this is the comment-sized HTML surface.',
        },
        {
          type: 'composes with',
          target: 'editors-macrolibrary',
          why: 'The macros prop enables .shortcut dot-phrase expansion, an "Insert macro" gutter flyout, and a "Show macro library" item that docks the MacroLibrary panel.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BasicExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <TextAreaRich
        value={value}
        onChange={setValue}
        placeholder="Add a comment — ## + space for a heading, hover a row for the + menu…"
        aria-label="Comment"
      />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Starts one Input row tall and auto-grows with content. The toolbar is hidden; markdown shortcuts and the block gutter menu carry the formatting.',
      },
    },
  },
};

function WithMacrosExample() {
  const [value, setValue] = useState(
    '<p>Exam reviewed. Type .c or .r then space, or hover a row and pick “Insert macro”.</p>'
  );
  return (
    <div className="max-w-2xl">
      <TextAreaRich
        value={value}
        onChange={setValue}
        macros={[
          {
            id: 'library',
            label: 'Exam normals',
            macros: [
              {
                id: 'cardio',
                label: 'Cardio — WNL',
                content: 'Regular rate and rhythm, no murmurs.',
                shortcut: '.c',
              },
              {
                id: 'resp',
                label: 'Respiratory — WNL',
                content: 'Lungs clear to auscultation bilaterally.',
                shortcut: '.r',
              },
            ],
          },
        ]}
        placeholder="Add a note…"
        aria-label="Note body"
      />
    </div>
  );
}

export const WithMacros: Story = {
  name: 'With macros',
  render: () => <WithMacrosExample />,
  parameters: {
    docs: {
      description: {
        story:
          'With `macros`, typing a `.shortcut` + space expands it in place, and the gutter menu gains an “Insert macro” flyout plus “Show macro library”, docking the searchable MacroLibrary panel.',
      },
    },
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-2xl">
      <TextAreaRich
        value="<p>This content is read-only.</p>"
        onChange={() => {}}
        disabled
        aria-label="Read-only comment"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled and `readOnly` make the ProseMirror surface non-editable, mark the stock toolbar `inert`, and dim it; `readOnly` keeps the text selectable and announces `aria-readonly`.',
      },
    },
  },
};
