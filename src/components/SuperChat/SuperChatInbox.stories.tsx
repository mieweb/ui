import * as React from 'react';
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
import type { SuperChatConversation } from './index';
import { richConversation, secondConversation, registry } from './storyData';
import 'katex/dist/katex.min.css';
import { Button } from '../Button';

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
    conversations: {
      control: false,
      description:
        'Host-owned catalog records. preview does not require loaded thread messages.',
      table: { category: 'Data' },
    },
    activeConversationId: {
      control: false,
      description: 'Controlled stable id; null explicitly selects nothing.',
      table: { category: 'Data' },
    },
    selectionFallback: {
      control: 'select',
      options: ['first', 'none'],
      description:
        'Default first preserves existing behavior. Use none when a missing host selection must not open another conversation.',
      table: { category: 'Data' },
    },
    mobileView: {
      control: 'select',
      options: ['list', 'chat'],
      description:
        'Controlled narrow-screen pane; desktop continues to show both panes.',
      table: { category: 'Data' },
    },
    defaultMobileView: {
      control: 'select',
      options: ['list', 'chat'],
      description: 'Initial narrow-screen pane for uncontrolled navigation.',
      table: { category: 'Data' },
    },
    onMobileViewChange: {
      control: false,
      description:
        'Reports list/chat navigation so the host can update its route or state.',
      table: { category: 'Callbacks' },
    },
    loading: {
      control: 'boolean',
      description: 'The catalog request is pending.',
      table: { category: 'Data' },
    },
    error: {
      control: false,
      description:
        'Host-rendered catalog error. It is not an empty successful result.',
      table: { category: 'Data' },
    },
    conversationLoading: {
      control: 'boolean',
      description: 'The selected conversation history is pending.',
      table: { category: 'Data' },
    },
    conversationError: {
      control: false,
      description: 'Host-rendered selected-history error.',
      table: { category: 'Data' },
    },
    renderEmpty: {
      control: false,
      description: 'Successful empty catalog content.',
      table: { category: 'Slots' },
    },
    renderNoSelection: {
      control: false,
      description: 'Content when no available conversation is selected.',
      table: { category: 'Slots' },
    },
    renderConversationEmpty: {
      control: false,
      description: 'Successful empty selected history content.',
      table: { category: 'Slots' },
    },
    renderComposer: {
      control: false,
      description:
        'Replace the composer with host-controlled drafts; receives conversation, currentParticipantId and readOnly.',
      table: { category: 'Slots' },
    },
    renderStatus: {
      control: false,
      description:
        'Render host status beside the thread/composer using the same conversation context.',
      table: { category: 'Slots' },
    },
    labels: {
      control: false,
      description: 'Override accessible names and visible SuperChat text.',
      table: { category: 'Rendering' },
    },
    locale: {
      control: 'text',
      description: 'Locale for supplied message timestamps.',
      table: { category: 'Rendering' },
    },
    composerLabels: {
      control: false,
      description: 'Translated labels forwarded to the default ChatComposer.',
      table: { category: 'Rendering' },
    },
    sortMessagesBy: {
      control: 'select',
      options: ['time', 'provided'],
      description:
        'Sort timestamped records, or preserve host-provided message order without inventing dates.',
      table: { category: 'Data' },
    },
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

