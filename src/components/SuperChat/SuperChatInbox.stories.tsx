import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChatInbox, createMarkdownRenderer } from './index';
import {
  createCodePlugin,
  createMathPlugin,
  createGenUIPlugin,
  createMermaidPlugin,
  createImagePlugin,
  createNitroTablePlugin,
  createAttachmentPlugin,
  attachmentMarkdown,
  attachmentCache,
} from './plugins';
import type { SuperChatConversation } from './index';
import { richConversation, secondConversation, registry } from './storyData';
import 'katex/dist/katex.min.css';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChatInbox> = {
  id: 'superchat-inbox',
  title: 'Modules/SuperChat/Inbox',
  component: SuperChatInbox,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    readOnly: {
      control: 'boolean',
      description: 'Disable the composer.',
      table: { category: 'Behavior' },
    },
    showSidebar: {
      control: 'boolean',
      description: 'Show the conversation list.',
      table: { category: 'Behavior' },
    },
    trustedContent: {
      control: 'boolean',
      description: 'Skip sanitization — only for host-authored content.',
      table: { category: 'Behavior' },
    },
    currentParticipantId: {
      control: 'select',
      options: ['u1', 'u2', 'a1', 'a2'],
      description: 'The local user id (drives alignment + compose identity).',
      table: { category: 'Identity' },
    },
    defaultActiveConversationId: {
      control: 'select',
      options: ['c1', 'c2'],
      description: 'Uncontrolled initial active conversation id.',
      table: { category: 'Selection' },
    },
    // Complex/object + callback props are wired in code, not via controls.
    conversations: { control: false, table: { category: 'Data' } },
    activeConversationId: { control: false, table: { category: 'Selection' } },
    renderPlugins: { control: false, table: { category: 'Rendering' } },
    renderTextContent: { control: false, table: { category: 'Rendering' } },
    linkBuilder: { control: false, table: { category: 'Rendering' } },
    className: { control: false },
    onMessageSent: { control: false, table: { category: 'Callbacks' } },
    onConversationOpened: { control: false, table: { category: 'Callbacks' } },
    onConversationClosed: { control: false, table: { category: 'Callbacks' } },
    onNewConversation: { control: false, table: { category: 'Callbacks' } },
    onReferenceClick: { control: false, table: { category: 'Callbacks' } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The complete multi-participant inbox: \`SuperChatConversations\` on the left, the active \`SuperChat\` panel on the right, with selection and the small-screen master/detail switch handled for you.** \`SuperChatInbox\` takes the full \`conversations: SuperChatConversation[]\`, resolves the active one from \`activeConversationId\` (controlled) or \`defaultActiveConversationId\` (uncontrolled; first conversation by default), and forwards every panel prop — \`currentParticipantId\`, \`renderPlugins\`, \`renderTextContent\`, \`trustedContent\`, \`readOnly\`, \`acceptedFileTypes\`, \`order\`, \`virtualized\`, \`linkBuilder\`, \`onMessageSent\`, \`onMessageEdited\`, \`onConversationClosed\`, \`onReferenceClick\` — plus the list's \`onConversationOpened\` and \`onNewConversation\`. \`showSidebar={false}\` hides the list. Below the \`sm\` breakpoint only one pane is visible: opening a conversation shows the panel, whose Back button (\`onBack\`) returns to the list. Root is \`div role="group" aria-label="Chat: <title>"\` (\`data-slot="superchat-inbox"\`), rounded and bordered, filling its container's height. It is the drop-in for the standalone \`mieweb/chat-component\` (same conversation/thread/\`linkBuilder\`/callback shape; \`senderId\` → \`participantId\`).

### Use it when

- You want a **finished inbox** for conversations that mix humans and AI agents — care-team threads with a triage agent, an admin console watching several agents — and are happy with list-left / panel-right.
- You are migrating from \`mieweb/chat-component\` and want the closest API.
- Messages are Markdown and may need code / math / Mermaid / GenUI / NITRO-table plugins; you install only the peers for the plugins you pass.

### Don't use it when

- You need a different arrangement (list in a drawer, panel in a modal, two panels) — compose \`SuperChatConversations\` + \`SuperChat\` yourself.
- There is only ever one conversation on screen — \`SuperChat\` alone, or \`AIChat\` if it is one user and one assistant with plain text.
- Human-to-human messaging with delivery states, read receipts and typing indicators — Messaging's \`MessagingSplitView\` + \`MessageThread\`; SuperChat has none of those.

### Example

\`\`\`tsx
import { SuperChatInbox } from '@mieweb/ui/components/SuperChat';
import { createCodePlugin, createNitroTablePlugin } from '@mieweb/ui/components/SuperChat/plugins';

const plugins = useMemo(() => [createCodePlugin(), createNitroTablePlugin()], []);
const [conversations, setConversations] = useState<SuperChatConversation[]>([]);
useEffect(() => { api.listConversations().then(setConversations); }, []); // host transport + auth

<div style={{ height: 'calc(100vh - 120px)' }}>
  <SuperChatInbox
    conversations={conversations}
    currentParticipantId={me.id}
    renderPlugins={plugins}
    linkBuilder={(ref) => routes.record(ref)}
    onConversationOpened={(c) => setConversations((all) => all.map((x) => x.id === c.id ? { ...x, unread: 0 } : x))}
    onMessageSent={(text, { conversation, mentions, attachments }) => {
      const msg = { id: crypto.randomUUID(), participantId: me.id, text, time: new Date().toISOString() };
      setConversations((all) => all.map((x) => x.id === conversation.id
        ? { ...x, thread: [...x.thread, msg], lastActivity: msg.time } : x));
      void api.send(conversation.id, msg, attachments, mentions); // agents reply via your stream → append to thread
    }}
    onNewConversation={() => setConversations((all) => [newDraft(me), ...all])}
  />
</div>
\`\`\`

### Limitations

- **Accessibility as implemented:** the root \`role="group"\` is named after the active conversation; inner semantics come from the two children (\`aside\` "Conversations", \`section\` panel, \`role="log"\` thread, \`article\` messages). On small screens hidden panes are removed with \`hidden sm:flex\`, so they are not in the tab order; switching pane does **not** move focus to the newly shown pane. With no conversations it shows an unlabelled "No conversation selected" section.
- **Host owns everything mutable:** unread counts, appending sent messages, agent replies, edits (\`editedAt\`), and attachment upload (delivered as base64 \`dataUrl\`s). Nothing here talks to a network.
- **Selection fallback:** if the active id is missing from \`conversations\` the first conversation is shown; the list highlight always follows the panel.
- Needs a bounded height (\`h-full\` root) and a flex-capable parent. The sidebar is \`w-64\` on \`sm\`+ and full-width below. RTL: list border and message accents are physical (\`border-r\`, \`borderLeft\`).
- i18n: "Conversations", "New conversation", "No conversation selected", "Chat: …" and the panel's strings are English. Peers: \`react-markdown\`, \`remark-gfm\`, \`rehype-sanitize\` (core) plus per-plugin optional peers; import from \`@mieweb/ui/components/SuperChat\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/components/SuperChat',
      peers: ['react-markdown', 'remark-gfm', 'rehype-sanitize'],
      relationships: [
        {
          type: 'contains',
          target: 'superchat-superchat-panel',
          why: 'The inbox renders the active conversation with SuperChat and forwards every panel prop.',
        },
        {
          type: 'contains',
          target: 'superchat-conversations-list',
          why: 'The sidebar is SuperChatConversations, driven by the inbox’s resolved active id.',
        },
        {
          type: 'alternative to',
          target: 'chat-messaging',
          why: 'Messaging is a kit of human-to-human primitives you lay out yourself; SuperChatInbox is a finished multi-participant inbox with Markdown rendering.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SuperChatInbox>;

// ============================================================================
// Stateful demo wrapper
// ============================================================================
// SuperChatInbox is controlled (the host owns conversation state). This wrapper
// shows the expected host wiring: append the sent message to the active
// conversation's thread, and simulate a reply from any @-mentioned agent.

function InteractiveInbox(
  props: Omit<React.ComponentProps<typeof SuperChatInbox>, 'conversations'> & {
    initial: SuperChatConversation[];
  }
) {
  const { initial, ...rest } = props;
  const [conversations, setConversations] = React.useState(initial);

  const appendMessage = (
    conversationId: string,
    message: SuperChatConversation['thread'][number]
  ) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, thread: [...c.thread, message], lastActivity: message.time }
          : c
      )
    );
  };

  return (
    <SuperChatInbox
      {...rest}
      conversations={conversations}
      onMessageSent={(text, meta) => {
        const now = new Date().toISOString();
        const images = meta.attachments
          .filter((att) => att.type.startsWith('image/'))
          .map((att) => `![${att.name}](${att.dataUrl})`)
          .join('\n\n');
        const files = meta.attachments
          .filter((att) => !att.type.startsWith('image/'))
          .map((att) => {
            void attachmentCache.put({
              id: att.id,
              name: att.name,
              type: att.type,
              dataUrl: att.dataUrl,
            });
            return attachmentMarkdown({
              id: att.id,
              type: att.type,
              name: att.name,
              src: att.dataUrl,
            });
          })
          .join('\n\n');
        const body = [text, images, files].filter(Boolean).join('\n\n');
        appendMessage(meta.conversation.id, {
          id: `m-${Date.now()}`,
          participantId: props.currentParticipantId ?? 'u1',
          text: body,
          time: now,
        });
        // Simulate each mentioned agent replying shortly after.
        meta.conversation.participants
          .filter((p) => p.kind === 'agent' && meta.mentions.includes(p.id))
          .forEach((agent, i) => {
            window.setTimeout(
              () =>
                appendMessage(meta.conversation.id, {
                  id: `a-${Date.now()}-${agent.id}`,
                  participantId: agent.id,
                  text: `On it — responding to **${text.slice(0, 40)}**.`,
                  time: new Date().toISOString(),
                }),
              500 * (i + 1)
            );
          });
      }}
    />
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Playground: Story = {
  args: {
    currentParticipantId: 'u1',
    showSidebar: true,
    readOnly: false,
    trustedContent: false,
    defaultActiveConversationId: 'c1',
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)' }}>
      <InteractiveInbox
        {...args}
        initial={[richConversation, secondConversation]}
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
          createMermaidPlugin(),
          createImagePlugin(),
          createNitroTablePlugin(),
          createAttachmentPlugin(),
        ]}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

// ============================================================================
// Sources & Guards
// ============================================================================
// Documents, per visual, the exact Markdown *source* that produces it and the
// *guard* (trust boundary) that keeps untrusted model/agent output safe. The
// rendered column uses the real production renderer (`createMarkdownRenderer`)
// with every plugin enabled, so source → guard → output stays in sync with the
// code.

interface FeatureDemo {
  /** Plugin / feature name. */
  name: string;
  /** Raw Markdown exactly as it arrives in a message. */
  source: string;
  /** Where the guard lives + what it enforces. */
  guard: string;
}

const FEATURES: FeatureDemo[] = [
  {
    name: 'Markdown core (GFM)',
    source: [
      '**Chief complaint:** chest tightness on exertion',
      '',
      '- Duration: 3 days',
      '- Risk: family history of CAD',
      '',
      '> Recommend prioritizing an ECG.',
      '',
      '[ECG protocol](https://example.org/ecg)',
    ].join('\n'),
    guard:
      'rehype-sanitize allow-list (createMarkdownRenderer.tsx) strips scripts/unknown tags from untrusted output; links are forced to target="_blank" rel="noopener noreferrer".',
  },
  {
    name: 'code',
    source: [
      '```javascript',
      "const code = '93000';",
      'console.log(code);',
      '```',
    ].join('\n'),
    guard:
      'rehype-highlight emits .hljs-* token classes that the base schema explicitly allow-lists on code/pre/span; sanitize runs AFTER highlight so only those classes survive. Copy uses navigator.clipboard.',
  },
  {
    name: 'math (KaTeX)',
    source: [
      '$$ risk = \\beta_0 + \\beta_1 x + \\beta_2 x^2 $$',
      '',
      'Inline: $x > 0.7$.',
    ].join('\n'),
    guard:
      "math.tsx allow-lists KaTeX's HTML+MathML tags/attributes so its output survives sanitize; rehype-katex runs with throwOnError:false (malformed math degrades, never throws).",
  },
  {
    name: 'genui',
    source: [
      '```genui',
      '{ "widget": "kpi_card", "version": 1, "props": { "label": "Risk", "value": "High", "trend": "+12%" } }',
      '```',
    ].join('\n'),
    guard:
      'Widgets are host-registered, lazy, and schema-validated; the rehype transform allow-lists only the <genui-widget> tag. Unknown/invalid widgets degrade to an inert code block; mount + data fetch are gated on streaming.',
  },
  {
    name: 'mermaid',
    source: [
      '```mermaid',
      'graph TD',
      '  A[Intake] --> B{Chest pain?}',
      '  B -- Yes --> C[Order ECG]',
      '  B -- No --> D[Routine review]',
      '```',
    ].join('\n'),
    guard:
      "mermaid.tsx loads mermaid lazily and renders with securityLevel:'strict' (labels sanitized, scripts stripped). The SVG bypasses rehype-sanitize, so strict mode IS the trust boundary; rendering is gated on streaming.",
  },
  {
    name: 'image (lightbox)',
    source:
      '![12-lead ECG rhythm strip](https://placehold.co/640x320/png?text=ECG+rhythm+strip)',
    guard:
      'The image src/alt are already protocol-restricted by rehype-sanitize; image.tsx only adds the zoom affordance and portals the LightboxModal to document.body.',
  },
  {
    name: 'nitro-table',
    source: [
      '| Code | Description | Modifier |',
      '| --- | --- | --- |',
      '| 93000 | ECG, complete | — |',
      '| 93005 | ECG, tracing only | TC |',
    ].join('\n'),
    guard:
      'nitroTable.tsx lazy-loads the DataVis grid only when a table appears; a GridErrorBoundary degrades to the themed HTML table if datavis is unavailable or the grid throws.',
  },
];

