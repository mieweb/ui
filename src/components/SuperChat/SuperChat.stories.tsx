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
          '`SuperChat` is the **single-conversation panel**: header (title + participants +',
          'optional close), a `role="log"` message thread, and the compose box. It renders',
          'exactly one `conversation` — the host owns its state.',
          '',
          'See **SuperChat › Overview** for the full consumer guide (install, props, plugins,',
          'accessibility). For the list use `SuperChatConversations`; for the combined inbox',
          'use `SuperChatInbox`.',
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
        ]}
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
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
