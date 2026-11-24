import type { Meta, StoryObj } from '@storybook/react';
import { FileViewer } from './FileViewer';
import {
  arabicMarkdown,
  helperTypeScript,
  planMarkdown,
  settingsJson,
} from './storyData';

const meta: Meta<typeof FileViewer> = {
  id: 'files-fileviewer',
  title: 'Modules/Files/FileViewer',
  component: FileViewer,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Showing the contents of a text file the way a reader wants to see it.** \`FileViewer\` picks the presentation from the file's \`path\`: \`.md\` / \`.markdown\` renders as a document through the SuperChat Markdown renderer (tables, task lists, fenced code), other known extensions (\`.ts\`, \`.json\`, \`.py\`, \`.yml\`, \`Makefile\`, …) render as one syntax-highlighted code block with a Copy button, and anything else — or any file over \`highlightLimit\` characters (200,000 by default) — renders as plain monospace text. The helpers behind that choice (\`isMarkdownPath\`, \`fileViewLanguage\`, \`toCodeFence\`) are exported too.

### Use it when

- The user opens a project file, attachment or generated artifact and should **read** it, not wade through raw \`#\` and \`|\`.
- You already have the text in memory (loading, permissions and caching stay in your app).

### Don't use it when

- The user should also be able to change the file — use [FileDocument](?path=/docs/files-filedocument--docs), which wraps this viewer with an Edit toggle and Save/Cancel.
- You are rendering a chat message or Markdown you authored — use the SuperChat renderer (\`createMarkdownRenderer\`) or [MarkdownRenderer](?path=/docs/editors-markdown--docs) directly; there is no file name to decide by.
- The file is binary (images, PDFs) — show a preview or a download link instead.

### Example

\`\`\`tsx
const { data: file } = useProjectFile(projectId, path);

{file && (
  <FileViewer
    path={path}
    text={file.text}
    labels={{ region: (p) => t('files.preview', { path: p }), empty: t('files.empty') }}
  />
)}
\`\`\`

Pass \`renderMarkdown\` to reuse your app's own Markdown renderer (for example one with Mermaid or math plugins); code files go through it as one fenced block.

### Limitations

- Accessibility: the view is a \`role="region"\` named by \`labels.region(path)\` with \`tabIndex={0}\`, so keyboard users can scroll long files. An empty file renders \`labels.empty\` instead of the region.
- RTL: code is an LTR island (\`dir="ltr"\`) because source reads left to right; Markdown uses \`dir="auto"\` so prose follows its own script, while its fenced code blocks stay left to right.
- Highlighting covers rehype-highlight's default language set; unknown extensions are plain text. Very large files skip highlighting entirely. Code colours come from \`@mieweb/ui/markdown.css\`; import it once, as for \`MarkdownRenderer\`.
- Markdown is sanitised (the SuperChat renderer's default), so raw HTML in a file does not render.
- i18n: two strings, both overridable through \`labels\` (English defaults).
- Entry \`@mieweb/ui/components/FileViewer\` (not the main entry) because it needs the Markdown peers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/components/FileViewer',
      peers: [
        'react-markdown',
        'remark-gfm',
        'rehype-sanitize',
        'rehype-highlight',
      ],
      relationships: [
        {
          type: 'composes with',
          target: 'files-filemanager',
          why: "FileManager lists a record's files and hands Preview to onPreview; FileViewer shows the text file it opens.",
        },
        {
          type: 'uses',
          target: 'superchat-superchat-panel',
          why: 'Markdown and code render through SuperChat’s createMarkdownRenderer with the code plugin, so files look like chat replies.',
        },
        {
          type: 'alternative to',
          target: 'editors-markdown',
          why: 'FileViewer picks Markdown, highlighted code or plain text from a file name; MarkdownRenderer renders a Markdown string you already know is Markdown, with Mermaid, CSV and survey fences.',
        },
      ],
    },
  },
  argTypes: {
    path: {
      description:
        'The file’s path or name. Its extension picks Markdown, highlighted code or plain text.',
    },
    text: { description: 'The file’s text.' },
    highlightLimit: {
      description:
        'Above this many characters the text renders without highlighting. Defaults to 200,000.',
    },
    renderMarkdown: {
      description:
        '`(markdown, key) => ReactNode`. Replaces the built-in Markdown renderer; `key` is the path.',
      control: false,
    },
    labels: {
      description:
        'Overrides for `region(path)` (the view’s accessible name) and `empty`.',
    },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[420px] max-w-xl flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileViewer>;

export const Markdown: Story = {
  args: { path: 'notes/plan.md', text: planMarkdown, className: 'flex-1' },
};

export const Code: Story = {
  args: { path: 'src/greet.ts', text: helperTypeScript, className: 'flex-1' },
};

export const PlainText: Story = {
  name: 'Plain text (over the highlight limit)',
  args: {
    path: 'config/settings.json',
    text: settingsJson,
    highlightLimit: 10,
    className: 'flex-1',
  },
};

export const Empty: Story = {
  args: { path: 'notes/todo.md', text: '' },
};

export const RightToLeft: Story = {
  name: 'Right to left',
  globals: { direction: 'rtl' },
  args: { path: 'notes/plan-ar.md', text: arabicMarkdown, className: 'flex-1' },
};
