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
import { markdownShowcaseConversation } from './storyData';
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
        const files = meta.attachments
          .filter((att) => !att.type.startsWith('image/'))
          .map((att) => `📎 ${att.name}`)
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
