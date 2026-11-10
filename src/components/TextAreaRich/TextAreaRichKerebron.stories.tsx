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

**The Kerebron-engined \`TextAreaRich\`.** Same textarea-like surface and the same \`TextAreaRichProps\` contract as the deprecated [legacy TextAreaRich](?path=/docs/deprecated-textarearich--docs) — bordered, one Input row tall, auto-growing, toolbar hidden until requested, block gutter menu, \`.shortcut\` macros, \`value\`/\`onChange\` carrying HTML — but the editor underneath is Kerebron's \`CoreEditor\` (ProseMirror) instead of the legacy \`document.execCommand\` engine. That buys a real document model: reliable undo, deterministic markdown block shortcuts, the stock Kerebron toolbar when revealed, and dictation inserted through transactions.

Ships from the **\`@mieweb/ui/kerebron\`** entry — upgrading from the legacy surface is an import-path change:

\`\`\`tsx
import { TextAreaRich } from '@mieweb/ui/kerebron';
import '@mieweb/ui/kerebron.css';
\`\`\`

Since 0.12 this engine also powers the main barrel's [Textarea](?path=/docs/text-inputs-textarea--docs), so the \`@kerebron/*\` runtime packages are **required peers** of \`@mieweb/ui\` (only the Yjs collab peers stay optional). Serve the WASM assets exactly as for [RichEditor](?path=/docs/editors-richeditor--docs) (same setup, including the \`patches/@kerebron__*\` fixes).

### Use it when

- A comment-sized rich field should ride the ProseMirror engine — the host already ships \`@mieweb/ui/kerebron\` (eSheet narrative fields do this) or wants to retire \`document.execCommand\`.

### Don't use it when

- The consumer needs **plain text** — \`Textarea\` (same engine, plain-text contract).
- The writer works in a full Markdown document with an always-on toolbar — \`RichEditor\`.

### Behavior deltas from the legacy engine

- **Strictly controlled**, like a native input: an edit that \`onChange\` does not echo back into \`value\` reverts. (The legacy engine only applied \`value\` when the prop changed.)
- The block gutter \`+\` button rests beside the field and docks inward on hover/focus (the legacy engine reserves the start padding permanently).
- \`sanitizeHtml\` and \`markdownShortcuts\` from \`RichTextEditorProps\` are not honored — pastes are filtered through the ProseMirror schema (instead of \`sanitizeHtml\`) and markdown block shortcuts are always on. \`variableGroups\` **is** honored: the toolbar gains a searchable **Variables** menu that inserts \`{{variable}}\` tokens at the caret through a ProseMirror transaction (native undo). The legacy \`<< >>\` → \`{{ }}\` converter button is not ported.
- Output HTML is ProseMirror-normalized (e.g. no \`style\` attributes from \`execCommand\`).

### Media capture opt-in

Set \`mediaCapture\` to dock the capture ribbon from [RichMediaCaptureEditor](?path=/docs/editors-richmediacaptureeditor--docs) above the field — same actions, same \`RichEditorHandle.insertFiles\` pipeline, same conditional availability. Default **off**: without the prop nothing about the field changes. Pass \`true\` for the defaults or a \`MediaCaptureOptions\` object (\`scanDocument\`, \`extraCaptures\`); set \`mediaUpload.uploadHandler\` or captures embed as base64 \`data:\` URLs.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/kerebron',
      relationships: [
        {
          type: 'supersedes',
          target: 'deprecated-textarearich',
          why: 'The legacy document.execCommand surface is deprecated; this one keeps the TextAreaRichProps contract on the ProseMirror document model, trading the @kerebron/* peers + kerebron.css for reliable undo and normalized HTML.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-textarea',
          why: 'Textarea renders this same surface but flattens the value to plain text for forms and bindings; TextAreaRich hands the host the HTML to persist.',
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
        {
          type: 'composes with',
          target: 'editors-richmediacaptureeditor',
          why: 'The mediaCapture opt-in docks that component’s capture ribbon above the field, inserting captures through the same RichEditorHandle.insertFiles / mediaUpload pipeline.',
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

function WithVariablesExample() {
  const [value, setValue] = useState('<p>Dear {{employee.name}},</p>');
  return (
    <div className="max-w-2xl">
      <TextAreaRich
        value={value}
        onChange={setValue}
        defaultToolbar="visible"
        variableGroups={[
          {
            label: 'Employee',
            variables: [
              { label: 'First Name', value: '{{employee.firstName}}' },
              { label: 'Last Name', value: '{{employee.lastName}}' },
              { label: 'Full Name', value: '{{employee.name}}' },
              { label: 'Email', value: '{{employee.email}}' },
            ],
          },
          {
            label: 'Case',
            variables: [
              { label: 'Case Number', value: '{{case.caseNumber}}' },
              { label: 'Case Status', value: '{{case.status}}' },
              {
                label: 'Case Adjuster',
                value: '{{case.adjuster}}',
                insertValue:
                  '{{case.adjuster}}, {{case.adjusterPhone}}, {{case.adjusterEmail}}',
              },
            ],
          },
        ]}
        placeholder="Compose a letter…"
        aria-label="Letter body"
      />
    </div>
  );
}

export const WithVariables: Story = {
  name: 'With variables',
  render: () => <WithVariablesExample />,
  parameters: {
    docs: {
      description: {
        story:
          'With `variableGroups`, the toolbar gains a searchable **Variables** menu (the `{ }` button — same `Dropdown` groups as the deprecated `RichTextEditor`). Picking an entry inserts its `{{variable}}` token at the caret as one ProseMirror transaction, so a single undo removes it. The toolbar starts visible here via `defaultToolbar="visible"`; with the default hidden toolbar, reveal it from the block gutter menu first.',
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

/**
 * Pretends to upload: returns an object URL so the demo image actually
 * renders. A real media store returns a persistent https URL instead — an
 * unreachable src leaves a broken-image glyph in the document.
 */
const mockUploadHandler = async (file: File) => {
  await new Promise((r) => setTimeout(r, 300));
  return URL.createObjectURL(file);
};

function WithMediaCaptureExample() {
  const [value, setValue] = useState('<p>Attach evidence below.</p>');
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <TextAreaRich
        value={value}
        onChange={setValue}
        mediaCapture
        mediaUpload={{ uploadHandler: mockUploadHandler }}
        aria-label="Comment with media capture"
      />
      <pre
        data-testid="html-output"
        className="max-h-40 overflow-auto text-xs whitespace-pre-wrap"
      >
        {value}
      </pre>
    </div>
  );
}

export const WithMediaCapture: Story = {
  name: 'With media capture',
  render: () => <WithMediaCaptureExample />,
  parameters: {
    docs: {
      description: {
        story:
          'The `mediaCapture` opt-in docks the capture ribbon above the field; captures land at the caret as image/video nodes through the editor’s `mediaUpload` pipeline (here a mock `uploadHandler` — the `<pre>` echoes the HTML the field emits). Unavailable captures are hidden, and the ribbon disappears entirely while the field is `disabled`/`readOnly`.',
      },
    },
  },
};
