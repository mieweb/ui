import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  AIMessageDisplay,
  type AIMessage,
  type AIRenderTextContent,
} from './index';
import { successToolCall } from './storyData';
import { getSampleAudio } from '../AudioPlayer/sampleAudio';

// ============================================================================
// AI Message Stories
// ============================================================================

const meta: Meta<typeof AIMessageDisplay> = {
  title: 'Product/Feature Modules/AI/AIMessage',
  component: AIMessageDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '`AIMessageDisplay` renders a single message in an AI conversation. A message is made up of',
          'one or more **content blocks**, so a single assistant turn can interleave prose, tool calls,',
          'reasoning, and code:',
          '',
          '| Block type | Renders as |',
          '| ---------- | ---------- |',
          '| `text` | Prose (optionally via a custom `renderTextContent` renderer) |',
          '| `tool_use` | An embedded `MCPToolCallDisplay` |',
          '| `thinking` | A collapsible "Thinking…" reasoning panel |',
          '| `code` | A syntax-styled code block |',
          '| `image` | A clickable image thumbnail |',
          '| `file` | A document card with icon, filename & size |',
          '| `audio` | An inline waveform `AudioPlayer` for recorded clips |',
          '',
          '### Rich content: Markdown, images & Mermaid',
          'Text blocks are plain text by default. To render **Markdown, images, or Mermaid diagrams**,',
          'supply a `renderTextContent` render-prop and plug in your own renderer (e.g. `react-markdown`).',
          'The host owns rendering so it can also own **sanitization** of untrusted model output.',
          'See the _With Custom Markdown Renderer_ story for the contract.',
          '',
          '### Streaming',
          'Set the message `status` to `streaming` to show the animated typing indicator while tokens arrive.',
        ].join('\n'),
      },
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

/** A collapsible reasoning ("thinking") block ahead of the final answer. */
export const ThinkingBlock: Story = {
  render: () => {
    const message: AIMessage = {
      id: '5',
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
