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
} from './plugins';
import type { SuperChatConversation } from './index';
import { conversation, richConversation, registry } from './storyData';
import 'katex/dist/katex.min.css';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChat> = {
  title: 'Product/Feature Modules/SuperChat/SuperChat (Panel)',
  component: SuperChat,
  tags: ['autodocs'],
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
    onConversationClosed: { control: false, table: { category: 'Callbacks' } },
    onReferenceClick: { control: false, table: { category: 'Callbacks' } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          '`SuperChat` is the **single-conversation panel**: header (title + participants + optional',
          'close), a `role="log"` message thread, and the compose box. It renders exactly one',
          '`conversation` — the host owns its state.',
          '',
          'For a conversation list use `SuperChatConversations`; for the combined inbox (list + panel)',
          'use `SuperChatInbox`.',
          '',
          'Use the **Playground** story with the Controls panel to toggle `readOnly`, `trustedContent`,',
          'and the current participant.',
          '',
          '### Rich Markdown',
          'Message text renders through a pluggable Markdown pipeline (`createMarkdownRenderer`). The base',
          'ships Markdown core (GFM) with sanitization of untrusted output. Opt into `code`, `math`,',
          '`genui`, `mermaid`, `image`, and `nitro-table` plugins from',
          '`@mieweb/ui/components/SuperChat/plugins`.',
        ].join('\n'),
      },
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

  const appendMessage = (
    message: SuperChatConversation['thread'][number]
  ) => {
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
      onMessageSent={(text, meta) => {
        appendMessage({
          id: `m-${Date.now()}`,
          participantId: props.currentParticipantId ?? 'u1',
          text,
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
// Stories
// ============================================================================

export const Playground: Story = {
  args: {
    currentParticipantId: 'u1',
    readOnly: false,
    trustedContent: false,
  },
  render: (args) => (
    <div style={{ height: '90vh', display: 'flex' }}>
      <InteractivePanel
        {...args}
        initial={conversation}
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

export const MarkdownCore: Story = {
  render: () => (
    <div style={{ height: '90vh', display: 'flex' }}>
      <InteractivePanel
        initial={conversation}
        currentParticipantId="u1"
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

export const WithRichPlugins: Story = {
  render: () => (
    <div style={{ height: '90vh', display: 'flex' }}>
      <InteractivePanel
        initial={richConversation}
        currentParticipantId="u1"
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
          createMermaidPlugin(),
          createImagePlugin(),
          createNitroTablePlugin(),
        ]}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div style={{ height: '90vh', display: 'flex' }}>
      <SuperChat
        conversation={richConversation}
        currentParticipantId="u1"
        readOnly
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
          createMermaidPlugin(),
          createImagePlugin(),
          createNitroTablePlugin(),
        ]}
      />
    </div>
  ),
};

export const Closable: Story = {
  render: () => (
    <div style={{ height: '90vh', display: 'flex' }}>
      <SuperChat
        conversation={conversation}
        currentParticipantId="u1"
        onConversationClosed={(c) => console.log('closed', c.id)}
      />
    </div>
  ),
};
