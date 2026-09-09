import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  AIMessageDisplay,
  type AIMessage,
  type AIRenderTextContent,
} from './index';
import { successToolCall } from './storyData';
import { getSampleAudio } from '../AudioPlayer/sampleAudio';
import { getSampleVideo } from '../AudioPlayer/sampleVideo';

// ============================================================================
// AI Message Stories
// ============================================================================

const meta: Meta<typeof AIMessageDisplay> = {
  id: 'chat-aimessage',
  title: 'Modules/Chat/AIMessage',
  component: AIMessageDisplay,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Renders one \`AIMessage\` — avatar, bubble and its ordered content blocks — for any role.** \`AIMessageDisplay\` takes \`message: AIMessage\` (\`role\` \`user\` | \`assistant\` | \`system\` | \`tool\`, \`status\` \`pending\` | \`streaming\` | \`complete\` | \`error\`, \`content: AIMessageContent[]\`) plus \`userName\` (initials for the user avatar), \`showAvatar\`, \`showTimestamp\`, \`onLinkClick(link)\` for resource links inside tool results, \`renderTextContent\` and \`renderMessageFooter\`. Each block type has a fixed renderer: \`text\` → \`whitespace-pre-wrap\` paragraph or your \`renderTextContent(text, { messageId, streaming, role })\`; \`tool_use\` → an embedded \`MCPToolCallDisplay\`; \`thinking\` → a violet \`CollapsiblePill\` ("Thinking" while streaming, then "Thought for Ns"); \`code\` → \`<pre><code class="language-…">\`; \`image\` → lazy \`<img>\` inside a new-tab link; \`file\` → card with name and formatted size, linked when \`fileUrl\` is set; \`audio\` → \`AudioPlayer variant="waveform"\`; \`video\` → native \`<video controls>\`. A \`streaming\` message with no blocks shows \`AITypingIndicator\`; \`status: 'error'\` adds a red border and "Failed to send" / "An error occurred". \`tool\` messages render bubble-less. Also exported: \`ChatBubble\` (the shared bubble shell with \`variant\`, \`hasError\`, \`accent\`), \`MessageAvatar\`, \`AITypingIndicator\`, \`bubbleVariants\`.

### Use it when

- You are building your own thread layout (virtualised list, side-by-side compare, transcript export view) but want the library's message rendering, including MCP tool calls and thinking blocks.
- You need the shared \`ChatBubble\` look for a non-AI surface (SuperChat uses it with a per-participant \`accent\`).
- You want Markdown, Mermaid or custom widgets: pass \`renderTextContent\` and use \`ctx.streaming\` to defer expensive work and \`ctx.messageId\` as a cache key.

### Don't use it when

- You need the whole chat — thread, composer, suggestions — \`AIChat\` renders this component for you.
- The content is a human-to-human message with delivery status, reactions and read receipts — Messaging's \`MessageBubble\`.
- You only need the tool-call card — \`MCPToolCallDisplay\` directly.

### Example

\`\`\`tsx
// Host-owned renderer; MarkdownRenderer sanitises, and streaming skips heavy blocks until complete.
const renderText: AIRenderTextContent = (text, { streaming }) => (
  <MarkdownRenderer content={text} streaming={streaming} />
);

<div role="log" aria-live="polite" aria-label={t('chat.thread')} className="space-y-4">
  {messages.map((m) => (
    <AIMessageDisplay
      key={m.id}
      message={m}
      userName={currentUser.displayName}
      showTimestamp
      renderTextContent={renderText}
      onLinkClick={(link) => navigate(link.href)}
      renderMessageFooter={(msg) => msg.role === 'assistant' && msg.status === 'complete'
        ? <CopyButton text={plainText(msg)} />
        : null}
    />
  ))}
</div>
\`\`\`

### Limitations

- **Sanitisation is yours.** Whatever \`renderTextContent\` returns is mounted verbatim inside a \`prose\` wrapper; the default is plain text. \`image\`/\`file\`/\`audio\`/\`video\` URLs are only rejected when they start with \`javascript:\` — validate hosts and MIME types before they reach the message.
- **No announcements.** The component has no \`aria-live\`; streaming, the typing indicator, the error text and the thinking/tool pills changing state are silent unless the host wraps the thread in a live region. Timestamps use \`toLocaleTimeString\` and the \`ai-message-timestamp\` span is not a \`<time>\`. Avatars are decorative (icon or initials, no accessible name); the image link's label is \`View <name>\` and the video's label falls back to "Video recording".
- **Layout is not virtualised** and a \`renderTextContent\` runs for every text block on every render; memoise heavy renderers.
- **RTL / theming.** User messages use \`flex-row-reverse\` and bubbles are \`max-w-[85%]\`; the thinking block uses logical \`border-s\`/\`ps-3\` but \`ChatBubble accent\` sets a physical \`borderLeft\`. Colours are hard-coded \`neutral-*\`, \`primary-800\`, \`violet-*\`, \`red-*\`; the \`prose\` classes need \`@tailwindcss/typography\` to have any effect.
- i18n: "Thinking", "Thought for Ns", "Failed to send", "An error occurred", "Audio recording", "Video recording", "Uploaded image", "Document" and the \`B\`/\`KB\`/\`MB\` size labels are English. The \`audio\` block requires the \`wavesurfer.js\` optional peer via \`AudioPlayer\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'media-audioplayer',
          why: 'AIMessageDisplay renders `audio` content blocks with a waveform AudioPlayer.',
        },
        {
          type: 'composes with',
          target: 'editors-markdown',
          why: 'Pass MarkdownRenderer through renderTextContent to render assistant text as sanitised Markdown.',
        },
        {
          type: 'composes with',
          target: 'chat-mcptoolcall',
          why: '`tool_use` blocks render an embedded MCPToolCallDisplay with the message’s onLinkClick.',
        },
      ],
    },
  },
  argTypes: {
    message: {
      control: 'object',
      description:
        'The message object to render, including its content blocks.',
      table: { type: { summary: 'AIMessage' } },
    },
    userName: {
      control: 'text',
      description: 'Display name used for the avatar on `user` messages.',
    },
    showAvatar: {
      control: 'boolean',
      description: 'Whether to render the role avatar next to the message.',
      table: { defaultValue: { summary: 'true' } },
    },
    showTimestamp: {
      control: 'boolean',
      description: 'Whether to render the message timestamp.',
      table: { defaultValue: { summary: 'false' } },
    },
    onLinkClick: {
      action: 'onLinkClick',
      description:
        'Called when a resource link inside a tool result is clicked.',
      table: { type: { summary: '(link: MCPResourceLink) => void' } },
    },
    renderTextContent: {
      control: false,
      description:
        'Render-prop for `text` blocks. Receives `(text, { messageId, streaming, role })`. Plug in Markdown/Mermaid here. Host must sanitize.',
      table: { type: { summary: 'AIRenderTextContent' } },
    },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof AIMessageDisplay>;

/** A simple message from the user. */
export const UserMessage: Story = {
  render: () => {
    const message: AIMessage = {
      id: '1',
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Can you help me add a new patient named John Smith, born March 15, 1985?',
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} userName="Dr. Jane" />;
  },
};

/** A plain prose response from the assistant. */
export const AssistantMessage: Story = {
  render: () => {
    const message: AIMessage = {
      id: '2',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "I'll create a new patient record for John Smith with the date of birth March 15, 1985. Let me do that for you now.",
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** An assistant turn that interleaves prose with an embedded tool call. */
export const MessageWithToolCall: Story = {
  render: () => {
    const message: AIMessage = {
      id: '3',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "I'll create a new patient record for John Smith.",
        },
        { type: 'tool_use', toolCall: successToolCall },
        {
          type: 'text',
          text: "Done! I've created the patient record. You can click the link above to view the patient's chart.",
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** A message that is still streaming, showing the typing indicator. */
export const StreamingMessage: Story = {
  render: () => {
    const message: AIMessage = {
      id: '4',
      role: 'assistant',
      content: [],
      timestamp: new Date(),
      status: 'streaming',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** Thinking pill while the model is actively reasoning — pulsing dot, "Thinking" label. */
export const ThinkingActive: Story = {
  render: () => {
    const message: AIMessage = {
      id: '5a',
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          text: 'The user wants to add a new patient. I should use the create_patient tool with the provided information. Validating date format and required fields...',
          collapsed: false,
        },
      ],
      timestamp: new Date(),
      status: 'streaming',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** Thinking pill after the model finished — "Thought" label, no dot, collapsed by default. */
export const ThinkingComplete: Story = {
  render: () => {
    const message: AIMessage = {
      id: '5b',
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          text: 'The user wants to add a new patient. I should use the create_patient tool with the provided information. I need to validate the date format and ensure all required fields are present.',
          collapsed: true,
        },
        {
          type: 'text',
          text: "I'll create a new patient record for John Smith.",
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** Thinking pill expanded — user clicked to reveal reasoning content. */
export const ThinkingExpanded: Story = {
  render: () => {
    const message: AIMessage = {
      id: '5c',
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          text: 'The user wants to add a new patient. I should use the create_patient tool with the provided information. I need to validate the date format and ensure all required fields are present.',
          collapsed: false,
        },
        {
          type: 'text',
          text: "I'll create a new patient record for John Smith.",
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/**
 * Demonstrates the `renderTextContent` extension point. This trivial demo turns
 * `**bold**` into `<strong>`; in a real app you would plug in a full Markdown
 * renderer (with Mermaid/image support) here and sanitize untrusted output.
 */
export const WithCustomMarkdownRenderer: Story = {
  render: () => {
    const message: AIMessage = {
      id: '6',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Here is some **bold** text rendered via a host-supplied renderer.',
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    // Demo: **bold** -> <strong>. Hosts plug in a real Markdown renderer.
    const renderTextContent: AIRenderTextContent = (text, ctx) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p data-message-id={ctx.messageId} data-streaming={ctx.streaming}>
          {parts.map((part, i) =>
            /^\*\*[^*]+\*\*$/.test(part) ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              <React.Fragment key={i}>{part}</React.Fragment>
            )
          )}
        </p>
      );
    };
    return (
      <AIMessageDisplay
        message={message}
        renderTextContent={renderTextContent}
      />
    );
  },
};

/** An assistant turn with a clickable image thumbnail. */
export const WithImageBlock: Story = {
  render: () => {
    const message: AIMessage = {
      id: '7',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "Here's the lab result image you requested.",
        },
        {
          type: 'image',
          imageUrl:
            'https://placehold.co/600x400/4f46e5/ffffff/png?text=Lab+Result',
          name: 'Lab result scan',
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/** An assistant turn with a file document card showing icon, filename, and size. */
export const WithFileBlock: Story = {
  render: () => {
    const message: AIMessage = {
      id: '8',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "Here's the full report you requested.",
        },
        {
          type: 'file',
          name: 'patient-report.pdf',
          fileSize: 1_258_291,
          mimeType: 'application/pdf',
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} />;
  },
};

/**
 * A user turn carrying a recorded audio clip, rendered inline as a waveform
 * `AudioPlayer`. This is how a captured dictation plays back next to its
 * transcription. `duration` (seconds) is passed through as the player's
 * `fallbackDuration` so the time shows before audio metadata loads.
 */
export const WithAudioBlock: Story = {
  render: () => {
    const message: AIMessage = {
      id: '9',
      role: 'user',
      content: [
        {
          type: 'audio',
          audioUrl: getSampleAudio(),
          text: 'Voice recording',
          mimeType: 'audio/wav',
          duration: 10,
        },
        {
          type: 'text',
          text: 'Patient reports mild headache for the past two days.',
        },
      ],
      timestamp: new Date(),
      status: 'complete',
    };
    return <AIMessageDisplay message={message} userName="Dr. Jane" />;
  },
};

/**
 * A user turn carrying a recorded screen/video clip, rendered inline as a native
 * `<video>` player. This is how a captured screen recording plays back next to
 * its transcription. The sample clip is generated locally via canvas +
 * `MediaRecorder`, so the demo shows a brief loading state while it renders.
 */
const VideoBlockDemo: React.FC = () => {
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void getSampleVideo().then(
      (url) => {
        if (active) setVideoUrl(url);
      },
      (err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to generate sample video.'
          );
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!videoUrl) {
    return (
      <p className="text-muted-foreground text-sm">Generating sample video…</p>
    );
  }

  const message: AIMessage = {
    id: '10',
    role: 'user',
    content: [
      {
        type: 'video',
        videoUrl,
        text: 'Screen recording',
        mimeType: 'video/webm',
      },
      {
        type: 'text',
        text: 'Walkthrough of the reported issue on the dashboard.',
      },
    ],
    timestamp: new Date(),
    status: 'complete',
  };
  return <AIMessageDisplay message={message} userName="Dr. Jane" />;
};

export const WithVideoBlock: Story = {
  render: () => <VideoBlockDemo />,
};
