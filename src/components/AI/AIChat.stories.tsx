import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AIChat,
  SuggestedActions,
  FloatingAIChat,
  AIChatTrigger,
  type AIMessage,
} from './index';
import { sampleMessages, suggestedActions } from './storyData';

// ============================================================================
// AI Chat Stories
// ============================================================================

const meta: Meta<typeof AIChat> = {
  id: 'chat-aichat',
  title: 'Modules/Chat/AIChat',
  component: AIChat,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**A controlled, single-assistant chat surface: thread + composer + suggestion chips, with the host owning every message.** \`AIChat\` takes \`messages: AIMessage[]\` (or a \`session\`), renders one \`AIMessageDisplay\` per message inside a scrolling \`data-slot="ai-chat-messages"\` region that pins to the newest message while the reader is at the bottom (scrolling up preserves the position and shows a floating \u2193 jump-to-bottom button \u2014 see the Streaming Response story), and renders the standardized \`ChatComposer\` (attachments off, 1600-char cap, \`aria-label="Message"\`) as its input. Anatomy: a **header** (\`title\`, default "AI Assistant"; a red **Stop** button while \`isGenerating && onCancel\`; icon buttons for \`onClear\` and \`onClose\`; hide it with \`showHeader={false}\`), the **thread** (empty state "How can I help you today?" with \`suggestions\` chips; \`showTimestamps\`), a **suggestions row** above the composer once the thread is non-empty and not generating, and the **composer** (\`inputPlaceholder\`; \`composerProps\` passes \`ChatComposerProps\` through — legacy \`MessageComposerProps\` keys such as \`showAttachmentPicker\` and \`inputTrailing\` are still accepted and mapped; \`talkToText\` adds a \`RecordButton\` in the composer's mic slot wired to \`onRecordingStart\` / \`onRecordingComplete(blob, duration)\`). Suggestions are \`{ id, label, prompt, icon }\`; \`icon\` maps to a built-in glyph set (\`patient\`, \`search\`, \`appointment\`, \`document\`, \`help\`, \`default\`); selecting one calls \`onSuggestedAction\` or, if absent, \`onSendMessage(prompt)\`. \`renderTextContent(text, { messageId, streaming, role })\` and \`renderMessageFooter(message)\` are threaded to every message. Also exported: \`SuggestedActions\`, and the wrappers \`AIChatModal\` (\`open\`, \`onOpenChange\`, \`position\` \`bottom-right\` | \`bottom-left\` | \`center\`, \`width\`, \`height\`), \`AIChatTrigger\` and \`FloatingAIChat\` (trigger + modal, controlled or \`defaultOpen\`), which forward every \`AIChat\` prop. Variants: \`variant\` \`default\` | \`embedded\` | \`floating\`; \`size\` \`sm\`…\`full\`; \`height\`.

### Use it when

- One user talks to **one assistant** and you already have (or will build) the transport: you push \`AIMessage\`s with \`status: 'streaming' | 'complete' | 'error'\` and flip \`isGenerating\`; the component only renders.
- The reply may carry MCP tool calls, thinking blocks, code, images, files or audio (\`AIMessageContent\` block types) and you want them rendered inline.
- You want a floating helper docked in a corner (\`FloatingAIChat\`) or the Ozwell-branded shell around the same thread (\`OzwellChat\`, which wraps this component).

### Don't use it when

- The conversation has **several humans and/or several agents**, needs a conversation list, @-mentions with routing, or a Markdown plugin pipeline — \`SuperChatInbox\` / \`SuperChat\` (Modules › SuperChat).
- It is **human-to-human messaging** with read receipts, typing indicators and attachment upload — compose \`MessageThread\` / \`MessageList\` / \`MessageComposer\` from the Messaging module directly.
- You need the assistant text rendered as Markdown out of the box — it is plain text unless you pass \`renderTextContent\` (pair with \`MarkdownRenderer\`); the host owns sanitisation.
- You want voice in and out with wake words — \`HandsFreeChat\` / \`HeyOzwell\` (Modules › Voice); \`AIChat\` only offers the \`talkToText\` mic that hands you a \`Blob\`.

### Example

\`\`\`tsx
const [messages, setMessages] = useState<AIMessage[]>([]);
const [generating, setGenerating] = useState(false);
const abortRef = useRef<AbortController | null>(null);

async function send(text: string) {
  const userMsg: AIMessage = { id: crypto.randomUUID(), role: 'user', status: 'complete',
    timestamp: new Date(), content: [{ type: 'text', text }] };
  const replyId = crypto.randomUUID();
  setMessages((m) => [...m, userMsg,
    { id: replyId, role: 'assistant', status: 'streaming', timestamp: new Date(), content: [] }]);
  setGenerating(true);
  abortRef.current = new AbortController();
  try {
    // Host-owned transport: the endpoint and credentials come from your config, never from props.
    for await (const delta of streamChat(import.meta.env.VITE_CHAT_URL, [...messages, userMsg], abortRef.current.signal)) {
      setMessages((m) => m.map((msg) => msg.id === replyId
        ? { ...msg, content: [{ type: 'text', text: (msg.content[0]?.text ?? '') + delta }] }
        : msg));
    }
    setMessages((m) => m.map((msg) => msg.id === replyId ? { ...msg, status: 'complete' } : msg));
  } catch {
    setMessages((m) => m.map((msg) => msg.id === replyId ? { ...msg, status: 'error' } : msg));
  } finally {
    setGenerating(false);
  }
}

<AIChat
  messages={messages}
  isGenerating={generating}
  onSendMessage={send}
  onCancel={() => abortRef.current?.abort()}
  onClear={() => setMessages([])}
  suggestions={[{ id: 'sched', label: t('chat.schedule'), prompt: 'Schedule a follow-up', icon: 'appointment' }]}
  renderTextContent={(text, { streaming }) => <MarkdownRenderer content={text} streaming={streaming} />}
  userName={currentUser.displayName}
  height={560}
/>
\`\`\`

### Limitations

- **No live region.** The thread is a plain scrolling \`div\`; new or streamed assistant messages, the typing indicator and the header's "Generating..." text are not announced. \`onSendMessage\` receives trimmed text, plus the staged \`File[]\` as a second argument when attachments are enabled via \`composerProps\` (attachment-only sends deliver \`''\`) — the composer clears optimistically (Enter sends, Shift+Enter newlines, so focus stays in the textarea); if \`onSendMessage\` throws or rejects, the text draft is restored (attachments are not) and the failure is reported through \`composerProps.onError\` ("Failed to send message").
- Header icon buttons carry English \`aria-label\`s ("Clear chat", "Close chat"); **Stop** is visible text. Suggestion chips are plain \`<button>\`s. \`AIChatModal\` renders \`role="dialog" aria-modal aria-label="AI Assistant Chat"\`, traps focus and closes on Escape; its \`center\` backdrop is a focusable \`role="button"\`.
- **Sanitisation is the host's.** Default text rendering is \`whitespace-pre-wrap\` plain text; anything you return from \`renderTextContent\` is inserted as-is. Image/file/audio/video block URLs are only guarded against \`javascript:\`.
- \`session.isGenerating\` and \`session.messages\` win over the flat props; \`onToolCall\` / \`onToolComplete\` exist on \`AIChatCallbacks\` but are **never invoked** by this component (tool calls are display-only). \`talkToText\` requires a secure context and microphone permission; the \`duration\` passed to \`onRecordingComplete\` comes from \`RecordButton\` (see Media › RecordButton for its caveats).
- **i18n / RTL.** Every default string is English ("AI Assistant", "Ask anything...", "How can I help you today?", "Try asking:", "Generating...", "Stop"). User messages align with \`flex-row-reverse\`, and the modal/trigger positions are physical (\`right-4\`, \`left-4\`); the composer itself uses logical properties.
- **Theming.** Container and header use hard-coded \`neutral-*\`, \`white\`, \`primary-800\` and \`red-*\` utilities rather than semantic tokens. Depends on \`class-variance-authority\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'media-recordbutton',
          why: 'AIChat renders a RecordButton in its composer when talkToText is on.',
        },
        {
          type: 'composes with',
          target: 'chat-messaging',
          why: 'AIChat reuses EmptyState from the Messaging module for its empty thread.',
        },
        {
          type: 'contains',
          target: 'chat-chatcomposer',
          why: 'AIChat’s input is the standardized ChatComposer (attachments off by default); legacy MessageComposer keys passed through composerProps are mapped for compatibility.',
        },
        {
          type: 'contains',
          target: 'chat-aimessage',
          why: 'Every message in the thread is rendered by AIMessageDisplay.',
        },
        {
          type: 'alternative to',
          target: 'superchat-superchat-panel',
          why: 'AIChat is one user ↔ one assistant with plain text by default; SuperChat is multi-participant with a Markdown plugin pipeline.',
        },
      ],
    },
  },
  argTypes: {
    messages: {
      control: 'object',
      description: 'Messages to display in the thread.',
      table: { type: { summary: 'AIMessage[]' } },
    },
    suggestions: {
      control: 'object',
      description:
        'Quick-action prompt chips shown in the empty state and above the composer.',
      table: { type: { summary: 'AISuggestedAction[]' } },
    },
    isGenerating: {
      control: 'boolean',
      description:
        'Whether the assistant is currently generating (shows the typing indicator and hides suggestions).',
    },
    userName: {
      control: 'text',
      description: 'Display name used for the current user’s avatar.',
      table: { defaultValue: { summary: "'You'" } },
    },
    title: {
      control: 'text',
      description: 'Title shown in the chat header.',
      table: { defaultValue: { summary: "'AI Assistant'" } },
    },
    inputPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the composer input.',
      table: { defaultValue: { summary: "'Ask anything...'" } },
    },
    showHeader: {
      control: 'boolean',
      description: 'Whether to render the header bar.',
      table: { defaultValue: { summary: 'true' } },
    },
    showTimestamps: {
      control: 'boolean',
      description: 'Whether to render per-message timestamps.',
      table: { defaultValue: { summary: 'false' } },
    },
    talkToText: {
      control: 'boolean',
      description: 'Enable the talk-to-text microphone button in the composer.',
      table: { defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'embedded', 'floating'],
      description: 'Visual container style.',
      table: { defaultValue: { summary: "'default'" } },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Max-width constraint of the chat container.',
      table: { defaultValue: { summary: "'full'" } },
    },
    renderTextContent: {
      control: false,
      description:
        'Render-prop for message text blocks — plug in Markdown/Mermaid here. Host must sanitize.',
      table: { type: { summary: 'AIRenderTextContent' } },
    },
    onSendMessage: {
      action: 'onSendMessage',
      description: 'Called when the user submits a message.',
    },
    onSuggestedAction: {
      action: 'onSuggestedAction',
      description: 'Called when a suggested action chip is selected.',
    },
    onResourceClick: {
      action: 'onResourceClick',
      description: 'Called when a resource link in a tool result is clicked.',
    },
    onClear: {
      action: 'onClear',
      description: 'Called when the chat is cleared.',
    },
    onCancel: {
      action: 'onCancel',
      description: 'Called when the user cancels an in-progress generation.',
    },
    className: { table: { disable: true } },
  },
  args: {
    messages: sampleMessages,
    suggestions: suggestedActions,
    userName: 'Dr. Jane',
  },
};

export default meta;
type Story = StoryObj<typeof AIChat>;

/** Interactive playground — adjust props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <div className="h-[600px]">
      <AIChat {...args} height="100%" />
    </div>
  ),
};

/** Empty state: suggestions surface as a getting-started prompt grid. */
export const EmptyChat: Story = {
  render: () => (
    <div className="h-[600px]">
      <AIChat
        messages={[]}
        suggestions={suggestedActions}
        height="100%"
        onSendMessage={(msg) => console.log('Send:', msg)}
      />
    </div>
  ),
};

/** A populated conversation, including an inline tool call. */
export const ChatWithMessages: Story = {
  render: () => (
    <div className="h-[600px]">
      <AIChat
        messages={sampleMessages}
        suggestions={suggestedActions}
        height="100%"
        userName="Dr. Jane"
        onSendMessage={(msg) => console.log('Send:', msg)}
        onResourceClick={(link) => console.log('Link clicked:', link)}
        onClear={() => console.log('Clear chat')}
      />
    </div>
  ),
};

/** The assistant is streaming a response — note the typing indicator. */
export const GeneratingResponse: Story = {
  render: () => {
    const messages: AIMessage[] = [
      ...sampleMessages.slice(0, 3),
      {
        id: '5',
        role: 'assistant',
        content: [],
        timestamp: new Date(),
        status: 'streaming',
      },
    ];
    return (
      <div className="h-[600px]">
        <AIChat
          messages={messages}
          isGenerating={true}
          height="100%"
          onSendMessage={(msg) => console.log('Send:', msg)}
          onCancel={() => console.log('Cancel generation')}
        />
      </div>
    );
  },
};

// ============================================================================
// Streaming response (scroll anchoring + jump to bottom)
// ============================================================================
// A long AI answer streams in chunk by chunk. While the user is at the bottom
// the thread follows the stream; the moment they scroll up to read, their
// position is preserved and the floating ↓ button appears. A follow-up
// message lands after the stream completes, so scrolling up also demos the
// "New messages" hint on the button.

const streamedAnswer = `Here is the full visit summary — no detail spared.

Presenting concerns: the patient presented with a two-week history of intermittent palpitations, most noticeable in the evening and after caffeine. No syncope, no chest pain, no dyspnea on exertion. Symptoms are non-positional and resolve spontaneously within minutes.

History: hypertension, well controlled on lisinopril 10 mg daily. No prior arrhythmia and no structural heart disease on the last echo (2024). Family history is notable for a father with atrial fibrillation at age 62. Social history: two espressos daily, no tobacco, alcohol 2–3 drinks per week.

Examination: BP 128/82, HR 76 regular, afebrile. Cardiac exam unremarkable — no murmurs, rubs, or gallops. Lungs clear bilaterally. No peripheral edema.

Data review: the 12-lead ECG from today shows normal sinus rhythm with no ectopy. CBC from last week is within normal limits. TSH is 2.1 mIU/L (normal). Potassium today is 4.6 mmol/L.

Assessment: palpitations, most consistent with benign premature beats provoked by caffeine. Low suspicion for sustained arrhythmia given the normal ECG, normal thyroid function, and absence of red-flag features. The family history of AF warrants a documented rhythm before fully closing the loop.

Plan: a 14-day ambulatory rhythm monitor to capture a symptomatic episode; a trial of caffeine reduction (one espresso daily) with a symptom diary; continue lisinopril unchanged and recheck BP at follow-up; return precautions reviewed — syncope, chest pain, or sustained rapid palpitations prompt urgent evaluation; follow-up visit in three weeks to review the monitor data.

The rhythm monitor referral has been queued and the symptom diary template added to the patient portal. All of today's findings are documented in the encounter note.`;

/** Word-sized chunks so the stream reads naturally. */
const streamChunks = streamedAnswer.match(/[^ ]+( |$)/g) ?? [streamedAnswer];

function StreamingChat() {
  const [messages, setMessages] = React.useState<AIMessage[]>([
    {
      id: 'seed-1',
      role: 'assistant',
      status: 'complete',
      timestamp: new Date(),
      content: [
        {
          type: 'text',
          text: 'The encounter note is ready for review. Want the highlights or the full summary?',
        },
      ],
    },
    {
      id: 'seed-2',
      role: 'user',
      status: 'complete',
      timestamp: new Date(),
      content: [
        {
          type: 'text',
          text: 'Give me the full summary — don’t spare any detail.',
        },
      ],
    },
  ]);
  const [generating, setGenerating] = React.useState(false);
  const intervalRef = React.useRef<number | undefined>(undefined);
  const timeoutsRef = React.useRef<number[]>([]);

  const streamResponse = React.useCallback(() => {
    const messageId = `stream-${Date.now()}`;
    setGenerating(true);
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date(),
        content: [],
      },
    ]);
    let cursor = 0;
    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      // A few words per tick ≈ token streaming.
      cursor = Math.min(cursor + 4, streamChunks.length);
      const done = cursor >= streamChunks.length;
      const text = streamChunks.slice(0, cursor).join('');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: [{ type: 'text' as const, text }],
                status: done ? ('complete' as const) : ('streaming' as const),
              }
            : m
        )
      );
      if (done) {
        window.clearInterval(intervalRef.current);
        setGenerating(false);
        // A trailing message a beat later — scrolled-up users get the
        // "New messages" hint on the jump-to-bottom button.
        timeoutsRef.current.push(
          window.setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `after-${Date.now()}`,
                role: 'assistant',
                status: 'complete',
                timestamp: new Date(),
                content: [
                  {
                    type: 'text',
                    text: 'Anything else you’d like me to pull from the chart?',
                  },
                ],
              },
            ]);
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
    <AIChat
      messages={messages}
      isGenerating={generating}
      height="100%"
      userName="Dr. Jane"
      onSendMessage={(text) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            role: 'user',
            status: 'complete',
            timestamp: new Date(),
            content: [{ type: 'text', text }],
          },
        ]);
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
          '- **Incoming streams never push the view** — when a reply starts',
          '  streaming, its first line is revealed and the scroll then holds; the',
          '  response fills below the fold under a ↓ arrow that upgrades to',
          '  **“New messages”** when it finishes. A short reply that fits resumes',
          '  normal pinning.',
          '- **Scrolled up** — the position is preserved exactly; nothing yanks the',
          '  reader down. A floating **↓ jump-to-bottom** button appears over the',
          '  thread (`data-slot="ai-chat-jump-to-bottom"`).',
          '- When messages arrive while scrolled up, the button grows a',
          '  **“New messages”** hint. Clicking it returns to the newest message and',
          '  resumes pinning.',
          '- **Sending your own message opens an anchored turn** (the',
          '  ChatGPT/Claude UX): your bubble scrolls to the **top** of the',
          '  viewport and the reply streams into reserved space below',
          '  (`data-slot="ai-chat-turn"`). The view stays put while you read — even',
          '  past the fold; jump-to-bottom or scrolling down yourself resumes',
          '  pinning.',
          '',
          'Try it: send a message and watch it anchor to the top. While the answer',
          'streams, scroll up — then click ↓. Sending any',
          'message triggers another long streamed answer. Same policy as SuperChat;',
          'the behavior is reusable via the exported `useStickToBottom` hook.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <div className="h-[600px]">
      <StreamingChat />
    </div>
  ),
};

