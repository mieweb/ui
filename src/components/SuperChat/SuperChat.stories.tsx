import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChat } from './index';
import { createCodePlugin, createMathPlugin, createGenUIPlugin } from './plugins';
import type {
  GenUIRegistry,
  GenUIWidgetProps,
  SuperChatConversation,
} from './index';
import 'katex/dist/katex.min.css';

// ============================================================================
// Sample data
// ============================================================================

const participants = {
  me: { id: 'u1', kind: 'human' as const, name: 'Dr. Alice Reyes', role: 'Provider', color: '#0e7490' },
  nurse: { id: 'u2', kind: 'human' as const, name: 'Sam Carter', role: 'Nurse', color: '#9333ea' },
  triage: { id: 'a1', kind: 'agent' as const, name: 'Triage Agent', color: '#2563eb' },
  coder: { id: 'a2', kind: 'agent' as const, name: 'Coding Agent', color: '#16a34a' },
  system: { id: 's1', kind: 'system' as const, name: 'System' },
};

const conversation: SuperChatConversation = {
  id: 'c1',
  title: 'Patient 4821 — Intake review',
  reference_id: 'patient/4821',
  unread: 0,
  participants: Object.values(participants),
  thread: [
    {
      id: 'm0',
      type: 'system',
      participantId: 's1',
      text: 'Triage Agent and Coding Agent joined the conversation.',
      time: '2026-06-07T09:00:00Z',
    },
    {
      id: 'm1',
      participantId: 'u1',
      text: '@Triage can you summarize the **chief complaint** and flag anything urgent?',
      mentions: ['a1'],
      time: '2026-06-07T09:01:00Z',
    },
    {
      id: 'm2',
      participantId: 'a1',
      text: [
        'Summary of the intake:',
        '',
        '- **Chief complaint:** chest tightness on exertion',
        '- **Duration:** 3 days',
        '- **Risk flags:** family history of CAD',
        '',
        '> Recommend prioritizing an ECG.',
      ].join('\n'),
      time: '2026-06-07T09:01:30Z',
    },
    {
      id: 'm3',
      participantId: 'u2',
      text: 'Thanks. @Coding what CPT applies to a 12-lead ECG with interpretation?',
      mentions: ['a2'],
      time: '2026-06-07T09:02:00Z',
    },
    {
      id: 'm4',
      participantId: 'a2',
      text: [
        'For a 12-lead ECG with interpretation and report, use **93000**.',
        '',
        '```javascript',
        "const code = '93000';",
        "console.log(`CPT ${code}: ECG, complete`);",
        '```',
      ].join('\n'),
      time: '2026-06-07T09:02:30Z',
    },
    {
      id: 'm5',
      participantId: 'a1',
      text: [
        'Risk score uses the standard quadratic term:',
        '',
        '$$ risk = \\beta_0 + \\beta_1 x + \\beta_2 x^2 $$',
        '',
        'Inline too: the threshold is $x > 0.7$.',
      ].join('\n'),
      time: '2026-06-07T09:03:00Z',
    },
    {
      id: 'm6',
      participantId: 'a2',
      text: [
        'Here is an interactive widget:',
        '',
        '```genui',
        '{ "widget": "kpi_card", "version": 1, "prefetch": "eager", "props": { "label": "Risk", "value": "High", "trend": "+12%" } }',
        '```',
      ].join('\n'),
      time: '2026-06-07T09:03:30Z',
    },
    {
      id: 'm7',
      type: 'ref',
      participantId: 'a1',
      ref: { refType: 'doc', refId: 'doc-991', title: 'ECG protocol (PDF)' },
      time: '2026-06-07T09:04:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Sample host-registered GenUI widget (lazy, inline for the story).
// ---------------------------------------------------------------------------

function KpiCard({ data }: GenUIWidgetProps<{ label: string; value: string; trend?: string }>) {
  return (
    <div className="my-1 inline-flex flex-col rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      <span className="text-xs text-neutral-500">{data.label}</span>
      <span className="text-xl font-semibold text-neutral-900 dark:text-white">{data.value}</span>
      {data.trend && <span className="text-xs text-green-600">{data.trend}</span>}
    </div>
  );
}

const registry: GenUIRegistry = {
  kpi_card: {
    component: () => Promise.resolve({ default: KpiCard as React.ComponentType<GenUIWidgetProps> }),
    prefetch: 'eager',
  },
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChat> = {
  title: 'Product/Feature Modules/SuperChat/SuperChat',
  component: SuperChat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          '`SuperChat` is a native, multi-participant chat surface: any mix of multiple **AI agents**',
          'and multiple **humans** in one conversation. It preserves the `chat-component` API shape',
          '(conversation/thread, sidebar, compose, read-only, `linkBuilder`, callbacks) and generalizes',
          'roles into a **participant** model.',
          '',
          '### Rich Markdown',
          'Message text renders through a pluggable Markdown pipeline (`createMarkdownRenderer`). The base',
          'ships Markdown core (GFM) with sanitization of untrusted output. Opt into `code`, `math`, and',
          '`genui` plugins from `@mieweb/ui/components/SuperChat/plugins`.',
          '',
          '### Participant cues',
          'Concurrent / interleaved agent replies stay legible via per-participant `color`, avatar, and name.',
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
// shows the expected host wiring: append the sent message to the active
// conversation's thread, and simulate a reply from any @-mentioned agent.

function InteractiveSuperChat(
  props: Omit<React.ComponentProps<typeof SuperChat>, 'conversations'> & {
    initial: SuperChatConversation[];
  }
) {
  const { initial, ...rest } = props;
  const [conversations, setConversations] = React.useState(initial);

  const appendMessage = (conversationId: string, message: SuperChatConversation['thread'][number]) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, thread: [...c.thread, message], lastActivity: message.time }
          : c
      )
    );
  };

  return (
    <SuperChat
      {...rest}
      conversations={conversations}
      onMessageSent={(text, meta) => {
        const now = new Date().toISOString();
        appendMessage(meta.conversation.id, {
          id: `m-${Date.now()}`,
          participantId: props.currentParticipantId ?? 'u1',
          text,
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

export const MarkdownCore: Story = {
  render: () => (
    <div style={{ height: '90vh' }}>
      <InteractiveSuperChat
        initial={[conversation]}
        currentParticipantId="u1"
        onConversationOpened={(c) => console.log('opened', c.id)}
        onReferenceClick={(ref) => console.log('ref', ref)}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

export const WithRichPlugins: Story = {
  render: () => (
    <div style={{ height: '90vh' }}>
      <InteractiveSuperChat
        initial={[conversation]}
        currentParticipantId="u1"
        renderPlugins={[
          createCodePlugin(),
          createMathPlugin(),
          createGenUIPlugin(registry),
        ]}
        linkBuilder={(ref) => `#/${ref.refType}/${ref.refId}`}
      />
    </div>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <div style={{ height: '90vh' }}>
      <SuperChat
        conversations={[conversation]}
        currentParticipantId="u1"
        readOnly
        renderPlugins={[createCodePlugin(), createMathPlugin(), createGenUIPlugin(registry)]}
      />
    </div>
  ),
};
