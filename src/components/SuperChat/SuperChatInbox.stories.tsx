import * as React from 'react';
import { DateTime } from 'luxon';
import { Heart, Play, Reply } from 'lucide-react';
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
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { getSampleVideo } from '../AudioPlayer/sampleVideo';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { createMediaConversations } from './mediaStoryData';
import type {
  SuperChatMediaAttachment,
  SuperChatMessageMediaRenderProps,
  SuperChatRenderMessageMedia,
  SuperChatView,
} from './types';
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
        "Optional media feed labels, actions and playback configuration for the active conversation. `layout: 'overlay'` makes the media view mobile-first: full screen on a phone, upright or sideways. It needs `useKeyboardInset()` mounted in the app shell, so the panel fits above the phone's keyboard.",
      table: { category: 'Slots' },
    },
    renderMessageMedia: {
      control: false,
      description:
        "The host's card for an attachment in the thread, in place of the built-in one. Receives `{ message, attachment, open, launchId }`; put `launchId` on the card's control as `data-media-launch-id`.",
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

Messages can also carry explicit \`media: SuperChatMediaAttachment[]\` records (stable attachment ID, kind and source, with optional title/caption/poster). The thread opens by default. Press **Play** on an attachment to open that clip in the media feed; **Back to conversation** returns to the same reading position and draft. There is no header view toggle. \`view\` / \`onViewChange\` let the host control this navigation, and \`defaultView\` supplies the initial choice. The media view composes [MediaFeed](?path=/docs/media-mediafeed--docs), derives items through \`getConversationMediaItems\`, and keeps the conversation header and composer mounted (the header hides on a phone in the overlay layout). Both views address the same messages and participants. \`mediaFeedProps\` supplies feed playback configuration, labels, custom media and action slots; \`mediaLabels\` localizes the return control and attachment actions. Attachment upload and persistence still belong to the host. With \`mediaFeedProps.layout: 'overlay'\` the media view is mobile-first: each clip fills it edge to edge under touch-first controls, and on a phone, upright or sideways, it fills the screen above the message box, as a dialog (Escape goes back). Mount \`useKeyboardInset()\` once in the app shell for it: the panel sizes itself from the visible viewport that hook publishes, so the iOS keyboard doesn't cover the message box (with its \`native\` source, pad the composer by \`--mieweb-keyboard-inset\` as for any ChatComposer). \`renderMessageMedia\` lets the host draw its own card for an attachment in the thread. Open the **Media Conversation** stories for local examples.

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
- **Overlay media view** (\`mediaFeedProps.layout: 'overlay'\`): on a screen under 40rem wide, or under 30rem tall and sideways, the whole panel is \`position: fixed\` over the screen, inside the safe areas (\`--mieweb-safe-area-top/right/bottom/left\` override \`env()\` for native shells): the header hides, the media fills the space and the message box stays at the bottom. There it is a \`role="dialog"\` with \`aria-modal\`, labelled by the conversation title; Tab stays inside, and Escape goes back unless another dialog or menu is open. The media view is dark in every theme (\`data-theme="dark"\`), so host actions should use library components or theme tokens. Inside a transformed ancestor (a Motion sheet) \`fixed\` can't cover the screen; render SuperChat outside it. In both layouts, a clip floating in picture in picture keeps the media view mounted but hidden after Back, until its window closes.
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

/**
 * A thumbnail for a sample clip, in its shape, as a host's media service
 * would supply: the clip's colour with its title.
 */
function samplePoster(shape: 'landscape' | 'portrait', title: string) {
  const canvas = document.createElement('canvas');
  canvas.width = shape === 'portrait' ? 360 : 640;
  canvas.height = shape === 'portrait' ? 640 : 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  const fill = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  fill.addColorStop(0, '#1e3a5f');
  fill.addColorStop(1, '#0f766e');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '600 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, canvas.height - 48);
  return canvas.toDataURL('image/png');
}

function MediaConversationDemo({
  layout,
  renderMessageMedia,
  posters = false,
}: {
  /** MediaFeed layout for the media view; `overlay` opts into mobile-first. */
  layout?: 'stacked' | 'overlay';
  renderMessageMedia?: SuperChatRenderMessageMedia;
  /** Give each video a thumbnail, as a host's media service would. */
  posters?: boolean;
}) {
  const [conversations, setConversations] = React.useState(() =>
    createMediaConversations('')
  );
  const [view, setView] = React.useState<SuperChatView>('thread');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [likedMessages, setLikedMessages] = React.useState<string[]>([]);
  // The app shell's job: publish the visible viewport, which the phone
  // panel sizes itself from, so the keyboard doesn't cover the message box.
  useKeyboardInset({ enabled: layout === 'overlay' });

  React.useEffect(() => {
    let mounted = true;
    // The overlay stories make "A closer look" an upright phone recording,
    // to show each clip at its own shape.
    void Promise.all([
      getSampleVideo(),
      getSampleVideo(layout === 'overlay' ? 'portrait' : 'landscape'),
    ]).then(
      ([url, closeUp]) => {
        if (!mounted) return;
        setConversations((all) =>
          all.map((conversation) => ({
            ...conversation,
            thread: conversation.thread.map((message) => ({
              ...message,
              media: message.media?.map((attachment) =>
                attachment.kind === 'video' && !attachment.src
                  ? {
                      ...attachment,
                      src: attachment.id === 'detail' ? closeUp : url,
                      poster: posters
                        ? samplePoster(
                            attachment.id === 'detail' && layout === 'overlay'
                              ? 'portrait'
                              : 'landscape',
                            attachment.title ?? ''
                          )
                        : attachment.poster,
                    }
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
  }, [layout, posters]);

  return (
    <SuperChatInbox
      conversations={conversations}
      renderMessageMedia={renderMessageMedia}
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
        layout,
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
                leftIcon={<Heart className="size-4" aria-hidden="true" />}
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
                leftIcon={<Reply className="size-4" aria-hidden="true" />}
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

export const MediaConversationOverlay: Story = {
  name: 'Media conversation, overlay',
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          "The media view with `mediaFeedProps.layout: 'overlay'`: each clip edge to edge under touch-first controls, with Back over its top corner.",
      },
    },
  },
  render: () => <MediaConversationDemo layout="overlay" />,
};

export const MediaConversationPhonePortrait: Story = {
  name: 'Media conversation, phone portrait',
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          'On a phone held upright, the overlay media view fills the screen above the message box, as a dialog: focus stays inside and Escape goes back. The demo mounts `useKeyboardInset()`, as an app shell should, so the panel fits above the keyboard while replying.',
      },
    },
  },
  render: () => <MediaConversationDemo layout="overlay" />,
};

export const MediaConversationPhoneLandscape: Story = {
  name: 'Media conversation, phone landscape',
  globals: { viewport: { value: 'mobile2', isRotated: true } },
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story: 'The same phone turned sideways: a wide clip fills the screen.',
      },
    },
  },
  render: () => <MediaConversationDemo layout="overlay" />,
};

/**
 * A host's own card for a thread attachment: the clip's first frame and a
 * Play, in the clip's own shape, upright or wide.
 */
function HostCard({
  attachment,
  open,
  launchId,
}: SuperChatMessageMediaRenderProps) {
  // Width ÷ height, once the thumbnail (or the clip) says.
  const [aspect, setAspect] = React.useState<number>();
  // The host owns this text; localize it like the rest of the app.
  const label = `Play ${attachment.title ?? 'video'}`;
  const upright = aspect !== undefined && aspect < 1;
  const frame = {
    style: { aspectRatio: aspect ?? 16 / 9 },
    className: 'block w-full bg-black object-cover',
  };
  return (
    <button
      type="button"
      data-media-launch-id={launchId}
      aria-label={label}
      onClick={() => open(true)}
      className={`focus-visible:ring-ring relative mt-2 block max-w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:outline-none ${upright ? 'w-36' : 'w-60'}`}
    >
      {attachment.poster ? (
        // The thumbnail: nothing of the video loads until it's played.
        <img
          src={attachment.poster}
          alt=""
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight)
              setAspect(naturalWidth / naturalHeight);
          }}
          {...frame}
        />
      ) : (
        // No thumbnail: the clip's first frame stands in for one.
        <video
          src={attachment.src}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget;
            if (videoWidth && videoHeight) setAspect(videoWidth / videoHeight);
          }}
          {...frame}
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white">
          <Play className="size-5 fill-current" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export const HostMediaCard: Story = {
  name: 'Host media card',
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          "`renderMessageMedia` draws the host's own card for an attachment. Put `launchId` on its control as `data-media-launch-id`, so Back returns focus there; `open(true)` plays it in the media view. The card shows the attachment's `poster` (a thumbnail, so nothing of the video loads until it's played) in the clip's shape, upright or wide, and sits at the start of the bubble, under the text, however wide the message makes it. Why not [VideoCard](?path=/docs/media-videocard--docs)? It is a 16:9 thumbnail that links out or runs a click; this card keeps the clip's own shape (an upright clip stays upright), falls back to the video's first frame with no poster, and carries `data-media-launch-id`. Use VideoCard for a video library or a YouTube link; draw a card like this one for attachments that open the media view.",
      },
    },
  },
  render: () => (
    <MediaConversationDemo
      layout="overlay"
      posters
      renderMessageMedia={(props) =>
        props.attachment.kind === 'video' ? <HostCard {...props} /> : undefined
      }
    />
  ),
};

export const HostMediaCardNoPosters: Story = {
  name: 'Host media card, no posters',
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          "The same host card when attachments have no `poster`: it falls back to the clip's first frame (`preload=\"metadata\"`), still in the clip's own shape. Prefer real thumbnails where the host has them: nothing of the video loads until it's played.",
      },
    },
  },
  render: () => (
    <MediaConversationDemo
      layout="overlay"
      renderMessageMedia={(props) =>
        props.attachment.kind === 'video' ? <HostCard {...props} /> : undefined
      }
    />
  ),
};

export const MediaConversationPhoneRTL: Story = {
  name: 'Media conversation, phone RTL',
  globals: {
    viewport: { value: 'mobile2', isRotated: false },
    direction: 'rtl',
  },
  decorators: [fullHeightChat],
  parameters: {
    docs: {
      description: {
        story:
          'The overlay media view in a right-to-left page: Back sits at the start edge (the right) with its arrow flipped, the details mirror, and the player’s bar stays left to right, as media timelines do.',
      },
    },
  },
  render: () => <MediaConversationDemo layout="overlay" />,
};