**A host-owned conversation catalog beside the selected SuperChat panel.** \`SuperChatInbox\` composes \`SuperChatConversations\` and \`SuperChat\`, including narrow-screen list/detail navigation. The application supplies stable conversation and participant IDs, summaries, messages and request state; the library performs no fetching, authentication, routing or persistence.

### Use it when

- A catalog arrives before its histories, and opening one row loads only that conversation's messages.
- A route or external store owns selection, mobile navigation and a separate draft for each conversation.
- Multiple humans or agents share Markdown conversations and you want the existing SuperChat rendering and accessibility surfaces.

### Don't use it when

- Only one conversation is ever shown: use \`SuperChat\`, or \`AIChat\` for a single user/assistant exchange.
- Your layout needs a drawer, three columns or multiple panels: compose \`SuperChatConversations\` with \`SuperChat\` directly.
- You need delivery receipts or typing indicators from a messaging service: compose the Messaging primitives and supply that service's state.

### Example

The **Host Controlled** story keeps catalog summaries separate from histories, loads explicit example records after selection, and keys drafts by stable conversation ID. Its \`renderComposer\` and \`renderStatus\` slots own draft and submission state; no preview is turned into an invented message.

\`\`\`tsx
<SuperChatInbox
  conversations={catalogWithLoadedThreads}
  activeConversationId={selectedId} // null explicitly selects nothing
  selectionFallback="none"
  mobileView={mobileView}
  onMobileViewChange={setMobileView}
  onConversationOpened={(conversation) => selectAndLoad(conversation.id)}
  loading={catalogLoading}
  error={catalogError}
  conversationLoading={historyLoading}
  conversationError={historyError}
  currentParticipantId={me.id}
  sortMessagesBy="provided"
  renderComposer={({ conversation, readOnly }) => (
    <HostComposer
      value={drafts[conversation.id] ?? ''}
      disabled={readOnly}
      onChange={(value) => updateDraft(conversation.id, value)}
      onSend={() => sendDraft(conversation.id)}
    />
  )}
  renderStatus={({ conversation }) => <HostStatus id={conversation.id} />}
/>
\`\`\`

### Limitations

- Selection remains backward compatible: an absent or missing ID falls back to the first conversation by default. Set \`selectionFallback="none"\` to avoid opening an unrelated row while a controlled ID is unavailable; \`null\` always means no selection. Default props only initialize uncontrolled state.
- Catalog loading/error preserves existing rows; selected-history loading/error suppresses the composer. \`renderEmpty\`, \`renderNoSelection\` and \`renderConversationEmpty\` distinguish three successful empty states. Errors are host-provided React nodes, so the host supplies appropriate recovery actions.
- Custom composers replace default sending behavior: the host owns draft isolation, validation, pending/error handling and persistence. \`renderComposer\` and \`renderStatus\` receive \`{ conversation, currentParticipantId, readOnly }\`.
- Supply a bounded height. Below \`sm\`, row selection opens the panel and Back returns to the list without clearing selection or host drafts. Both panes are visible at desktop widths. Hidden panes leave the tab order; mobile navigation moves focus to the panel or selected row. Conversation buttons use Tab/Enter/Space, not an arrow-key listbox model.
- \`labels\` localizes SuperChat text and accessible names, \`composerLabels\` configures the default composer, and \`locale\` formats real timestamps. Missing timestamps remain absent; \`sortMessagesBy="provided"\` keeps source order. Set \`dir\` on the host for RTL. Theme colors follow the active brand and dark mode.
- Rich plugins remain opt-in. The host owns sanitization for custom renderers and any application-specific attachment transport.`,
      },
    },
    catalog: {
      collection: true,
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
  // Page-level inbox: fill the canvas height (#504). SourcesAndGuards below is
  // a scrolling reference page, so the decorator is per-story, not meta-level.
  decorators: [fullHeightChat],
  parameters: { githubSourceFooter: false },
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

// This fixture belongs to the host example, not to the library's data layer.
// Catalog previews never masquerade as messages in an unloaded thread.
const hostCatalog: SuperChatConversation[] = [
  {
    id: 'release-planning',
    title: 'Release planning',
    preview: 'Confirm the accessibility review before the release.',
    lastActivity: '2026-06-08T14:00:00Z',
    participants: [
      { id: 'me', kind: 'human', name: 'You' },
      { id: 'alex', kind: 'human', name: 'Alex' },
    ],
    thread: [],
  },
  {
    id: 'design-review',
    title: 'Design review',
    preview: 'The narrow-screen layout is ready for review.',
    lastActivity: '2026-06-08T13:00:00Z',
    participants: [
      { id: 'me', kind: 'human', name: 'You' },
      { id: 'sam', kind: 'human', name: 'Sam' },
    ],
    thread: [],
  },
];
const hostHistory: Record<string, SuperChatConversation['thread']> = {
  'release-planning': [
    {
      id: 'planning-note',
      participantId: 'alex',
      text: 'The accessibility review is the last release check.',
      // The source did not provide a timestamp. Do not invent one.
    },
    {
      id: 'planning-reply',
      participantId: 'me',
      text: 'I will check keyboard navigation and the mobile layout.',
      time: '2026-06-08T14:00:00Z',
    },
  ],
  'design-review': [
    {
      id: 'design-note',
      participantId: 'sam',
      text: 'Please review the compact conversation list.',
    },
  ],
};

function HostControlledInbox({ rtl = false }: { rtl?: boolean }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<'list' | 'chat'>('list');
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [history, setHistory] = React.useState<typeof hostHistory>({});
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [failHistory, setFailHistory] = React.useState(false);
  const [request, setRequest] = React.useState(0);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeId) return;
    setLoadingId(activeId);
    setError(null);
    // A deterministic story fixture stands in for a host-owned request.
    // Cleanup prevents a slow previous selection from replacing the current one.
    const timer = window.setTimeout(() => {
      if (failHistory) {
        setError(
          rtl
            ? 'تعذر تحميل السجل. أعد المحاولة.'
            : 'History is unavailable. Retry the request.'
        );
      } else {
        setHistory((previous) => ({
          ...previous,
          [activeId]: hostHistory[activeId] ?? [],
        }));
      }
      setLoadingId(null);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activeId, failHistory, request, rtl]);
  const conversations = hostCatalog.map((conversation, index) => ({
    ...conversation,
    title: rtl
      ? ['تخطيط الإصدار', 'مراجعة التصميم'][index]
      : conversation.title,
    preview: rtl
      ? [
          'أكد مراجعة إمكانية الوصول قبل الإصدار.',
          'التخطيط للشاشات الصغيرة جاهز للمراجعة.',
        ][index]
      : conversation.preview,
    thread: history[conversation.id] ?? [],
  }));
  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="flex min-h-0 w-full flex-1 flex-col"
    >
      <div className="border-border bg-background flex flex-wrap items-center gap-3 border-b p-3 text-sm">
        <p className="text-muted-foreground">
          {rtl
            ? 'مثال: يتحكم التطبيق في الاختيار والمسودات وتحميل السجل.'
            : 'Example: the host owns selection, drafts and history requests.'}
        </p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={failHistory}
            onChange={(event) => setFailHistory(event.target.checked)}
          />
          {rtl ? 'محاكاة تعذر تحميل السجل' : 'Simulate history failure'}
        </label>
        {activeId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRequest((value) => value + 1)}
          >
            {rtl ? 'إعادة تحميل السجل' : 'Reload history'}
          </Button>
        )}
      </div>
      <SuperChatInbox
        className="min-h-0 flex-1"
        conversations={conversations}
        activeConversationId={activeId}
        selectionFallback="none"
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        onConversationOpened={(conversation) => {
          setActiveId(conversation.id);
          setSubmitted(null);
        }}
        currentParticipantId="me"
        sortMessagesBy="provided"
        locale={rtl ? 'ar' : 'en'}
        labels={
          rtl
            ? {
                chat: 'الدردشة',
                chatTitle: (title) => `محادثة: ${title}`,
                conversations: 'المحادثات',
                noConversationSelected: 'اختر محادثة لعرض سجلها.',
                backToConversations: 'العودة إلى المحادثات',
                participants: 'المشاركون',
                messages: 'الرسائل',
                loadingMessages: 'جارٍ تحميل الرسائل…',
                messageActions: 'إجراءات الرسالة',
                copyMessage: 'نسخ الرسالة',
              }
            : undefined
        }
        conversationLoading={loadingId === activeId && activeId !== null}
        conversationError={error}
        renderNoSelection={() => (
          <p className="text-muted-foreground p-6">
            {rtl
              ? 'اختر محادثة لعرض سجلها.'
              : 'Choose a conversation to load its history.'}
          </p>
        )}
        renderConversationEmpty={() => (
          <p className="text-muted-foreground p-6">
            {rtl
              ? 'لا توجد رسائل محفوظة.'
              : 'No saved messages in this conversation.'}
          </p>
        )}
        renderStatus={({ conversation }) => (
          <p role="status" className="text-muted-foreground px-4 py-2 text-sm">
            {submitted === conversation.id
              ? rtl
                ? 'تم تسليم مسودة المثال إلى التطبيق؛ لم يتم إنشاء رسالة خادم.'
                : 'Example draft handed to the host; no server message was fabricated.'
              : rtl
                ? 'مسودة محلية خاصة بهذه المحادثة.'
                : 'Local draft belongs to this conversation.'}
          </p>
        )}
        renderComposer={({ conversation, readOnly }) => (
          <form
            className="border-border bg-background grid gap-2 border-t p-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(conversation.id);
            }}
          >
            <label
              htmlFor={`host-draft-${conversation.id}`}
              className="text-sm font-medium"
            >
              {rtl
                ? `مسودة: ${conversation.title}`
                : `Draft for ${conversation.title}`}
            </label>
            <textarea
              id={`host-draft-${conversation.id}`}
              className="border-border bg-background text-foreground focus-visible:ring-ring min-h-20 w-full rounded-md border p-2 focus-visible:ring-2"
              value={drafts[conversation.id] ?? ''}
              disabled={readOnly || loadingId !== null || error !== null}
              onChange={(event) =>
                setDrafts((previous) => ({
                  ...previous,
                  [conversation.id]: event.target.value,
                }))
              }
            />
            <Button
              type="submit"
              className="justify-self-start"
              disabled={
                readOnly ||
                loadingId !== null ||
                error !== null ||
                !drafts[conversation.id]?.trim()
              }
            >
              {rtl ? 'إرسال مسودة المثال' : 'Submit example draft'}
            </Button>
          </form>
        )}
      />
    </div>
  );
}

