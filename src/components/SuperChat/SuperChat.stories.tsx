import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChat, createMarkdownRenderer } from './index';
import {
  createCodePlugin,
  createMathPlugin,
  createGenUIPlugin,
  createMermaidPlugin,
  createImagePlugin,
  createNitroTablePlugin,
} from './plugins';
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
  me: {
    id: 'u1',
    kind: 'human' as const,
    name: 'Dr. Alice Reyes',
    role: 'Provider',
    color: '#0e7490',
  },
  nurse: {
    id: 'u2',
    kind: 'human' as const,
    name: 'Sam Carter',
    role: 'Nurse',
    color: '#9333ea',
  },
  triage: {
    id: 'a1',
    kind: 'agent' as const,
    name: 'Triage Agent',
    color: '#2563eb',
  },
  coder: {
    id: 'a2',
    kind: 'agent' as const,
    name: 'Coding Agent',
    color: '#16a34a',
  },
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
        'console.log(`CPT ${code}: ECG, complete`);',
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

// A richer thread that also exercises the mermaid, NITRO-table, and image
// plugins (used by the WithRichPlugins / ReadOnly stories).
const richConversation: SuperChatConversation = {
  ...conversation,
  id: 'c1-rich',
  thread: [
    ...conversation.thread,
    {
      id: 'm8',
      participantId: 'a1',
      text: [
        'Proposed triage flow:',
        '',
        '```mermaid',
        'graph TD',
        '  A[Intake] --> B{Chest pain?}',
        '  B -- Yes --> C[Order ECG]',
        '  B -- No --> D[Routine review]',
        '  C --> E[Provider review]',
        '```',
      ].join('\n'),
      time: '2026-06-07T09:05:00Z',
    },
    {
      id: 'm9',
      participantId: 'a2',
      text: [
        'Candidate codes:',
        '',
        '| Code | Description | Modifier |',
        '| --- | --- | --- |',
        '| 93000 | ECG, complete | — |',
        '| 93005 | ECG, tracing only | TC |',
        '| 93010 | ECG, interpretation | 26 |',
      ].join('\n'),
      time: '2026-06-07T09:05:30Z',
    },
    {
      id: 'm10',
      participantId: 'u2',
      text: [
        'Here is the rhythm strip — click to enlarge:',
        '',
        '![12-lead ECG rhythm strip](https://placehold.co/640x320/png?text=ECG+rhythm+strip)',
      ].join('\n'),
      time: '2026-06-07T09:06:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Sample host-registered GenUI widget (lazy, inline for the story).
// ---------------------------------------------------------------------------

function KpiCard({
  data,
}: GenUIWidgetProps<{ label: string; value: string; trend?: string }>) {
  return (
    <div className="my-1 inline-flex flex-col rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      <span className="text-xs text-neutral-500">{data.label}</span>
      <span className="text-xl font-semibold text-neutral-900 dark:text-white">
        {data.value}
      </span>
      {data.trend && (
        <span className="text-xs text-green-600">{data.trend}</span>
      )}
    </div>
  );
}

const registry: GenUIRegistry = {
  kpi_card: {
    component: () =>
      Promise.resolve({
        default: KpiCard as React.ComponentType<GenUIWidgetProps>,
      }),
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
          'ships Markdown core (GFM) with sanitization of untrusted output. Opt into `code`, `math`,',
          '`genui`, `mermaid`, `image` (click-to-zoom lightbox), and `nitro-table` plugins from',
          '`@mieweb/ui/components/SuperChat/plugins`.',
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

  const appendMessage = (
    conversationId: string,
    message: SuperChatConversation['thread'][number]
  ) => {
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
        initial={[richConversation]}
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
    <div style={{ height: '90vh' }}>
      <SuperChat
        conversations={[richConversation]}
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

// ============================================================================
// Sources & Guards
// ============================================================================
// Documents, per visual, the exact Markdown *source* that produces it and the
// *guard* (trust boundary) that keeps untrusted model/agent output safe. The
// rendered column uses the real production renderer (`createMarkdownRenderer`)
// with every plugin enabled, so source → guard → output stays in sync with the
// code.

interface FeatureDemo {
  /** Plugin / feature name. */
  name: string;
  /** Raw Markdown exactly as it arrives in a message. */
  source: string;
  /** Where the guard lives + what it enforces. */
  guard: string;
}

const FEATURES: FeatureDemo[] = [
  {
    name: 'Markdown core (GFM)',
    source: [
      '**Chief complaint:** chest tightness on exertion',
      '',
      '- Duration: 3 days',
      '- Risk: family history of CAD',
      '',
      '> Recommend prioritizing an ECG.',
      '',
      '[ECG protocol](https://example.org/ecg)',
    ].join('\n'),
    guard:
      'rehype-sanitize allow-list (createMarkdownRenderer.tsx) strips scripts/unknown tags from untrusted output; links are forced to target="_blank" rel="noopener noreferrer".',
  },
  {
    name: 'code',
    source: [
      '```javascript',
      "const code = '93000';",
      'console.log(code);',
      '```',
    ].join('\n'),
    guard:
      'rehype-highlight emits .hljs-* token classes that the base schema explicitly allow-lists on code/pre/span; sanitize runs AFTER highlight so only those classes survive. Copy uses navigator.clipboard.',
  },
  {
    name: 'math (KaTeX)',
    source: [
      '$$ risk = \\beta_0 + \\beta_1 x + \\beta_2 x^2 $$',
      '',
      'Inline: $x > 0.7$.',
    ].join('\n'),
    guard:
      "math.tsx allow-lists KaTeX's HTML+MathML tags/attributes so its output survives sanitize; rehype-katex runs with throwOnError:false (malformed math degrades, never throws).",
  },
  {
    name: 'genui',
    source: [
      '```genui',
      '{ "widget": "kpi_card", "version": 1, "props": { "label": "Risk", "value": "High", "trend": "+12%" } }',
      '```',
    ].join('\n'),
    guard:
      'Widgets are host-registered, lazy, and schema-validated; the rehype transform allow-lists only the <genui-widget> tag. Unknown/invalid widgets degrade to an inert code block; mount + data fetch are gated on streaming.',
  },
  {
    name: 'mermaid',
    source: [
      '```mermaid',
      'graph TD',
      '  A[Intake] --> B{Chest pain?}',
      '  B -- Yes --> C[Order ECG]',
      '  B -- No --> D[Routine review]',
      '```',
    ].join('\n'),
    guard:
      "mermaid.tsx loads mermaid lazily and renders with securityLevel:'strict' (labels sanitized, scripts stripped). The SVG bypasses rehype-sanitize, so strict mode IS the trust boundary; rendering is gated on streaming.",
  },
  {
    name: 'image (lightbox)',
    source:
      '![12-lead ECG rhythm strip](https://placehold.co/640x320/png?text=ECG+rhythm+strip)',
    guard:
      'The image src/alt are already protocol-restricted by rehype-sanitize; image.tsx only adds the zoom affordance and portals the LightboxModal to document.body.',
  },
  {
    name: 'nitro-table',
    source: [
      '| Code | Description | Modifier |',
      '| --- | --- | --- |',
      '| 93000 | ECG, complete | — |',
      '| 93005 | ECG, tracing only | TC |',
    ].join('\n'),
    guard:
      'nitroTable.tsx lazy-loads the DataVis grid only when a table appears; a GridErrorBoundary degrades to the themed HTML table if datavis is unavailable or the grid throws.',
  },
];

const sourcesAndGuardsRenderer = createMarkdownRenderer({
  plugins: [
    createCodePlugin(),
    createMathPlugin(),
    createGenUIPlugin(registry),
    createMermaidPlugin(),
    createImagePlugin(),
    createNitroTablePlugin(),
  ],
});

function SourcesAndGuardsDemo() {
  return (
    <div className="space-y-6 p-6 text-neutral-900 dark:text-neutral-100">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">
          SuperChat — Sources &amp; Guards
        </h2>
        <p className="max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Each visual below is produced from the raw Markdown{' '}
          <strong>source</strong> and protected by the <strong>guard</strong>{' '}
          noted underneath. The rendered column uses the production
          <code> createMarkdownRenderer</code> with every plugin enabled.
        </p>
      </header>

      {FEATURES.map((f) => (
        <section
          key={f.name}
          className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
        >
          <h3 className="text-primary-700 dark:text-primary-300 mb-3 text-sm font-semibold tracking-wide">
            {f.name}
          </h3>

          <div className="mb-1 text-xs font-medium text-neutral-500 uppercase">
            Source
          </div>
          <pre className="mb-3 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs whitespace-pre-wrap text-neutral-100 **:wrap-break-word dark:bg-neutral-950">
            <code>{f.source}</code>
          </pre>

          <div className="mb-1 text-xs font-medium text-neutral-500 uppercase">
            Rendered
          </div>
          <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {sourcesAndGuardsRenderer(f.source, {
              messageId: `sg-${f.name}`,
              streaming: false,
              role: 'assistant',
            })}
          </div>

          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Guard:</strong> {f.guard}
          </p>
        </section>
      ))}
    </div>
  );
}

export const SourcesAndGuards: Story = {
  name: 'Sources & Guards',
  parameters: {
    docs: {
      description: {
        story:
          'Per-feature documentation of the Markdown **source** that generates each visual and the ' +
          '**guard** (trust boundary) that sanitizes untrusted model/agent output. Useful for ' +
          'security review: it shows exactly where each plugin opens the allow-list and how it ' +
          'degrades.',
      },
    },
  },
  render: () => <SourcesAndGuardsDemo />,
};
