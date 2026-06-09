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
  title: 'Product/Feature Modules/AI/AIChat',
  component: AIChat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          '`AIChat` is a complete, themeable chat interface for AI assistants. It renders a message',
          'thread (`AIMessageDisplay`), an input composer (reused from the Messaging module), optional',
          'suggested-action chips, and built-in support for MCP tool calls and streaming responses.',
          '',
          '### Anatomy',
          '- **Header** — title, _Clear_, and optional _Close_ actions (`showHeader`, `onClear`, `onClose`).',
          '- **Message thread** — one `AIMessageDisplay` per message; tool calls and "thinking" blocks render inline.',
          '- **Suggested actions** — the row of pill buttons driven by the `suggestions` prop (see below).',
          '- **Composer** — the input, with an optional talk-to-text mic (`talkToText`).',
          '',
          '### Suggested actions',
          'Pass `suggestions={[{ id, label, prompt, icon }]}` to offer quick prompts. When the thread is',
          '**empty** they appear in the empty state; once a conversation is underway they render just above',
          'the composer (and are hidden while the assistant is generating). The `icon` key maps to a small',
          'built-in glyph set (`patient`, `search`, `appointment`, `document`, `help`, …). Selecting one',
          'fires `onSuggestedAction` and sends its `prompt`. See the **Suggested Actions** story.',
          '',
          '### Markdown, images & Mermaid diagrams',
          'Message text is plain by default. To render **Markdown, images, or Mermaid diagrams**, pass a',
          '`renderTextContent` render-prop and plug in your own renderer (e.g. `react-markdown` + `remark-gfm`,',
          'with a custom code-block handler that lazy-loads Mermaid). The host owns rendering so it also owns',
          '**sanitization** of untrusted model output. Inline images are handled by the Messaging attachment',
          'lightbox. See _AIMessage → With Custom Markdown Renderer_ for the contract.',
          '',
          '### Modal & floating variants',
          'Use `AIChatModal` to dock the chat in a corner or center it with a backdrop, or `FloatingAIChat`',
          'for a one-line trigger-button + modal combo. Both forward every `AIChat` prop. See the',
          '**Floating Chat Complete** story.',
          '',
          '### Accessibility',
          'The modal variants render `role="dialog"` with `aria-modal`, trap focus while open, and close on',
          '`Escape`. The composer and actions are fully keyboard operable.',
        ].join('\n'),
      },
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
