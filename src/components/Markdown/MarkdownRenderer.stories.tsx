import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkdownRenderer } from './MarkdownRenderer';

const meta: Meta<typeof MarkdownRenderer> = {
  id: 'editors-markdown',
  title: 'Modules/Editors/Markdown',
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  component: MarkdownRenderer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Rendering Markdown to sanitised HTML with rich fenced blocks — a renderer, not an editor.** \`MarkdownRenderer\` takes \`text\`, converts it with **marked** through the \`useMarkdown\` hook, sanitises with **DOMPurify**, highlights code with **highlight.js** (13 languages bundled, more lazy-loaded) and replaces special fences with React components: \`\`\`mermaid\` → \`MermaidBlock\`, \`\`\`csv\` → sortable \`CsvBlock\` with export, \`\`\`survey\` → \`SurveyBlock\` form fields, \`\`\`html\` → \`HtmlPreviewBlock\` in a sandboxed iframe, other languages → \`CodeBlock\` with copy. \`cacheKey\` (e.g. \`message._id\`) memoises renders; \`streaming\` switches to synchronous rendering so tokens appear as they arrive, then a final async pass highlights everything. All blocks, \`FenceBlock\`, \`useMarkdown\` and \`highlightCode\` are exported for custom pipelines. Import \`@mieweb/ui/markdown.css\` once.

### Use it when

- Displaying **assistant output, notes or documentation stored as Markdown** — pass it to \`AIMessageDisplay\` via \`renderTextContent\`, or drop it under a saved \`RichEditor\` document.
- The content includes diagrams, CSV tables, embedded forms or HTML demos that should be interactive, not code.
- Tokens stream in and you want progressive rendering (\`streaming\` + a stable \`cacheKey\`).

### Don't use it when

- The user **edits** the text — \`RichEditor\` (Markdown) or \`RichTextEditor\` (HTML).
- The source is HTML, not Markdown — sanitise and render it yourself; this component parses Markdown syntax.
- You cannot accept the optional peers for the fences you use: \`mermaid\` (diagrams), \`papaparse\` (CSV), \`js-yaml\` (survey). Plain Markdown and code blocks need none of them.

### Example

\`\`\`tsx
function AssistantText({ message }: { message: AIMessage }) {
  const streaming = message.status === 'streaming';
  return (
    <MarkdownRenderer
      text={message.text}
      cacheKey={message.id}
      streaming={streaming}
      className="text-sm"
    />
  );
}

<AIMessageDisplay message={m} renderTextContent={(text) => <MarkdownRenderer text={text} cacheKey={m.id} streaming={m.status === 'streaming'} />} />
\`\`\`

Keep \`cacheKey\` stable per message; the renderer appends the text length while \`streaming\` so each delta re-renders.

### Limitations

- Security: HTML output is DOMPurify-sanitised, links get \`target="_blank" rel="noopener noreferrer"\`, and fence markers carry a \`data-md-fence\` sentinel so raw HTML cannot spoof a block. The \`html\` preview runs in an iframe with \`allow-scripts allow-forms\` and **there is no prop to turn that fence off** — treat model-generated HTML as untrusted and strip \`\`\`html\` fences upstream if your audience should not run them.
- Accessibility: output is plain semantic HTML from marked; headings, lists and tables carry no extra ARIA. The lazy block fallback is an unlabelled "Loading…" (no \`aria-busy\`/live region). Block toolbars (copy, sort, export, preview/code toggle) and their labels are English and live inside each block component.
- Rendering is a two-step: \`html\` state is empty on first paint (a flash for large documents) and each HTML segment is injected with \`dangerouslySetInnerHTML\`. Interrupted fences during \`streaming\` may render as code until the closing fence arrives.
- Styling comes from \`@mieweb/ui/markdown.css\` (\`.md-prose\`), not Tailwind utilities; forget the import and you get unstyled HTML. Theme switching re-renders Mermaid diagrams. RTL follows the document direction; tables and code blocks are LTR by nature.
- Peers: \`marked\`, \`dompurify\` and \`highlight.js\` are bundled dependencies; \`mermaid\`, \`papaparse\`, \`js-yaml\` are optional peers loaded only when their fence renders. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      peers: ['mermaid', 'papaparse', 'js-yaml'],
      relationships: [
        {
          type: 'composes with',
          target: 'editors-richeditor',
          why: 'RichEditor emits Markdown; MarkdownRenderer displays that Markdown read-only elsewhere in the app.',
        },
        {
          type: 'composes with',
          target: 'chat-aimessage',
          why: 'Pass MarkdownRenderer through renderTextContent to render assistant text as sanitised Markdown.',
        },
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof MarkdownRenderer>;

const CODE_BLOCKS_MD = `
# Markdown Renderer

Inline \`code\` and **bold**, _italic_, ~~strikethrough~~, and a [link](https://github.com/mieweb/ui).

## Code Block

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
console.log(greet('World'));
\`\`\`

## Table

| Name  | Role      | Active |
|-------|-----------|--------|
| Alice | Engineer  | Yes    |
| Bob   | Designer  | No     |
| Carol | PM        | Yes    |
`;

const CSV_MD = `
## CSV Block

\`\`\`csv
Name,Age,Department,Salary
Alice,32,Engineering,95000
Bob,28,Design,78000
Carol,35,Product,102000
Dave,41,Engineering,115000
\`\`\`
`;

const SURVEY_MD = `
## Survey Block

\`\`\`survey
{
  "elements": [
    { "type": "text", "name": "full_name", "title": "Full Name", "isRequired": true },
    { "type": "radiogroup", "name": "experience", "title": "Years of experience", "choices": ["0-1", "2-5", "5-10", "10+"] },
    { "type": "checkbox", "name": "newsletter", "title": "Subscribe to newsletter" },
    { "type": "dropdown", "name": "role", "title": "Your role", "choices": ["Engineer", "Designer", "PM", "Other"] },
    { "type": "rating", "name": "satisfaction", "title": "Overall satisfaction" }
  ]
}
\`\`\`
`;

const HTML_MD = `
## HTML Preview

\`\`\`html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: system-ui, sans-serif; padding: 16px; }
  h2 { color: #2563eb; }
  button { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
  button:hover { background: #1d4ed8; }
</style></head>
<body>
  <h2>Interactive HTML Preview</h2>
  <p>This is rendered inside a sandboxed iframe.</p>
  <button onclick="this.textContent='Clicked!'">Click me</button>
</body>
</html>
\`\`\`
`;

const MERMAID_MD = `
## Mermaid Diagram

\`\`\`mermaid
graph TD
  A[User] -->|sends message| B(MarkdownRenderer)
  B --> C{Block type?}
  C -->|code| D[FenceBlock]
  C -->|csv| E[CsvBlock]
  C -->|mermaid| F[MermaidBlock]
  C -->|survey| G[SurveyBlock]
  C -->|html| H[HtmlPreviewBlock]
\`\`\`
`;

export const CodeBlocks: Story = {
  args: { text: CODE_BLOCKS_MD },
};

export const CsvBlock: Story = {
  args: { text: CSV_MD },
};

export const SurveyBlock: Story = {
  args: { text: SURVEY_MD },
};

export const HtmlPreview: Story = {
  args: { text: HTML_MD },
};

export const MermaidDiagram: Story = {
  args: { text: MERMAID_MD },
};

export const AllBlocks: Story = {
  args: {
    text: [CODE_BLOCKS_MD, CSV_MD, SURVEY_MD, HTML_MD, MERMAID_MD].join(
      '\n---\n'
    ),
  },
};