export const HostControlled: Story = {
  decorators: [fullHeightChat],
  parameters: {
    githubSourceFooter: false,
    docs: {
      description: {
        story:
          'A generic host-controlled inbox: catalog summaries have empty threads until the host resolves a history request; missing message timestamps remain absent. Stable conversation IDs key selection and drafts. The composer and status slots contain host state. The simulated history failure is explicit and never replaces a missing history with preview text or an invented server message.',
      },
    },
  },
  render: () => <HostControlledInbox />,
};

export const Mobile: Story = {
  ...HostControlled,
  parameters: {
    ...HostControlled.parameters,
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const RTL: Story = {
  decorators: [fullHeightChat],
  parameters: { githubSourceFooter: false },
  globals: { direction: 'rtl', locale: 'ar' },
  render: () => <HostControlledInbox rtl />,
};

export const Empty: Story = {
  decorators: [fullHeightChat],
  args: {
    conversations: [],
    renderEmpty: () => (
      <p className="p-6">No conversations have been created.</p>
    ),
  },
};
export const Loading: Story = {
  decorators: [fullHeightChat],
  args: { conversations: [], loading: true },
};
export const Error: Story = {
  decorators: [fullHeightChat],
  args: {
    conversations: [],
    error: <p>The conversation catalog is unavailable. Reconnect and retry.</p>,
  },
};
export const NoSelection: Story = {
  decorators: [fullHeightChat],
  args: {
    conversations: hostCatalog,
    activeConversationId: null,
    renderNoSelection: () => (
      <p className="p-6">Choose a conversation to load its history.</p>
    ),
  },
};
export const MissingSelection: Story = {
  decorators: [fullHeightChat],
  args: {
    ...NoSelection.args,
    activeConversationId: 'unavailable-conversation',
    selectionFallback: 'none',
  },
};
export const ConversationLoading: Story = {
  decorators: [fullHeightChat],
  args: {
    conversations: hostCatalog,
    activeConversationId: 'release-planning',
    conversationLoading: true,
  },
};
export const ConversationError: Story = {
  decorators: [fullHeightChat],
  args: {
    conversations: hostCatalog,
    activeConversationId: 'release-planning',
    conversationError: <p>History is unavailable. Retry the request.</p>,
  },
};
