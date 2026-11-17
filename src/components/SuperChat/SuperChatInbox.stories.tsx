import * as React from 'react';
import { DateTime } from 'luxon';
import {
  Link as LinkIcon,
  Pencil as PencilIcon,
  Trash2 as TrashIcon,
} from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChatInbox, createMarkdownRenderer } from './index';
import { fullHeightChat } from '../../../.storybook/full-height';
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
import type { MCPToolCall, SuperChatConversation } from './index';
import {
  richConversation,
  secondConversation,
  registry,
  arabicConversations,
  arabicLabels,
} from './storyData';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { ChatComposer } from '../ChatComposer';
import { getSampleVideo } from '../AudioPlayer/sampleVideo';
import { createMediaConversations } from './mediaStoryData';
import type { SuperChatMediaAttachment, SuperChatView } from './types';
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
    view: {
      control: 'inline-radio',
      options: ['thread', 'media'],
      description:
        'Controlled conversation view. Omit to let attachment playback open the media feed and Back return to the thread.',
      table: { category: 'Behavior' },
    },
    onViewChange: {
      control: false,
      description: 'Reports a requested thread/media view switch.',
      table: { category: 'Callbacks' },
    },
    defaultView: {
      control: 'select',
      options: ['thread', 'media'],
      description: 'Initial view when selection is uncontrolled.',
      table: { category: 'Behavior' },
    },
    mediaLabels: {
      control: false,
      description:
        'Localized return control, attachment actions and unknown author labels.',
      table: { category: 'Rendering' },
    },
    mediaFeedProps: {
      control: false,
      description:
        'Optional media feed labels, actions and playback configuration for the active conversation.',
      table: { category: 'Slots' },
    },
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
    resizableSidebar: {
      control: 'boolean',
      description:
        'Drag the divider (or focus it and use the arrow keys) to resize the list; double-click restores the default width.',
      table: { category: 'Behavior' },
    },
    defaultSidebarWidth: {
      control: { type: 'number', min: 200, max: 480, step: 8 },
      description:
        'Starting list width in px, and the width a double-click restores.',
      table: { category: 'Behavior' },
    },
    sidebarWidth: { control: false, table: { category: 'Behavior' } },
    onSidebarWidthChange: { control: false, table: { category: 'Callbacks' } },
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
    listFooter: { control: false, table: { category: 'Behavior' } },
    className: { control: false },
    onMessageSent: { control: false, table: { category: 'Callbacks' } },
    composerProps: { control: false, table: { category: 'Composer' } },
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

