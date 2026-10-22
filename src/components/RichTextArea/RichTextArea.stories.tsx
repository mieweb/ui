import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextArea } from './RichTextArea';

const meta: Meta<typeof RichTextArea> = {
  id: 'editors-richtextarea',
  title: 'Modules/Editors/RichTextArea',
  component: RichTextArea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A textarea-like rich text surface.** \`RichTextArea\` looks like the auto-growing \`Textarea\` — bordered, one Input row tall, grows with content — but is \`RichTextEditor\` in chromeless mode underneath. The toolbar starts hidden; formatting is reached by typing (markdown block shortcuts are on by default: \`##\` + space → heading, \`-\` → bullet list, \`1.\` → numbered list, \`>\` → quote), from the Notion-style **block gutter menu** (hover a row for the \`+\` button, or Ctrl/Cmd+/), or by choosing "Show toolbar" from that menu. Pass \`macros\` and \`.shortcut\` + space expands dot phrases in place; the gutter menu gains an "Insert macro" flyout of every macro plus "Show macro library", docking the searchable \`MacroLibrary\` panel.

**The value contract is RichTextEditor's: \`value\` / \`onChange\` carry HTML, not plain text.** That is the whole reason this is a separate component — grafting rich text onto \`Textarea\` would silently change what \`onChange\` delivers to form posts and native bindings.

### Use it when

- A note field should start small and unobtrusive like a textarea but writers occasionally need headings, lists, quotes or boilerplate macros — case comments, visit notes, message bodies stored as HTML.
- You want formatting available but not advertised: no toolbar until the writer asks for it.

### Don't use it when

- The consumer needs **plain text** — form posts, eSheet bindings, anything that treats the value as a string of words — use \`Textarea\`.
- The writer works in a full document with an always-visible toolbar, merge variables or dictation — use \`RichTextEditor\`.
- The stored format is **Markdown** or you need links/tables/code/collaboration — \`RichEditor\` (\`@mieweb/ui/kerebron\`).

### Example

\`\`\`tsx
const [html, setHtml] = useState('');

<RichTextArea
  value={html}
  onChange={setHtml}
  placeholder="Add a comment…"
  aria-label="Comment"
  macros={macroGroups}
/>
\`\`\`

The host owns the HTML string and is responsible for sanitising it before storage or display.

### Limitations

- Everything in \`RichTextEditor\`'s limitations applies: \`document.execCommand\` formatting, unsanitised \`innerHTML\` out, English-only dictation, caret dropped when \`value\` is rewritten externally.
- Output is **HTML only** — there is no markdown serialisation.
- The block gutter reserves start-side padding (\`ps-10\`) for the \`+\` button, so text starts further in than \`Textarea\`'s \`px-3\`.
- No label/error/helper/count anatomy — it is the editing surface only; pair with \`Label\` and your own field scaffolding.
- Theming: \`border-input\`, \`ring-ring\`, \`bg-background\` tokens; depends on \`RichTextEditor\` and its dependencies. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'text-inputs-textarea',
          why: 'Textarea is a native textarea emitting plain text for forms and bindings; RichTextArea looks the same at rest but emits HTML with markdown shortcuts, a block gutter menu and macros.',
        },
        {
          type: 'alternative to',
          target: 'editors-richtexteditor',
          why: 'RichTextArea is RichTextEditor in chromeless mode — blockMenu, markdownShortcuts, hidden-by-default toolbar — wrapped in Textarea-matched chrome for comment-sized fields; RichTextEditor for full documents with the toolbar on.',
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
      <RichTextArea
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
      <RichTextArea
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
      <RichTextArea
        value="<p>This content is read-only.</p>"
        onChange={() => {}}
        disabled
        aria-label="Read-only comment"
      />
    </div>
  ),
};
