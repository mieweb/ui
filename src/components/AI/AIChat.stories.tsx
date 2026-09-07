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

**A controlled, single-assistant chat surface: thread + composer + suggestion chips, with the host owning every message.** \`AIChat\` takes \`messages: AIMessage[]\` (or a \`session\`), renders one \`AIMessageDisplay\` per message inside a scrolling \`data-slot="ai-chat-messages"\` region that auto-scrolls to the newest message, and reuses the Messaging module's \`MessageComposer\` (\`variant="minimal"\`, attachments/camera/character-count off) as its input. Anatomy: a **header** (\`title\`, default "AI Assistant"; a red **Stop** button while \`isGenerating && onCancel\`; icon buttons for \`onClear\` and \`onClose\`; hide it with \`showHeader={false}\`), the **thread** (empty state "How can I help you today?" with \`suggestions\` chips; \`showTimestamps\`), a **suggestions row** above the composer once the thread is non-empty and not generating, and the **composer** (\`inputPlaceholder\`, \`composerProps\` passthrough, \`talkToText\` adds a \`RecordButton\` in the input's trailing slot wired to \`onRecordingStart\` / \`onRecordingComplete(blob, duration)\`). Suggestions are \`{ id, label, prompt, icon }\`; \`icon\` maps to a built-in glyph set (\`patient\`, \`search\`, \`appointment\`, \`document\`, \`help\`, \`default\`); selecting one calls \`onSuggestedAction\` or, if absent, \`onSendMessage(prompt)\`. \`renderTextContent(text, { messageId, streaming, role })\` and \`renderMessageFooter(message)\` are threaded to every message. Also exported: \`SuggestedActions\`, and the wrappers \`AIChatModal\` (\`open\`, \`onOpenChange\`, \`position\` \`bottom-right\` | \`bottom-left\` | \`center\`, \`width\`, \`height\`), \`AIChatTrigger\` and \`FloatingAIChat\` (trigger + modal, controlled or \`defaultOpen\`), which forward every \`AIChat\` prop. Variants: \`variant\` \`default\` | \`embedded\` | \`floating\`; \`size\` \`sm\`…\`full\`; \`height\`.

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

- **No live region.** The thread is a plain scrolling \`div\`; new or streamed assistant messages, the typing indicator and the header's "Generating..." text are not announced. \`onSendMessage\` receives trimmed text only — the composer clears itself (Enter sends, Shift+Enter newlines, so focus stays in the textarea) and nothing moves focus to the reply.
- Header icon buttons carry English \`aria-label\`s ("Clear chat", "Close chat"); **Stop** is visible text. Suggestion chips are plain \`<button>\`s. \`AIChatModal\` renders \`role="dialog" aria-modal aria-label="AI Assistant Chat"\`, traps focus and closes on Escape; its \`center\` backdrop is a focusable \`role="button"\`.
- **Sanitisation is the host's.** Default text rendering is \`whitespace-pre-wrap\` plain text; anything you return from \`renderTextContent\` is inserted as-is. Image/file/audio/video block URLs are only guarded against \`javascript:\`.
- \`session.isGenerating\` and \`session.messages\` win over the flat props; \`onToolCall\` / \`onToolComplete\` exist on \`AIChatCallbacks\` but are **never invoked** by this component (tool calls are display-only). \`talkToText\` requires a secure context and microphone permission; the \`duration\` passed to \`onRecordingComplete\` comes from \`RecordButton\` (see Media › RecordButton for its caveats).
- **i18n / RTL.** Every default string is English ("AI Assistant", "Ask anything...", "How can I help you today?", "Try asking:", "Generating...", "Stop"). User messages align with \`flex-row-reverse\`, the composer's trailing slot uses \`right-1\` / \`pr-10\`, and the modal/trigger positions are physical (\`right-4\`, \`left-4\`).
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
          why: 'AIChat reuses MessageComposer and EmptyState from the Messaging module for its input and empty thread.',
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
