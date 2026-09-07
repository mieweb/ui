import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor, type RichTextVariableGroup } from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  id: 'editors-richtexteditor',
  title: 'Modules/Editors/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A lightweight HTML editor for templated notes and letters, with variable insertion and dictation.** \`RichTextEditor\` is a \`contentEditable\` \`div\` (\`role="textbox" aria-multiline\`) that mirrors its \`innerHTML\` to \`value\` / \`onChange\` — the stored format is **HTML**. The toolbar uses \`document.execCommand\` for bold, italic, underline, bullet/numbered lists and left/center/right alignment. Pass \`variableGroups\` (\`{ label, variables: [{ label, value, insertValue? }] }\`) to get a searchable **Variables** \`Dropdown\` that inserts \`{{tokens}}\` at the caret, plus a **\`<< >>\` to \`{{ }}\`** converter (\`convertAngleBracketsToMustache\`). \`enableDictation\` (default \`true\`) adds a **Dictate** button on the Web Speech API (\`SpeechRecognition\` / \`webkitSpeechRecognition\`) that runs spoken punctuation through \`processDictation\` ("period" → ".", "new paragraph", …). \`placeholder\`, \`disabled\`, \`aria-label\`, \`onDictationError\` complete the surface; the ref is the editable \`div\`. Everything ships on the main \`@mieweb/ui\` entry with no extra peers.

### Use it when

- The output is stored or mailed as **HTML** — employer letters, case notes, message templates — and the writer needs basic formatting plus merge fields.
- Users fill in **template variables** from a known catalogue, or convert legacy \`<<field>>\` markers.
- Clinicians dictate into the note and the browser (Chrome/Edge/Safari) exposes \`SpeechRecognition\`.

### Don't use it when

- The stored format is **Markdown**, you need headings/tables/code blocks, real undo history or **multi-user collaboration** — \`RichEditor\` (\`@mieweb/ui/kerebron\`).
- Plain text is enough — \`Textarea\`; a single line — \`Input\`.
- The HTML will be rendered to other users without sanitising: the editor emits raw \`innerHTML\` and does not sanitise pasted content.
- You need offline/on-device speech recognition — the Web Speech API streams to the vendor's service; see \`RecordButton\` + your own transcription for a blob-based flow.

### Example

\`\`\`tsx
const [html, setHtml] = useState(template.bodyHtml);
const [dictationError, setDictationError] = useState<string | null>(null);

<RichTextEditor
  value={html}
  onChange={setHtml}
  placeholder="Write the letter…"
  aria-label="Letter body"
  variableGroups={[
    { label: 'Employee', variables: [{ label: 'Full name', value: '{{employee.name}}' }] },
    { label: 'Case', variables: [{ label: 'Adjuster', value: '{{case.adjuster}}', insertValue: '{{case.adjuster}}, {{case.adjusterPhone}}' }] },
  ]}
  onDictationError={setDictationError}
  disabled={saving}
/>
{dictationError && <Alert variant="warning">{dictationError}</Alert>}
<Button onClick={() => save(sanitize(html))}>Save</Button>
\`\`\`

The host owns the HTML string and is responsible for sanitising it before storage or display.

### Limitations

- Accessibility: the editable region is labelled by \`aria-label\` **or falls back to the placeholder text**; toolbar icon buttons have \`aria-label\` + \`title\` (Bold, Italic, Underline, Bullet list, Numbered list, Align left/center/right), while Variables, Convert and Dictate rely on visible text. No \`aria-pressed\` reflects the current formatting, no \`aria-live\` announces dictation start/stop or errors (they go to \`onDictationError\`, else \`console.warn\`). The placeholder is \`aria-hidden\`.
- Formatting is \`document.execCommand\` — deprecated, browser-dependent markup (\`<b>\` vs \`<strong>\`, inline styles for alignment), and there are no headings, links, images, tables or code. Undo/redo is the browser's native contentEditable history. Setting \`value\` externally rewrites \`innerHTML\` and **drops the caret**.
- Dictation: requests \`getUserMedia\` first to force the permission prompt, then runs \`SpeechRecognition\` with \`lang\` hard-coded to \`en-US\`, \`continuous\`, auto-restarting on end; only final results are inserted. Unsupported browsers (Firefox) get a disabled button with an English \`title\`. \`processDictation\`'s punctuation heuristics are English-only.
- The \`<< >>\` converter and \`{{ }}\` tokens are plain text — nothing validates that a variable exists. \`insertValue\` with newlines becomes \`<br>\`s.
- The surface uses \`prose prose-sm\` classes that **have no effect** unless the host installs \`@tailwindcss/typography\`; \`min-h-[250px]\` is fixed. RTL: alignment commands are physical (\`justifyLeft\`/\`justifyRight\`), the placeholder is anchored \`left-0\`, and the toolbar is a symmetric flex row.
- Theming: \`border-border\`, \`bg-background\`, \`bg-muted\`, \`text-muted-foreground\`; disabled text hard-codes \`neutral-700/300\`. Depends on \`Button\`, \`Separator\`, \`Dropdown\`, \`lucide-react\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'editors-richeditor',
          why: 'RichEditor stores Markdown on ProseMirror via the @mieweb/ui/kerebron entry with Yjs collab; RichTextEditor stores HTML from a contentEditable div on the main barrel with variables and dictation.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-textarea',
          why: 'RichTextEditor when the note needs bold/lists/alignment, merge variables or dictation; Textarea for plain multi-line text.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-dropdown',
          why: 'The searchable Variables menu is a Dropdown with DropdownLabel groups and DropdownItem entries.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const variableGroups: RichTextVariableGroup[] = [
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
];

function BasicExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Start writing your note…"
        aria-label="Note body"
      />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
};

function WithVariablesExample() {
  const [value, setValue] = useState(
    '<p>Dear &lt;&lt;employee.name&gt;&gt;,</p>'
  );
  return (
    <div className="max-w-2xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Compose a letter…"
        variableGroups={variableGroups}
        aria-label="Letter body"
      />
    </div>
  );
}

export const WithVariables: Story = {
  render: () => <WithVariablesExample />,
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RichTextEditor
        value="<p>This content is read-only.</p>"
        onChange={() => {}}
        disabled
        aria-label="Read-only content"
      />
    </div>
  ),
};