/** Talk-to-text: the composer exposes a microphone for voice input. */
export const TalkToText: Story = {
  render: () => (
    <div className="h-[600px]">
      <AIChat
        messages={[]}
        suggestions={suggestedActions}
        height="100%"
        talkToText
        onSendMessage={(msg) => console.log('Send:', msg)}
        onRecordingComplete={(blob, duration) =>
          console.log('Recording complete:', { size: blob.size, duration })
        }
      />
    </div>
  ),
};
/**
 * The **Suggested Actions** bar in isolation. These are the quick-prompt pill
 * buttons rendered by `AIChat` via its `suggestions` prop; each `icon` key maps
 * to a built-in glyph.
 */
export const SuggestedActionsBar: StoryObj<typeof SuggestedActions> = {
  name: 'Suggested Actions',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="max-w-lg">
      <SuggestedActions
        actions={suggestedActions}
        onSelect={(action) => console.log('Selected:', action)}
      />
    </div>
  ),
};

// ============================================================================
// Floating / Modal Stories
// ============================================================================

function FloatingChatButtonDemo() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative h-[400px] bg-neutral-100 p-4 dark:bg-neutral-800">
      <p className="text-muted-foreground">
        Click the AI button in the corner to open the chat.
      </p>
      <AIChatTrigger
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        pulse={true}
      />
    </div>
  );
}

/** The standalone floating trigger button (`AIChatTrigger`). */
export const FloatingChatButton: StoryObj<typeof AIChatTrigger> = {
  render: () => <FloatingChatButtonDemo />,
};

/** `FloatingAIChat`: trigger button + docked modal, wired together. */
export const FloatingChatComplete: StoryObj<typeof FloatingAIChat> = {
  render: () => (
    <div className="relative h-[700px] bg-neutral-100 p-4 dark:bg-neutral-800">
      <p className="text-muted-foreground">
        Click the AI button in the corner to open the chat.
      </p>
      <FloatingAIChat
        messages={sampleMessages}
        suggestions={suggestedActions}
        userName="Dr. Jane"
        pulse={true}
        onSendMessage={(msg) => console.log('Send:', msg)}
        onResourceClick={(link) => console.log('Link clicked:', link)}
        onClear={() => console.log('Clear chat')}
      />
    </div>
  ),
};