const sourcesAndGuardsRenderer = createMarkdownRenderer({
  plugins: [
    createCodePlugin(),
    createMathPlugin(),
    createGenUIPlugin(registry),
    createMermaidPlugin(),
    createImagePlugin(),
    createNitroTablePlugin(),
    createAttachmentPlugin(),
  ],
});

function SourcesAndGuardsDemo() {
  return (
    <div className="space-y-6 p-6 text-neutral-900 dark:text-neutral-100">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">
          SuperChat — Sources &amp; Guards
        </h2>
        <p className="max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Each visual below is produced from the raw Markdown{' '}
          <strong>source</strong> and protected by the <strong>guard</strong>{' '}
          noted underneath. The rendered column uses the production
          <code> createMarkdownRenderer</code> with every plugin enabled.
        </p>
      </header>

      {FEATURES.map((f) => (
        <section
          key={f.name}
          className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
        >
          <h3 className="text-primary-800 dark:text-primary-300 mb-3 text-sm font-semibold tracking-wide">
            {f.name}
          </h3>

          <div className="mb-1 text-xs font-medium text-neutral-500 uppercase">
            Source
          </div>
          <pre className="mb-3 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs whitespace-pre-wrap text-neutral-100 **:wrap-break-word dark:bg-neutral-950">
            <code>{f.source}</code>
          </pre>

          <div className="mb-1 text-xs font-medium text-neutral-500 uppercase">
            Rendered
          </div>
          <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {sourcesAndGuardsRenderer(f.source, {
              messageId: `sg-${f.name}`,
              streaming: false,
              role: 'assistant',
            })}
          </div>

          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Guard:</strong> {f.guard}
          </p>
        </section>
      ))}
    </div>
  );
}

export const SourcesAndGuards: Story = {
  name: 'Sources & Guards',
  parameters: {
    docs: {
      description: {
        story:
          'Per-feature documentation of the Markdown **source** that generates each visual and the ' +
          '**guard** (trust boundary) that sanitizes untrusted model/agent output. Useful for ' +
          'security review: it shows exactly where each plugin opens the allow-list and how it ' +
          'degrades.',
      },
    },
  },
  render: () => <SourcesAndGuardsDemo />,
};
