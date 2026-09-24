import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChat } from './index';
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
import { conversation, richConversation, registry } from './storyData';
import { markdownShowcaseConversation } from './storyData';
import 'katex/dist/katex.min.css';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChat> = {
  id: 'superchat-superchat-panel',
  title: 'Modules/SuperChat/SuperChat (Panel)',
  component: SuperChat,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    readOnly: {
      control: 'boolean',
      description: 'Disable the composer.',
      table: { category: 'Behavior' },
    },
    trustedContent: {
      control: 'boolean',
      description: 'Skip sanitization — only for host-authored content.',
      table: { category: 'Behavior' },
    },
    order: {
      control: 'inline-radio',
      options: ['asc', 'desc'],
      description:
        "Thread ordering: 'asc' (oldest→newest, messenger style) or 'desc' (newest→oldest, feed style).",
      table: { category: 'Behavior' },
    },
    virtualized: {
      control: 'boolean',
      description:
        'Windowed rendering — only mount rows near the viewport. Recommended for long threads.',
      table: { category: 'Behavior' },
    },
    currentParticipantId: {
      control: 'select',
      options: ['u1', 'u2', 'a1', 'a2'],
      description: 'The local user id (drives alignment + compose identity).',
      table: { category: 'Identity' },
    },
    // Complex/object + callback props are wired in code, not via controls.
    conversation: { control: false, table: { category: 'Data' } },
    renderPlugins: { control: false, table: { category: 'Rendering' } },
    renderTextContent: { control: false, table: { category: 'Rendering' } },
    linkBuilder: { control: false, table: { category: 'Rendering' } },
    className: { control: false },
    onMessageSent: { control: false, table: { category: 'Callbacks' } },
    onMessageEdited: { control: false, table: { category: 'Callbacks' } },
    onConversationClosed: { control: false, table: { category: 'Callbacks' } },
    onReferenceClick: { control: false, table: { category: 'Callbacks' } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The single-conversation panel of SuperChat: header (title, participant face-pile, optional back/close), a \`role="log"\` thread ordered by \`time\`, and a mention-aware composer — rendering exactly one \`conversation\` the host owns.** \`SuperChat\` takes \`conversation: SuperChatConversation\` (\`participants: Participant[]\` with \`kind\` \`human\` | \`agent\` | \`system\`, \`color\`, \`avatar\`; \`thread: SuperChatMessage[]\` with \`participantId\`, \`text\` and/or \`content\` blocks, \`time\`, \`status\`, \`editedAt\`, \`ref\`), \`currentParticipantId\` (drives alignment and compose identity), \`renderPlugins?: SuperChatRenderPlugin[]\` (composed by \`createMarkdownRenderer\` into one \`renderTextContent\`: GFM Markdown + \`rehype-sanitize\` by default), \`renderTextContent\` (replace the renderer entirely), \`trustedContent\` (skip sanitisation), \`readOnly\`, \`order\` \`asc\` | \`desc\`, \`virtualized\` (windowed rows via \`@tanstack/react-virtual\`), \`acceptedFileTypes: AttachmentKind[]\`, \`linkBuilder(ref)\`, and callbacks \`onMessageSent(text, { conversation, mentions, attachments })\`, \`onMessageEdited(messageId, text, { conversation })\` (enables inline Edit on your own text messages), \`onConversationClosed\`, \`onReferenceClick\`, \`onBack\`. Each message is an \`article\` with a Copy menu (rich + Markdown / Markdown / plain), speaker colour accent via \`ChatBubble\`, and \`MCPToolCallDisplay\` for tool blocks. Also exported from the same entry: \`SuperChatConversations\`, \`SuperChatInbox\`, \`createMarkdownRenderer\`, \`TextRenderContext\` / \`useTextRenderContext\`; rich plugins live in \`@mieweb/ui/components/SuperChat/plugins\`.

### Use it when

- You already know which conversation to show (a patient's thread on their chart, a case page) or you build your own list/panel layout — pair with \`SuperChatConversations\`.
- Several **agents and humans** share one thread, replies interleave by timestamp, and users address agents with \`@\`; \`mentions\` in \`onMessageSent\` tells your router who was asked.
- Messages are **Markdown** and you want opt-in code / math / Mermaid / GenUI / NITRO-table / image / attachment rendering without writing a renderer.

### Don't use it when

- You want the list and the panel together with selection handled — \`SuperChatInbox\`.
- One user talks to one assistant and you do not need Markdown, participants or a conversation model — \`AIChat\` is lighter (no \`react-markdown\` peers).
- Plain human-to-human messaging with delivery states and read receipts — the Messaging module; SuperChat has no \`status\` icons or read receipts.
- The host cannot install the Markdown-core peers (\`react-markdown\`, \`remark-gfm\`, \`rehype-sanitize\`) — they are required for the default renderer.

### Example

\`\`\`tsx
import { SuperChat } from '@mieweb/ui/components/SuperChat';
import { createCodePlugin, createMathPlugin } from '@mieweb/ui/components/SuperChat/plugins';
import 'katex/dist/katex.min.css';

const plugins = useMemo(() => [createCodePlugin(), createMathPlugin()], []);
const [conversation, setConversation] = useState<SuperChatConversation>(initial);
const append = (m: SuperChatMessage) =>
  setConversation((c) => ({ ...c, thread: [...c.thread, m], lastActivity: m.time }));

<div style={{ height: 520, display: 'flex' }}>
  <SuperChat
    conversation={conversation}
    currentParticipantId={me.id}
    renderPlugins={plugins}
    virtualized={conversation.thread.length > 200}
    linkBuilder={(ref) => \`/records/\${ref.refType}/\${ref.refId}\`}
    onMessageSent={(text, { mentions }) => {
      append({ id: crypto.randomUUID(), participantId: me.id, text, time: new Date().toISOString() });
      mentions.forEach((agentId) => agents.ask(agentId, conversation.id, text)); // host routes to its backend
    }}
    onMessageEdited={(id, text) =>
      setConversation((c) => ({ ...c, thread: c.thread.map((m) => m.id === id ? { ...m, text, editedAt: new Date().toISOString() } : m) }))}
  />
</div>
\`\`\`

### Limitations

- **Accessibility as implemented:** panel is a \`section role="group"\` labelled by its \`<h2>\`; the thread is \`role="log" aria-label="Messages" aria-live="polite"\` and focusable; each message is \`role="article"\` named "author, time"; system messages are \`role="status"\`. The composer is the shared \`ChatComposer\` (textarea "Message", mention listbox "Mention", Enter sends; attachments live behind the \`+\` menu "Add to message" → "Attach files"; internals expose \`chat-composer-*\` data-slots). Copy / Edit / Close / Back are icon buttons with English \`aria-label\`s; the Copy menu appears on hover **or** focus. Nothing moves focus after send.
- **Security is shared.** Default rendering sanitises with \`rehype-sanitize\`; \`trustedContent\`, a custom \`renderTextContent\`, the Mermaid plugin (\`dangerouslySetInnerHTML\` under \`securityLevel: 'strict'\`) and any plugin's \`sanitizeSchema\` widen the trust boundary — you own it. GenUI widgets render only host-registered, schema-validated components.
- Copy uses \`navigator.clipboard.write\` (secure context; plain-text fallback). Attachments are delivered to the host as base64 \`dataUrl\`s — upload and swap URLs yourself; \`attachmentCache\` (IndexedDB) is opt-in.
- **Layout.** Fills its flex parent (\`h-full\`); you must give it a bounded height. Non-virtualised threads render every row (rows are \`React.memo\`; keep message objects referentially stable). \`order="desc"\` anchors to the top.
- i18n: "Messages", "Participants", "Send message", "Copy message", "Edit message", "(edited)" and time via \`toLocaleTimeString\` are English/locale-default. RTL: alignment is flex-based, but the speaker accent is a physical \`borderLeft\` and the Copy control floats left/right by author.
- Peers: \`react-markdown\`, \`remark-gfm\`, \`rehype-sanitize\` (core); \`rehype-highlight\`, \`remark-math\` + \`rehype-katex\` + \`katex\`, \`mermaid\`, \`@mieweb/datavis\` per plugin — all optional in \`package.json\`. Not in the main barrel: import from \`@mieweb/ui/components/SuperChat\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/components/SuperChat',
      peers: ['react-markdown', 'remark-gfm', 'rehype-sanitize'],
      relationships: [
        {
          type: 'alternative to',
          target: 'chat-aichat',
          why: 'AIChat is one user ↔ one assistant with plain text by default; SuperChat is multi-participant with a Markdown plugin pipeline.',
        },
        {
          type: 'composes with',
          target: 'superchat-conversations-list',
          why: 'Pair the list with the panel to build a custom inbox layout; SuperChatInbox does exactly this.',
        },
        {
          type: 'uses',
          target: 'chat-aimessage',
          why: 'Message rows reuse ChatBubble (with a per-speaker accent) and AITypingIndicator from the AI module.',
        },
        {
          type: 'uses',
          target: 'chat-chatcomposer',
          why: 'The compose box is the shared ChatComposer (attachments behind its `+` menu, `chat-composer-*` data-slots) with mentionOptions built from the participants.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SuperChat>;

// ============================================================================
// Stateful demo wrapper
// ============================================================================
// SuperChat is controlled (the host owns conversation state). This wrapper
// shows the expected host wiring: append the sent message to the conversation's
// thread, and simulate a reply from any @-mentioned agent.

function InteractivePanel(
  props: Omit<React.ComponentProps<typeof SuperChat>, 'conversation'> & {
    initial: SuperChatConversation;
  }
) {
  const { initial, ...rest } = props;
  const [convo, setConvo] = React.useState(initial);

  const appendMessage = (message: SuperChatConversation['thread'][number]) => {
    setConvo((prev) => ({
      ...prev,
      thread: [...prev.thread, message],
      lastActivity: message.time,
    }));
  };

  return (
    <SuperChat
      {...rest}
      conversation={convo}
      onMessageEdited={(messageId, text) => {
        setConvo((prev) => ({
          ...prev,
          thread: prev.thread.map((m) =>
            m.id === messageId
              ? { ...m, text, editedAt: new Date().toISOString() }
              : m
          ),
        }));
      }}
      onMessageSent={(text, meta) => {
        const images = meta.attachments
          .filter((att) => att.type.startsWith('image/'))
          .map((att) => `![${att.name}](${att.dataUrl})`)
          .join('\n\n');
        // Non-image files: cache the bytes for offline use, then embed an
        // attachment block that renders an inline player from the cached id.
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
        appendMessage({
          id: `m-${Date.now()}`,
          participantId: props.currentParticipantId ?? 'u1',
          text: body,
          time: new Date().toISOString(),
        });
        meta.conversation.participants
          .filter((p) => p.kind === 'agent' && meta.mentions.includes(p.id))
          .forEach((agent, i) => {
            window.setTimeout(
              () =>
                appendMessage({
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
// Long-thread fixture (synthetic)
// ============================================================================
// Builds a conversation with `count` messages to exercise rendering on very
// long threads (memoized rows, scroll anchoring, asc/desc ordering). The
// participants rotate and each message gets a monotonically increasing time so
// the thread has a stable order.

function makeLongConversation(
  count: number,
  id = 'long'
): SuperChatConversation {
  const speakers = [
    {
      id: 'u1',
      kind: 'human' as const,
      name: 'Dr. Alice Reyes',
      color: '#0e7490',
    },
    { id: 'u2', kind: 'human' as const, name: 'Sam Carter', color: '#9333ea' },
    {
      id: 'a1',
      kind: 'agent' as const,
      name: 'Triage Agent',
      color: '#2563eb',
    },
    {
      id: 'a2',
      kind: 'agent' as const,
      name: 'Coding Agent',
      color: '#16a34a',
    },
  ];
  const samples = [
    'Reviewing the latest vitals now.',
    'BP is **128/82**, HR 76 — within range.',
    'Can you pull the most recent `CBC` panel?',
    'Potassium trended down to 4.6 after the second draw.',
    'Here is the summary:\n\n- Stable overnight\n- No new orders\n- Follow-up in AM',
    'Flagging for coding review — see `99213` vs `99214`.',
    'Agreed, the documentation supports the higher level.',
    'Patient reports improved symptoms since the last visit.',
    'Scheduling a follow-up for next Tuesday.',
    'Note added to the chart.',
  ];
  const start = new Date('2026-06-01T08:00:00Z').getTime();
  const thread = Array.from({ length: count }, (_, i) => {
    const speaker = speakers[i % speakers.length];
    return {
      id: `lm-${i}`,
      participantId: speaker.id,
      text: `${samples[i % samples.length]} _(message ${i + 1} of ${count})_`,
      time: new Date(start + i * 60_000).toISOString(),
    };
  });
  return {
    id,
    title: `Long thread — ${count} messages`,
    reference_id: 'patient/4821',
    unread: 0,
    participants: speakers,
    thread,
  };
}

const longConversation = makeLongConversation(300, 'long');

// ============================================================================
// Stories
// ============================================================================

export const Playground: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel
        {...args}
        initial={richConversation}
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
          createMermaidPlugin(),
          createImagePlugin(),
          createNitroTablePlugin(),
          createAttachmentPlugin(),
        ]}
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

// Reverse (newest-first, social-feed style) ordering. Same conversation and
// plugins as the Playground, but `order="desc"` flips the thread and anchors
// scroll to the top so the freshest message leads.
export const Reverse: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
    order: 'desc',
  },
  parameters: {
    docs: {
      description: {
        story: [
          'Newest-first ordering via `order="desc"` — a social-feed layout where',
          'the most recent message leads and older messages trail below. The thread',
          'anchors scroll to the **top** (rather than the bottom) when new messages',
          'arrive. Useful for activity feeds or when the latest update matters most.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel
        {...args}
        initial={richConversation}
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
          createMermaidPlugin(),
          createImagePlugin(),
          createNitroTablePlugin(),
          createAttachmentPlugin(),
        ]}
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

// A 300-message thread (oldest→newest, bottom-anchored). Exercises rendering
// and scroll behavior on long histories; each row is memoized so only changed
// rows re-render.
export const Long: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
    order: 'asc',
    virtualized: true,
  },
  parameters: {
    docs: {
      description: {
        story: [
          'A **300-message** conversation in the default `order="asc"` (oldest→newest)',
          'layout, anchored to the bottom. Rendered with `virtualized` so only the',
          'rows near the viewport are mounted — scroll to see rows window in and out.',
          'For very large histories, hosts can additionally cap/paginate `thread`',
          '(see the README **Performance & long conversations** section).',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel {...args} initial={longConversation} />
    </div>
  ),
};

// The same 300-message thread, newest-first (social-feed style, top-anchored).
export const LongReverse: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
    order: 'desc',
    virtualized: true,
  },
  parameters: {
    docs: {
      description: {
        story: [
          'The same **300-message** thread as **Long**, but `order="desc"` —',
          'newest-first, top-anchored social-feed layout, also `virtualized`.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel {...args} initial={longConversation} />
    </div>
  ),
};

// The only plugin-less example. Math (`$$ … $$`, `$x$`) and the ```genui``` block
// in the sample thread intentionally render as raw text here — see the note.
export const CoreNoPlugins: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'This panel renders with **no plugins** — Markdown core (GFM) only.',
          '',
          'Because the `math` and `genui` plugins are not enabled, the sample',
          "thread's `$$ … $$` / `$x > 0.7$` math and the ```genui``` block",
          '**intentionally appear as raw text** rather than rendered output. This is',
          'the expected baseline — enable the matching plugins (see the',
          '**Playground** story) to render math, code, GenUI, mermaid, images, and',
          'tables.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel
        initial={conversation}
        currentParticipantId="u1"
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

// A single post exercising every core/GFM markdown element, so the renderer's
// styling (headings, lists, tables, quotes, code, hr, …) can be inspected in
// one place. The code plugin is enabled so the fenced block is highlighted.
export const MarkdownShowcase: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
  },
  parameters: {
    docs: {
      description: {
        story: [
          'A single message containing **one of each** core/GFM markdown element —',
          'headings, emphasis, lists, task lists, blockquotes, inline + fenced code,',
          'a table, links, and a horizontal rule. Use it to verify the renderer',
          'styles every element correctly without the `@tailwindcss/typography`',
          'plugin.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <InteractivePanel
        {...args}
        initial={markdownShowcaseConversation}
        renderPlugins={[createCodePlugin()]}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

// ============================================================================
// Streaming response (scroll anchoring + jump to bottom)
// ============================================================================
// A long AI answer streams in chunk by chunk. While the user is at the bottom
// the thread follows the stream; the moment they scroll up to read, their
// position is preserved and the floating ↓ button appears. A follow-up
// message lands after the stream completes, so scrolling up also demos the
// "New messages" hint on the button.

const streamParticipants = [
  {
    id: 'u1',
    kind: 'human' as const,
    name: 'Dr. Alice Reyes',
    color: '#0e7490',
  },
  { id: 'a1', kind: 'agent' as const, name: 'Summary Agent', color: '#2563eb' },
];

const streamedAnswer = `Here is the **full visit summary** — no detail spared.

## Presenting concerns

The patient presented with a two-week history of intermittent palpitations, most noticeable in the evening and after caffeine. No syncope, no chest pain, no dyspnea on exertion. Symptoms are non-positional and resolve spontaneously within minutes.

## History

- Hypertension, well controlled on lisinopril 10 mg daily
- No prior arrhythmia, no structural heart disease on last echo (2024)
- Family history: father with atrial fibrillation at age 62
- Social: two espressos daily, no tobacco, alcohol 2–3 drinks/week

## Examination

Vitals today: BP **128/82**, HR 76 regular, afebrile. Cardiac exam unremarkable — no murmurs, rubs, or gallops. Lungs clear bilaterally. No peripheral edema.

## Data review

| Study | Date | Result |
| --- | --- | --- |
| 12-lead ECG | today | Normal sinus rhythm, no ectopy |
| CBC | last week | Within normal limits |
| TSH | last week | 2.1 mIU/L (normal) |
| Potassium | today | 4.6 mmol/L |

## Assessment

Palpitations, most consistent with benign premature beats provoked by caffeine. Low suspicion for sustained arrhythmia given the normal ECG, normal thyroid function, and absence of red-flag features. Family history of AF warrants a documented rhythm before fully closing the loop.

## Plan

1. 14-day ambulatory rhythm monitor to capture a symptomatic episode
2. Trial of caffeine reduction (one espresso daily) with a symptom diary
3. Continue lisinopril unchanged; recheck BP at follow-up
4. Return precautions reviewed — syncope, chest pain, or sustained rapid palpitations prompt urgent evaluation
5. Follow-up visit in three weeks to review the monitor data

The rhythm monitor referral has been queued and the symptom diary template added to the patient portal. All of today's findings are documented in the encounter note.`;

/** Sentence-ish chunks so the stream reads naturally. */
const streamChunks = streamedAnswer.match(/[^ ]+( |$)/g) ?? [streamedAnswer];

const streamingInitial: SuperChatConversation = {
  id: 'streaming-demo',
  title: 'Visit summary',
  reference_id: 'patient/4821',
  participants: streamParticipants,
  thread: [
    {
      id: 'sm-1',
      participantId: 'a1',
      text: 'The encounter note is ready for review. Want the highlights or the full summary?',
      time: '2026-06-01T09:00:00Z',
    },
    {
      id: 'sm-2',
      participantId: 'u1',
      text: '@Summary give me the **full** summary — don’t spare any detail.',
      time: '2026-06-01T09:00:30Z',
    },
  ],
};

function StreamingPanel(
  props: Partial<React.ComponentProps<typeof SuperChat>>
) {
  const [convo, setConvo] = React.useState(streamingInitial);
  const intervalRef = React.useRef<number>(undefined);
  const timeoutsRef = React.useRef<number[]>([]);

  const streamResponse = React.useCallback(() => {
    const messageId = `stream-${Date.now()}`;
    setConvo((prev) => ({
      ...prev,
      thread: [
        ...prev.thread,
        {
          id: messageId,
          participantId: 'a1',
          text: '',
          status: 'streaming' as const,
          time: new Date().toISOString(),
        },
      ],
    }));
    let cursor = 0;
    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      // A few words per tick ≈ token streaming.
      cursor = Math.min(cursor + 4, streamChunks.length);
      const done = cursor >= streamChunks.length;
      const text = streamChunks.slice(0, cursor).join('');
      setConvo((prev) => ({
        ...prev,
        thread: prev.thread.map((m) =>
          m.id === messageId
            ? { ...m, text, status: done ? undefined : ('streaming' as const) }
            : m
        ),
      }));
      if (done) {
        window.clearInterval(intervalRef.current);
        // A trailing message a beat later — scrolled-up users get the
        // "New messages" hint on the jump-to-bottom button.
        timeoutsRef.current.push(
          window.setTimeout(() => {
            setConvo((prev) => ({
              ...prev,
              thread: [
                ...prev.thread,
                {
                  id: `after-${Date.now()}`,
                  participantId: 'a1',
                  text: 'Anything else you’d like me to pull from the chart?',
                  time: new Date().toISOString(),
                },
              ],
            }));
          }, 1200)
        );
      }
    }, 120);
  }, []);

  // Kick off the demo stream shortly after mount; clean up on unmount.
  React.useEffect(() => {
    const kickoff = window.setTimeout(streamResponse, 800);
    const timeouts = timeoutsRef.current;
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(intervalRef.current);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [streamResponse]);

  return (
    <SuperChat
      {...props}
      conversation={convo}
      currentParticipantId="u1"
      onMessageSent={(text) => {
        setConvo((prev) => ({
          ...prev,
          thread: [
            ...prev.thread,
            {
              id: `m-${Date.now()}`,
              participantId: 'u1',
              text,
              time: new Date().toISOString(),
            },
          ],
        }));
        // Every send triggers another long streamed answer.
        timeoutsRef.current.push(window.setTimeout(streamResponse, 600));
      }}
    />
  );
}

export const StreamingResponse: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'A long AI answer **streams in** while the user reads. Scroll behavior:',
          '',
          '- **At the bottom** — the thread stays pinned and follows the stream',
          '  (content growth *and* container resizes re-pin via `useStickToBottom`).',
          '- **Scrolled up** — the position is preserved exactly; nothing yanks the',
          '  reader down. A floating **↓ jump-to-bottom** button appears over the',
          '  thread (`data-slot="superchat-jump-to-bottom"`).',
          '- When messages arrive while scrolled up, the button grows a',
          '  **“New messages”** hint. Clicking it returns to the newest message and',
          '  resumes pinning. Sending your own message always scrolls to the bottom.',
          '',
          'Try it: while the answer streams, scroll up — then click ↓. Sending any',
          'message triggers another long streamed answer. The same behavior is',
          'reusable via the exported `useStickToBottom` hook.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <StreamingPanel {...args} />
    </div>
  ),
};
