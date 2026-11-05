import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { FileDocument } from './FileDocument';
import { helperTypeScript, planMarkdown } from './storyData';

const meta: Meta<typeof FileDocument> = {
  id: 'files-filedocument',
  title: 'Modules/Files/FileDocument',
  component: FileDocument,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Reading a text file by default, with editing one click away and no edits lost by accident.** \`FileDocument\` shows the \`path\`, a View/Edit toggle, and either a \`FileViewer\` (View) or a plain-text editor (Edit). Switching to View before saving previews the **draft**, an "Unsaved changes" status appears while the draft differs from \`content\`, and Save/Cancel return to View. Save calls \`onSave(draft)\`: the button is busy while its promise is pending, and a rejection keeps the user in Edit with an error. Cancel asks \`confirmDiscard()\` first when the draft has edits.

### Use it when

- Users mostly **read** a file (notes, plans, config) but sometimes fix it in place.
- Your app owns loading and saving, and wants the toggle, draft preview and save states without rebuilding them.

### Don't use it when

- Nobody edits the file — use \`FileViewer\` on its own.
- Users need rich-text formatting, syntax-aware editing, or collaboration — use \`RichEditor\` (\`@mieweb/ui/kerebron\`) or \`RichTextEditor\`.
- The text is a form field inside a larger form — use \`Textarea\`.

### Example

\`\`\`tsx
const { text, save } = useProjectFile(projectId, path);
const { confirm } = useConfirm();

<FileDocument
  key={path}
  path={path}
  content={text}
  onSave={(draft) => save(draft)} // resolve after the new text is stored
  confirmDiscard={() => confirm(t('files.discard'))}
  onDirtyChange={setHasUnsavedEdits} // guard navigation in your app
  labels={{ view: t('files.view'), edit: t('files.edit'), save: t('common.save') }}
/>
\`\`\`

Draft and mode can each be controlled (\`draft\` + \`onDraftChange\`, \`mode\` + \`onModeChange\`) or left to the component. An uncontrolled draft follows \`content\` while it has no edits, so reloading the file updates the view in place; give the component a new \`key\` to reset it.

### Limitations

- Accessibility: the toggle is a \`role="group"\` named by \`labels.modeGroup\` holding two \`aria-pressed\` buttons; the editor is a \`<textarea>\` named by \`labels.editor(path)\`; "Unsaved changes" is a \`role="status"\` and a save failure a \`role="alert"\`. The view is the focusable region from \`FileViewer\`.
- Guarding other ways out (closing a panel, opening another file, leaving the page) is the host's job — use \`onDirtyChange\`.
- The editor is a plain \`<textarea>\`: no line numbers, highlighting or undo history beyond the browser's.
- RTL: logical spacing throughout; the editor uses \`dir="auto"\`. i18n: every string is in \`labels\` (English defaults), including the viewer's.
- Entry \`@mieweb/ui/components/FileViewer\`, with the same Markdown peers as \`FileViewer\`; import \`@mieweb/ui/markdown.css\` once for code colours.`,
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
          type: 'contains',
          target: 'files-fileviewer',
          why: 'View mode is a FileViewer showing the current draft.',
        },
        {
          type: 'composes with',
          target: 'files-filemanager',
          why: "FileManager lists a record's files and hands Preview to onPreview; FileDocument opens the text file for reading and editing.",
        },
      ],
    },
  },
  argTypes: {
    path: { description: 'The file’s path or name, shown above the toggle.' },
    content: {
      description:
        'The last saved text. An uncontrolled draft follows it while unedited.',
    },
    draft: {
      description: 'Controlled draft. Omit to let the component keep it.',
    },
    onDraftChange: { description: 'Called on every edit and on Cancel.' },
    mode: { description: 'Controlled mode: `view` or `edit`.' },
    defaultMode: {
      description:
        'Initial mode when uncontrolled, e.g. `edit` for a new file.',
    },
    onModeChange: {
      description: 'Called when the toggle, Save or Cancel changes mode.',
    },
    onSave: {
      description:
        '`(draft) => void | Promise<void>`. Busy while pending; returns to View on success, shows `labels.saveFailed` on rejection.',
    },
    confirmDiscard: {
      description:
        'Asked before Cancel drops an edited draft; resolve `false` to keep editing.',
    },
    onCancel: { description: 'Called after Cancel has dropped the draft.' },
    onDirtyChange: {
      description:
        'Called when the draft starts or stops differing from `content`.',
    },
    labels: { description: 'Overrides for every English default string.' },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[480px] max-w-xl flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileDocument>;

/** Saves after a short delay so the busy state is visible. */
function DocumentWithSave(
  props: Omit<
    React.ComponentProps<typeof FileDocument>,
    'content' | 'onSave'
  > & {
    initial: string;
    fail?: boolean;
  }
) {
  const { initial, fail, ...rest } = props;
  const [content, setContent] = React.useState(initial);
  return (
    <FileDocument
      {...rest}
      content={content}
      className="flex-1"
      onSave={(draft) =>
        new Promise<void>((resolve, reject) =>
          setTimeout(() => {
            if (fail) return reject(new Error('offline'));
            setContent(draft);
            resolve();
          }, 600)
        )
      }
    />
  );
}

export const Default: Story = {
  render: () => (
    <DocumentWithSave path="notes/plan.md" initial={planMarkdown} />
  ),
};

export const Code: Story = {
  render: () => (
    <DocumentWithSave path="src/greet.ts" initial={helperTypeScript} />
  ),
};

export const NewFile: Story = {
  name: 'New file (opens in Edit)',
  render: () => (
    <DocumentWithSave path="notes/todo.md" initial="" defaultMode="edit" />
  ),
};

export const ConfirmBeforeDiscard: Story = {
  name: 'Confirm before discarding',
  render: () => (
    <DocumentWithSave
      path="notes/plan.md"
      initial={planMarkdown}
      defaultMode="edit"
      confirmDiscard={() => window.confirm('Discard your unsaved changes?')}
    />
  ),
};

export const SaveFails: Story = {
  name: 'Save fails',
  render: () => (
    <DocumentWithSave
      path="notes/plan.md"
      initial={planMarkdown}
      defaultMode="edit"
      fail
    />
  ),
};