Messages can also carry explicit \`media: SuperChatMediaAttachment[]\` records (stable attachment ID, kind and source, with optional title/caption/poster). The thread opens by default. Press **Play** on an attachment to open that clip in the media feed; **Back to conversation** returns to the same reading position and draft. There is no header view toggle. \`view\` / \`onViewChange\` let the host control this navigation, and \`defaultView\` supplies the initial choice. The media view composes [MediaFeed](?path=/docs/media-mediafeed--docs), derives items through \`getConversationMediaItems\`, and retains the conversation header and composer. Both views address the same messages and participants. \`mediaFeedProps\` supplies feed playback configuration, labels, custom media and action slots; \`mediaLabels\` localizes the return control and attachment actions. Attachment upload and persistence still belong to the host. Open the **Media Conversation** story for a local video/image example.

### Use it when

- You want a **finished inbox** for conversations that mix humans and AI agents — care-team threads with a triage agent, an admin console watching several agents — and are happy with list-left / panel-right.
- You are migrating from \`mieweb/chat-component\` and want the closest API.
- Messages are Markdown and may need code / math / Mermaid / GenUI / NITRO-table plugins; you install only the peers for the plugins you pass.
- A conversation includes explicit media attachments and people want to browse them one at a time while keeping the same conversation and composer.

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
- Needs a bounded height (\`h-full\` root) and a flex-capable parent. The sidebar is \`w-64\` on \`sm\`+ and full-width below. RTL: the list divider (\`border-e\`) and message accents (\`borderInlineStart\`) are logical and flip with \`dir\`.
- i18n: "Conversations", "New conversation", "No conversation selected", "Chat: …" and the panel's strings are English. Peers: \`react-markdown\`, \`remark-gfm\`, \`rehype-sanitize\` (core) plus per-plugin optional peers; import from \`@mieweb/ui/components/SuperChat\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/components/SuperChat',
      peers: ['react-markdown', 'remark-gfm', 'rehype-sanitize'],
      relationships: [
        {
          type: 'composes with',
          target: 'media-mediafeed',
          why: 'The media view maps the active conversation’s explicit message attachments into MediaFeed, retaining participant identity, header and composer.',
        },
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
    resizableSidebar: true,
    readOnly: false,
    trustedContent: false,
    defaultActiveConversationId: 'c1',
  },
  // Page-level inbox: fill the canvas height (#504). SourcesAndGuards below is
  // a scrolling reference page, so the decorator is per-story, not meta-level.
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    mobilePreview: { mode: 'standalone' },
  },
  render: (args) => (
    <InteractiveInbox
      {...args}
      className="w-full"
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

// Host-supplied message box: `composerProps` reaches the panel's ChatComposer,
// so an app can add its own labelled buttons beside `+` (here a video recorder
// and a ticket picker, as TimeHuddle's Huddle does), keep the input on its own
// row at every width, and word the placeholder for its own domain.
export const CustomComposer: Story = {
  args: {
    currentParticipantId: 'u1',
    showSidebar: true,
    defaultActiveConversationId: 'c1',
  },
  decorators: [fullHeightChat],
  parameters: { githubSourceFooter: false },
  render: (args) => (
    <InteractiveInbox
      {...args}
      className="w-full"
      initial={[richConversation, secondConversation]}
      composerProps={{
        layout: 'stacked',
        placeholder: 'Post an update to this thread…',
        mentionOptions: [],
        leadingSlot: (
          <>
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-600 dark:text-neutral-300"
              onClick={() => console.log('record video')}
            >
              Video
            </button>
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-600 dark:text-neutral-300"
              onClick={() => console.log('pick ticket')}
            >
              Ticket
            </button>
          </>
        ),
      }}
    />
  ),
};

// App-owned message box: `composer` replaces the panel's ChatComposer, so the
// host keeps its own draft, mention source and send path. The host appends
// the sent message itself; SuperChat still anchors the turn because the new
// message comes from `currentParticipantId`.
function HostComposerInbox() {
  const [conversations, setConversations] = React.useState<
    SuperChatConversation[]
  >([richConversation, secondConversation]);
  const [activeId, setActiveId] = React.useState(richConversation.id);
  const [draft, setDraft] = React.useState('');

  return (
    <SuperChatInbox
      className="w-full"
      conversations={conversations}
      activeConversationId={activeId}
      onConversationOpened={(c) => setActiveId(c.id)}
      currentParticipantId="u1"
      composer={
        <ChatComposer
          value={draft}
          onValueChange={setDraft}
          inputLabel="Message"
          placeholder="Write with the app's own composer…"
          onSend={(message) => {
            const now = new Date().toISOString();
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      lastActivity: now,
                      thread: [
                        ...c.thread,
                        {
                          id: `m-${Date.now()}`,
                          participantId: 'u1',
                          text: message.content,
                          time: now,
                        },
                      ],
                    }
                  : c
              )
            );
          }}
        />
      }
    />
  );
}

export const HostComposer: Story = {
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          'Pass your own composer through `composer` to replace the built-in message box. The host owns the draft and the send path and appends the sent message to the conversation.',
      },
    },
  },
  render: () => <HostComposerInbox />,
};

// Tool approval + reasoning: `toolCallGroup` groups the agent's consecutive
// tool calls with Allow once / Always allow / Deny wired to host state, and
// `thinking` blocks render as the collapsible reasoning pill. "Run again"
// replays the turn: the reasoning streams, then the calls wait for approval.
const toolTurnParticipants: SuperChatConversation['participants'] = [
  { id: 'u1', kind: 'human', name: 'Dr. Patel', role: 'Physician' },
  {
    id: 'ozwell',
    kind: 'agent',
    name: 'Ozwell',
    role: 'Assistant',
    color: '#7c3aed',
  },
];

const initialToolCalls = (): MCPToolCall[] => [
  {
    id: 'call-labs',
    toolName: 'get_lab_results',
    displayName: 'Look up lab results',
    serverName: 'EHR',
    parameters: [{ name: 'patient', type: 'string', value: 'Jordan Lee' }],
    status: 'awaiting-approval',
    startedAt: new Date().toISOString(),
  },
  {
    id: 'call-meds',
    toolName: 'get_medications',
    displayName: 'List active medications',
    serverName: 'EHR',
    parameters: [{ name: 'patient', type: 'string', value: 'Jordan Lee' }],
    status: 'awaiting-approval',
    startedAt: new Date().toISOString(),
  },
];

function ToolApprovalInbox() {
  const [phase, setPhase] = React.useState<'thinking' | 'tools'>('thinking');
  const [calls, setCalls] = React.useState(initialToolCalls);
  const [run, setRun] = React.useState(0);

  React.useEffect(() => {
    setPhase('thinking');
    setCalls(initialToolCalls());
    const timer = window.setTimeout(() => setPhase('tools'), 1800);
    return () => window.clearTimeout(timer);
  }, [run]);

  const settle = (id: string, status: MCPToolCall['status']) =>
    setCalls((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              duration: 600,
              ...(status === 'success'
                ? {
                    result: {
                      type: 'text' as const,
                      data: 'OK',
                      summary: 'Read from the chart',
                    },
                  }
                : {}),
            }
          : c
      )
    );

  const settled = calls.every((c) => c.status !== 'awaiting-approval');
  const conversation: SuperChatConversation = {
    id: 'tool-turn',
    title: 'Jordan Lee — pre-visit review',
    participants: toolTurnParticipants,
    thread: [
      {
        id: 'q',
        participantId: 'u1',
        text: 'Summarize Jordan’s recent labs and current medications.',
        time: '2026-06-07T09:00:00Z',
      },
      {
        id: `a-${run}`,
        participantId: 'ozwell',
        time: '2026-06-07T09:00:05Z',
        status: settled ? 'complete' : 'streaming',
        content: [
          {
            type: 'thinking',
            text: 'I need the latest lab panel and the active medication list before summarizing. Both live in the EHR, so I will request read access for each.',
          },
          ...(phase === 'tools'
            ? calls.map((toolCall) => ({
                type: 'tool_use' as const,
                toolCall,
              }))
            : []),
          ...(settled
            ? [
                {
                  type: 'text' as const,
                  text: calls.some((c) => c.status === 'success')
                    ? 'Labs are within range; A1c is 6.1%. Active medications: metformin 500 mg BID and lisinopril 10 mg daily.'
                    : 'I could not read the chart without approval.',
                },
              ]
            : []),
        ],
      },
    ],
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <ButtonGroup>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRun((n) => n + 1)}
        >
          Run again
        </Button>
      </ButtonGroup>
      <SuperChatInbox
        className="min-h-0 w-full flex-1"
        conversations={[conversation]}
        currentParticipantId="u1"
        toolCallGroup={{
          onApprove: (call) => settle(call.id, 'success'),
          onDeny: (call) => settle(call.id, 'denied'),
        }}
      />
    </div>
  );
}

export const ToolApprovalAndThinking: Story = {
  name: 'Tool approval & thinking',
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          'Pass `toolCallGroup` to group an agent’s consecutive tool calls into one block with Allow once, Always allow and Deny wired to your callbacks (the same options `AIChat` takes). The group collapses to "Used N tools" once every call settles. `thinking` content blocks render as a collapsible reasoning pill that stays open while the model thinks and folds once the answer arrives.',
      },
    },
  },
  render: () => <ToolApprovalInbox />,
};

// Per-message host controls: `renderMessageFooter` renders under every
// message, from people and agents. Here agents get a model badge and
// thumbs feedback held in host state; the local user's messages get a
// version switcher. Copy/Edit stay in the gutter as usual.
function MessageFooterInbox() {
  const [feedback, setFeedback] = React.useState<Record<string, 'up' | 'down'>>(
    {}
  );
  const [versions, setVersions] = React.useState<Record<string, number>>({});

  const rate = (id: string, value: 'up' | 'down') =>
    setFeedback((prev) => {
      const next = { ...prev };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      return next;
    });

  const footerButton =
    'rounded px-1.5 py-0.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 aria-pressed:text-primary-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:aria-pressed:text-primary-300';

  return (
    <SuperChatInbox
      className="w-full"
      conversations={[richConversation, secondConversation]}
      defaultActiveConversationId={richConversation.id}
      currentParticipantId="u1"
      onMessageEdited={() => {}}
      renderMessageFooter={(message, { participant, isSelf, streaming }) => {
        if (streaming) return null;
        if (isSelf) {
          const version = versions[message.id] ?? 2;
          return (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <button
                type="button"
                className={footerButton}
                aria-label="Previous version"
                disabled={version === 1}
                onClick={() =>
                  setVersions((prev) => ({ ...prev, [message.id]: 1 }))
                }
              >
                ‹
              </button>
              <span>{version} / 2</span>
              <button
                type="button"
                className={footerButton}
                aria-label="Next version"
                disabled={version === 2}
                onClick={() =>
                  setVersions((prev) => ({ ...prev, [message.id]: 2 }))
                }
              >
                ›
              </button>
            </div>
          );
        }
        if (participant?.kind !== 'agent') return null;
        return (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" size="sm">
              gpt-4o
            </Badge>
            <button
              type="button"
              className={footerButton}
              aria-label="Good response"
              aria-pressed={feedback[message.id] === 'up'}
              onClick={() => rate(message.id, 'up')}
            >
              👍
            </button>
            <button
              type="button"
              className={footerButton}
              aria-label="Bad response"
              aria-pressed={feedback[message.id] === 'down'}
              onClick={() => rate(message.id, 'down')}
            >
              👎
            </button>
          </div>
        );
      }}
    />
  );
}

export const MessageFooter: Story = {
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          '`renderMessageFooter(message, { conversation, participant, isSelf, streaming })` renders your own controls under each message — the counterpart of `AIChat`’s `renderMessageFooter`. Use it for feedback, version arrows, model badges or "Continue". The built-in Copy/Edit actions are unchanged, and a fresh inline renderer refreshes footers without re-rendering the message bodies.',
      },
    },
  },
  render: () => <MessageFooterInbox />,
};

// Conversation actions in the panel header via `headerActions`, plus panel
// props the inbox now forwards (placeholder, agent selector, streaming stop).
function HeaderActionsInbox() {
  const [conversations, setConversations] = React.useState<
    SuperChatConversation[]
  >([richConversation, secondConversation]);
  const [activeId, setActiveId] = React.useState(richConversation.id);
  const [agent, setAgent] = React.useState<string | null>('a1');
  const [streaming, setStreaming] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const active = conversations.find((c) => c.id === activeId);

  const rename = () => {
    const title = window.prompt('Rename conversation', active?.title);
    if (!title) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, title } : c))
    );
  };

  const iconButton =
    'rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800';

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <p role="status" className="min-h-5 text-xs text-neutral-500">
        {notice}
      </p>
      <SuperChatInbox
        className="min-h-0 w-full flex-1"
        conversations={conversations}
        activeConversationId={activeId}
        onConversationOpened={(c) => setActiveId(c.id)}
        currentParticipantId="u1"
        headerActions={
          <>
            <button
              type="button"
              className={iconButton}
              aria-label="Rename conversation"
              onClick={rename}
            >
              <PencilIcon size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label="Copy link"
              onClick={() => setNotice(`Copied a link to “${active?.title}”`)}
            >
              <LinkIcon size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label="Delete conversation"
              onClick={() => setNotice(`Deleted “${active?.title}” (demo)`)}
            >
              <TrashIcon size={16} aria-hidden="true" />
            </button>
          </>
        }
        placeholder="Message the care team…"
        agents={[
          { id: 'a1', label: 'Triage Agent' },
          { id: 'a2', label: 'Coding Agent' },
        ]}
        selectedAgent={agent}
        onAgentChange={setAgent}
        isStreaming={streaming}
        onStop={() => setStreaming(false)}
        onMessageSent={() => setStreaming(true)}
        onConversationClosed={() => setNotice('Closed (demo)')}
      />
    </div>
  );
}

export const HeaderActions: Story = {
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          '`headerActions` puts your conversation actions (rename, copy link, delete…) at the end of the panel header, before Close; on small screens they share the header with Back. The inbox also forwards the panel’s composer shorthands — here `placeholder`, the agent selector and `isStreaming`/`onStop` (send a message to see Stop).',
      },
    },
  },
  render: () => <HeaderActionsInbox />,
};

// A controlled `activeConversationId` the host hasn't loaded yet (e.g. a deep
// link to an older conversation) shows the empty panel — never another
// conversation's thread — until it arrives.
function DeepLinkInbox() {
  const deepLinked: SuperChatConversation = {
    ...secondConversation,
    id: 'deep-linked',
    title: 'Archived: lab follow-up',
  };
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className="flex h-full w-full flex-col gap-2">
      <ButtonGroup>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLoaded((v) => !v)}
        >
          {loaded ? 'Unload the deep-linked conversation' : 'Load it'}
        </Button>
      </ButtonGroup>
      <SuperChatInbox
        className="min-h-0 w-full flex-1"
        conversations={
          loaded ? [richConversation, deepLinked] : [richConversation]
        }
        activeConversationId="deep-linked"
        currentParticipantId="u1"
      />
    </div>
  );
}

export const DeepLinkNotLoaded: Story = {
  name: 'Deep link not loaded',
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          'With a controlled `activeConversationId` that is not in `conversations`, the inbox shows the empty panel and highlights no row, instead of opening the first conversation. Load it and the panel opens it.',
      },
    },
  },
  render: () => <DeepLinkInbox />,
};

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

function MediaConversationDemo() {
  const [conversations, setConversations] = React.useState(() =>
    createMediaConversations('')
  );
  const [view, setView] = React.useState<SuperChatView>('thread');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [likedMessages, setLikedMessages] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    void getSampleVideo().then(
      (url) => {
        if (!mounted) return;
        setConversations((all) =>
          all.map((conversation) => ({
            ...conversation,
            thread: conversation.thread.map((message) => ({
              ...message,
              media: message.media?.map((attachment) =>
                attachment.kind === 'video' && !attachment.src
                  ? { ...attachment, src: url }
                  : attachment
              ),
            })),
          }))
        );
        setLoading(false);
      },
      () => {
        if (!mounted) return;
        setError('The browser could not generate the local sample video.');
        setLoading(false);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SuperChatInbox
      conversations={conversations}
      currentParticipantId="me"
      view={view}
      onViewChange={setView}
      onConversationOpened={() => setView('thread')}
      acceptedFileTypes={['image', 'video', 'audio']}
      onMessageSent={(text, { conversation, attachments }) => {
        // In an app, upload files here and persist the resulting source URLs.
        // This local demo persists data URLs directly in host-owned state.
        const media = attachments.flatMap<SuperChatMediaAttachment>(
          (attachment) => {
            const kind = attachment.type.startsWith('image/')
              ? 'image'
              : attachment.type.startsWith('video/')
                ? 'video'
                : attachment.type.startsWith('audio/')
                  ? 'audio'
                  : undefined;
            return kind
              ? [
                  {
                    id: attachment.id,
                    kind,
                    src: attachment.dataUrl,
                    title: attachment.name,
                    alt: attachment.name,
                  },
                ]
              : [];
          }
        );
        const message = {
          id: window.crypto.randomUUID(),
          participantId: 'me',
          time: DateTime.utc().toJSDate(),
          text,
          media,
        };
        setConversations((all) =>
          all.map((item) =>
            item.id === conversation.id
              ? {
                  ...item,
                  thread: [...item.thread, message],
                  lastActivity: message.time,
                }
              : item
          )
        );
      }}
      mediaFeedProps={{
        loading,
        error,
        renderActions: (item) => {
          const messageKey = JSON.stringify([
            item.conversationId,
            item.message.id,
          ]);
          const liked = likedMessages.includes(messageKey);
          return (
            <ButtonGroup>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={liked}
                onClick={() =>
                  setLikedMessages((all) =>
                    liked
                      ? all.filter((id) => id !== messageKey)
                      : [...all, messageKey]
                  )
                }
              >
                {liked ? 'Liked' : 'Like'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('thread')}
              >
                Reply
              </Button>
            </ButtonGroup>
          );
        },
      }}
    />
  );
}

export const MediaConversation: Story = {
  name: 'Media conversation',
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          'Start in the conversation and press Play on a video to open that clip in an Instagram-style MediaFeed. Back to conversation restores the thread, its reading position and the draft. Both views use the same explicit message.media attachments, participants and source message ids. Reactions apply to the original message, and the shared composer still sends through host-owned conversation state. Videos are generated locally; select Planning to see a conversation without media.',
      },
    },
  },
  render: () => <MediaConversationDemo />,
};

// Arabic, right to left: every label from `arabicLabels`, times in `ar`.
function ArabicInbox() {
  const [conversations, setConversations] =
    React.useState<SuperChatConversation[]>(arabicConversations);
  const [query, setQuery] = React.useState('');
  const visible = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div dir="rtl" lang="ar" className="flex h-full w-full">
      <SuperChatInbox
        className="w-full"
        conversations={visible}
        labels={arabicLabels}
        locale="ar"
        currentParticipantId="u1"
        resizableSidebar
        search={{ value: query, onChange: setQuery }}
        agents={[{ id: 'a1', label: 'وكيل الفرز' }]}
        onNewConversation={() => {}}
        onConversationClosed={() => {}}
        onMessageSent={(text, { conversation }) =>
          setConversations((all) =>
            all.map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    thread: [
                      ...c.thread,
                      {
                        id: `ar-${Date.now()}`,
                        participantId: 'u1',
                        text,
                        time: new Date().toISOString(),
                      },
                    ],
                  }
                : c
            )
          )
        }
        onMessageEdited={(messageId, text) =>
          setConversations((all) =>
            all.map((c) => ({
              ...c,
              thread: c.thread.map((m) =>
                m.id === messageId
                  ? { ...m, text, editedAt: new Date().toISOString() }
                  : m
              ),
            }))
          )
        }
      />
    </div>
  );
}

export const ArabicRTL: Story = {
  name: 'Arabic (RTL)',
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          'The inbox inside a `dir="rtl"` container with every `labels` key in Arabic and `locale="ar"`, so message, edited and scheduled times use Arabic formatting. The list sits on the right, messages align from the right, and the resize handle and keyboard arrows follow the reading direction. Open a message’s ⋯ menu to see the localized Copy as / Edit actions.',
      },
    },
  },
  render: () => <ArabicInbox />,
};
