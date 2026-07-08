import * as React from 'react';
import type {
  GenUIRegistry,
  GenUIWidgetProps,
  SuperChatConversation,
} from './index';

// ============================================================================
// Sample participants
// ============================================================================

export const participants = {
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

// ============================================================================
// Sample conversations
// ============================================================================

export const conversation: SuperChatConversation = {
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
export const richConversation: SuperChatConversation = {
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

// A small second conversation so the list/inbox stories show more than one row.
export const secondConversation: SuperChatConversation = {
  id: 'c2',
  title: 'Patient 1207 — Follow-up',
  reference_id: 'patient/1207',
  unread: 3,
  lastActivity: '2026-06-07T10:15:00Z',
  participants: [participants.me, participants.triage, participants.system],
  thread: [
    {
      id: 'n1',
      participantId: 'a1',
      text: 'Labs are back — potassium is slightly elevated at 5.3.',
      time: '2026-06-07T10:15:00Z',
    },
  ],
};

export const conversations: SuperChatConversation[] = [
  conversation,
  secondConversation,
];

// A single-message thread that exercises every core/GFM markdown element, so
// the renderer's styling (headings, lists, tables, quotes, code, …) can be
// inspected and tested in one place. No plugins required.
export const markdownShowcaseConversation: SuperChatConversation = {
  id: 'c-md',
  title: 'Markdown rendering showcase',
  unread: 0,
  participants: [participants.me, participants.triage, participants.system],
  thread: [
    {
      id: 'md0',
      type: 'system',
      participantId: 's1',
      text: 'Demonstrating every markdown element below.',
      time: '2026-06-07T09:00:00Z',
    },
    {
      id: 'md1',
      participantId: 'a1',
      text: [
        '# Heading 1',
        '## Heading 2',
        '### Heading 3',
        '#### Heading 4',
        '##### Heading 5',
        '###### Heading 6',
        '',
        'A paragraph with **bold**, _italic_, ***bold italic***, ~~strikethrough~~,',
        'and `inline code`. Here is a [link](https://example.com).',
        '',
        'A second paragraph with a hard break here →',
        'and the text continues on the next line.',
        '',
        '> A blockquote with a **bold** word.',
        '>',
        '> Second line of the quote.',
        '',
        '## Unordered list',
        '',
        '- First item',
        '- Second item',
        '  - Nested item',
        '- Third item',
        '',
        '## Ordered list',
        '',
        '1. Step one',
        '2. Step two',
        '3. Step three',
        '',
        '## Task list',
        '',
        '- [x] Done',
        '- [ ] Not done',
        '',
        '## Code block',
        '',
        '```js',
        'const greet = (name) => `Hello, ${name}!`;',
        "console.log(greet('world'));",
        '```',
        '',
        '## Table',
        '',
        '| Code | Description | Modifier |',
        '| --- | --- | --- |',
        '| 93000 | ECG, complete | — |',
        '| 93010 | ECG, interpretation | 26 |',
        '',
        '---',
        '',
        'Text after a horizontal rule.',
      ].join('\n'),
      time: '2026-06-07T09:01:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Sample host-registered GenUI widget (lazy, inline for the stories).
// ---------------------------------------------------------------------------

export function KpiCard({
  data,
}: GenUIWidgetProps<{ label: string; value: string; trend?: string }>) {
  return (
    <div className="my-1 inline-flex flex-col rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
      <span className="text-xs text-neutral-500">{data.label}</span>
      <span className="text-xl font-semibold text-neutral-900 dark:text-white">
        {data.value}
      </span>
      {data.trend && (
        <span className="text-xs text-green-700 dark:text-green-400">{data.trend}</span>
      )}
    </div>
  );
}

export const registry: GenUIRegistry = {
  kpi_card: {
    component: () =>
      Promise.resolve({
        default: KpiCard as React.ComponentType<GenUIWidgetProps>,
      }),
    prefetch: 'eager',
  },
};
