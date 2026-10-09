import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmailEditor } from './EmailEditor';
import { renderEmailMjml } from './renderEmailMjml';
import {
  createEmailBlock,
  createEmptyEmailContentTree,
  type EmailContentTree,
  type EmailDesignSettings,
  type EmailMergeTag,
} from './types';

const meta: Meta<typeof EmailEditor> = {
  id: 'editors-emaileditor',
  title: 'Modules/Editors/EmailEditor',
  component: EmailEditor,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**A block-based email builder: a palette, a drag-to-reorder canvas, per-block settings and global design.** The document is a JSON \`EmailContentTree\` of blocks — \`hero\`, \`columns\`, \`heading\`, \`text\`, \`button\`, \`image\`, \`divider\`, \`spacer\`, \`social\`, \`quote\`, \`table\`, \`html\`, \`footer\` — plus optional \`EmailDesignSettings\` (font, content width, page/content/text/heading/link/button colours). The canvas is a WYSIWYG approximation; **\`renderEmailMjml(tree, { design })\`** serialises the same document to MJML, which the host compiles with \`mjml\` (server) or \`mjml-browser\` into client-safe HTML. Text blocks are edited with \`RichTextEditor\`, so \`mergeTags\` appear in its Variables menu. The model matches Waggleline's email builder field-for-field for this shared block set; product-specific block types must be converted by the host before loading (unrecognised blocks show an unsupported-block placeholder and are left out of the MJML).

### Use it when

- Users compose **marketing or transactional emails** — newsletters, announcements, onboarding — and need layout, not just formatted text.
- The host stores the email as data and renders/sends it server-side, with merge fields resolved at send time.

### Don't use it when

- The message is a single formatted body with merge fields (a letter, a note, a reply) — \`RichTextEditor\`.
- The content is Markdown, or several people edit it at once — \`RichEditor\`.
- You need sending, recipients, scheduling, templates or analytics: those are the host's; this component edits a document.

### Example

\`\`\`tsx
const [tree, setTree] = useState(() => draft.tree ?? createEmptyEmailContentTree());
const [design, setDesign] = useState<EmailDesignSettings>(brand.emailDesign);

<EmailEditor
  value={tree}
  onChange={setTree}
  design={design}
  onDesignChange={setDesign}
  mergeTags={[{ token: '{{first_name}}', label: 'First name', group: 'Contact' }]}
  onUploadImage={(file) => uploadToCdn(file)}
/>
<Button onClick={() => save({ tree, design, mjml: renderEmailMjml(tree, { design }) })}>
  Save
</Button>
\`\`\`

The host owns both values, saves them, and compiles the MJML when sending.

### Limitations

- **Drag is pointer-only.** Keyboard and screen-reader users add blocks by activating palette buttons (inserted after the selection) and reorder with each block's **Move up / Move down** buttons; adds, moves, duplicates and deletes are announced through a polite live region. Every block's toolbar has a **Select <type>** toggle (\`aria-pressed\`); clicking a block's body does the same for the mouse. Dragging a palette item onto the canvas inserts at the drop position.
- **Columns hold content blocks only** (no nested columns or heroes); add to a column from the columns block's settings. Columns wrap below ~160px each on narrow canvases; MJML stacks them on mobile.
- **Undo/redo** (toolbar, ⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z outside text fields) covers the last 50 edits made through the editor; changing \`value\` from outside is not recorded.
- **Security.** \`text\` and \`html\` blocks are HTML. The canvas renders them through DOMPurify; \`renderEmailMjml\` sanitises them with DOMPurify by default and **throws where no DOM exists** unless you pass \`sanitizeHtml\`. Plain-text fields are escaped, URLs are restricted to http(s)/mailto/tel/anchors/root-relative/\`{{merge}}\`, and colours/gradients that are not plain CSS values are dropped.
- **Email colours are data, not theme.** The canvas shows the email's own colours in both light and dark mode, and is \`dir="ltr"\` like the default MJML output; the surrounding chrome uses \`@mieweb/ui\` tokens and logical (RTL-safe) spacing. The panels stack below \`lg\`.
- **i18n.** Every chrome string comes from \`labels\` (\`defaultEmailEditorLabels\`); block defaults (\`createEmailBlock\`) and the footer's "Unsubscribe" fallback are English. Social icons in the MJML are MJML's hosted defaults.
- Depends on \`@dnd-kit/*\`, \`dompurify\`, \`lucide-react\`, \`Tabs\`, \`Button\`, \`Input\`, \`Select\`, \`Switch\`, \`Textarea\`, \`RichTextEditor\`. No peers. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'editors-richtexteditor',
          why: 'Text blocks are edited with RichTextEditor; mergeTags become its variableGroups.',
        },
        {
          type: 'alternative to',
          target: 'editors-richtexteditor',
          why: 'EmailEditor when the message needs layout blocks and is sent as an email; RichTextEditor for a single formatted HTML body.',
        },
      ],
    },
  },
  argTypes: {
    value: {
      description: 'The email document (`EmailContentTree`). Controlled.',
      table: { category: 'Data' },
    },
    onChange: {
      description: 'Receives the next document after every edit.',
      table: { category: 'Callbacks' },
    },
    design: {
      description:
        'Global font, width and colours; merged over `createDefaultDesignSettings()`.',
      table: { category: 'Data' },
    },
    onDesignChange: {
      description: 'Enables the Design tab. Omit for read-only design.',
      table: { category: 'Callbacks' },
    },
    mergeTags: {
      description: 'Merge fields offered in the text block Variables menu.',
      table: { category: 'Data' },
    },
    blockTypes: {
      description:
        'Palette order and availability. Defaults to every block type.',
      table: { category: 'Data' },
    },
    onUploadImage: {
      description:
        'Uploads a picked file and resolves with its URL; adds an Upload button to image blocks.',
      table: { category: 'Callbacks' },
    },
    labels: {
      description: 'Overrides for any user-facing string.',
      table: { category: 'Slots' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmailEditor>;

const mergeTags: EmailMergeTag[] = [
  { token: '{{first_name}}', label: 'First name', group: 'Contact' },
  { token: '{{company_name}}', label: 'Company', group: 'Contact' },
  { token: '{{sender_name}}', label: 'Sender', group: 'System' },
];

function newsletter(): EmailContentTree {
  const columns = createEmailBlock('columns');
  columns.columns[0].blocks.push(
    { ...createEmailBlock('heading'), level: 3, text: 'Faster scheduling' },
    {
      ...createEmailBlock('text'),
      content: '<p>Book exams in two clicks from the new calendar.</p>',
    }
  );
  columns.columns[1].blocks.push(
    { ...createEmailBlock('heading'), level: 3, text: 'Clearer results' },
    {
      ...createEmailBlock('text'),
      content: '<p>Every result now links to its order and provider.</p>',
    }
  );
  return {
    version: '1.0',
    blocks: [
      {
        ...createEmailBlock('hero'),
        categoryText: 'Product update',
        headline: 'What’s new this month',
        backgroundGradient: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      },
      {
        ...createEmailBlock('text'),
        content:
          '<p>Hi {{first_name}},</p><p>Here is what shipped for {{company_name}} in October.</p>',
      },
      columns,
      {
        ...createEmailBlock('button'),
        text: 'See the release notes',
        url: 'https://example.com/notes',
      },
      createEmailBlock('divider'),
      {
        ...createEmailBlock('quote'),
        text: 'Scheduling time dropped by half.',
        author: 'Dana Mercer',
        role: 'HR Director',
      },
      createEmailBlock('social'),
      {
        ...createEmailBlock('footer'),
        companyName: 'Acme Health',
        address: '1 Main St, Fort Wayne, IN',
      },
    ],
  };
}

function Editor({
  initial,
  withDesign = true,
}: {
  initial: () => EmailContentTree;
  withDesign?: boolean;
}) {
  const [tree, setTree] = useState(initial);
  const [design, setDesign] = useState<EmailDesignSettings>({});
  return (
    <div className="p-4">
      <EmailEditor
        value={tree}
        onChange={setTree}
        design={design}
        onDesignChange={withDesign ? setDesign : undefined}
        mergeTags={mergeTags}
        onUploadImage={async (file) => URL.createObjectURL(file)}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Editor initial={newsletter} />,
};

export const Blank: Story = {
  render: () => <Editor initial={createEmptyEmailContentTree} />,
};

export const Empty: Story = {
  render: () => <Editor initial={() => ({ version: '1.0', blocks: [] })} />,
};

export const LimitedPalette: Story = {
  render: () => {
    function Limited() {
      const [tree, setTree] = useState(createEmptyEmailContentTree);
      return (
        <div className="p-4">
          <EmailEditor
            value={tree}
            onChange={setTree}
            blockTypes={['heading', 'text', 'button', 'divider', 'footer']}
          />
        </div>
      );
    }
    return <Limited />;
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  render: () => <Editor initial={newsletter} />,
};

export const MjmlOutput: Story = {
  name: 'MJML output',
  render: () => {
    function WithOutput() {
      const [tree, setTree] = useState(newsletter);
      const mjml = useMemo(() => renderEmailMjml(tree), [tree]);
      return (
        <div className="space-y-4 p-4">
          <EmailEditor value={tree} onChange={setTree} />
          <pre
            className="border-border bg-muted max-h-96 overflow-auto rounded-md border p-3 text-xs"
            role="region"
            aria-label="MJML"
            // tabIndex makes this scrollable region keyboard-accessible (axe: scrollable-region-focusable)
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
          >
            {mjml}
          </pre>
        </div>
      );
    }
    return <WithOutput />;
  },
};
