import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkdownRenderer } from './MarkdownRenderer';

const meta: Meta<typeof MarkdownRenderer> = {
  title: 'Components/Markdown/MarkdownRenderer',
  component: MarkdownRenderer,
  parameters: { layout: 'padded' },
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
