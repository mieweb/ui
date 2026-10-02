/**
 * Shared Storybook fixtures for the AI component family.
 *
 * These sample objects and demo drivers are imported by the MCPToolCall,
 * AIMessage, AIChat, and OzwellChat story files so the examples stay
 * consistent across docs pages. This module is intentionally NOT a
 * `*.stories.*` file, so Storybook does not load it as a story entry.
 */

import * as React from 'react';
import type { AIMessage, AISuggestedAction, MCPToolCall } from './types';

// ============================================================================
// Tool Call Fixtures
// ============================================================================

export const pendingToolCall: MCPToolCall = {
  id: '1',
  toolName: 'create_patient',
  description: 'Creating a new patient record',
  parameters: [
    { name: 'firstName', type: 'string', value: 'John' },
    { name: 'lastName', type: 'string', value: 'Smith' },
    { name: 'dateOfBirth', type: 'string', value: '1985-03-15' },
  ],
  status: 'pending',
  startedAt: new Date(),
};

export const runningToolCall: MCPToolCall = {
  ...pendingToolCall,
  id: '2',
  status: 'running',
};

export const successToolCall: MCPToolCall = {
  ...pendingToolCall,
  id: '3',
  status: 'success',
  completedAt: new Date(),
  duration: 1234,
  result: {
    type: 'link',
    data: { patientId: 'P-12345' },
    summary: 'Patient created successfully',
    link: {
      href: '/patients/P-12345',
      label: 'John Smith (P-12345)',
      type: 'patient',
    },
  },
};

export const errorToolCall: MCPToolCall = {
  ...pendingToolCall,
  id: '4',
  status: 'error',
  completedAt: new Date(),
  duration: 567,
  error: 'Patient with this identifier already exists in the system.',
};

// ============================================================================
// Conversation Fixtures
// ============================================================================

export const sampleMessages: AIMessage[] = [
  {
    id: '1',
    role: 'user',
    content: [{ type: 'text', text: 'Can you help me add a new patient?' }],
    timestamp: new Date(Date.now() - 60000),
    status: 'complete',
  },
  {
    id: '2',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "Of course! I'd be happy to help you add a new patient. What information do you have about the patient?",
      },
    ],
    timestamp: new Date(Date.now() - 55000),
    status: 'complete',
  },
  {
    id: '3',
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'John Smith, born March 15, 1985, Patient ID P-12345',
      },
    ],
    timestamp: new Date(Date.now() - 50000),
    status: 'complete',
  },
  {
    id: '4',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: "Perfect! I'll create the patient record for John Smith now.",
      },
      { type: 'tool_use', toolCall: successToolCall },
      {
        type: 'text',
        text: "Done! I've successfully created the patient record. You can click the link above to view John Smith's chart.",
      },
    ],
    timestamp: new Date(Date.now() - 45000),
    status: 'complete',
  },
];

// ============================================================================
// Suggested Action Fixtures
// ============================================================================

export const suggestedActions: AISuggestedAction[] = [
  {
    id: '1',
    label: 'Add a patient',
    prompt: 'Help me add a new patient',
    icon: 'patient',
  },
  {
    id: '2',
    label: 'Search patients',
    prompt: 'Search for a patient',
    icon: 'search',
  },
  {
    id: '3',
    label: 'Schedule appointment',
    prompt: 'Schedule an appointment',
    icon: 'appointment',
  },
  {
    id: '4',
    label: 'View documents',
    prompt: 'Show me recent documents',
    icon: 'document',
  },
];

// ============================================================================
// Streaming Response Demo Driver
// ============================================================================
// Shared by the AIChat and OzwellChat "Streaming Response" stories: a long
// answer streams in chunk by chunk so the scroll anchoring + jump-to-bottom
// behavior (AIChat's `useStickToBottom`) can be exercised by hand.

const streamedAnswer = `Here is the full visit summary — no detail spared.

Presenting concerns: the patient presented with a two-week history of intermittent palpitations, most noticeable in the evening and after caffeine. No syncope, no chest pain, no dyspnea on exertion. Symptoms are non-positional and resolve spontaneously within minutes.

History: hypertension, well controlled on lisinopril 10 mg daily. No prior arrhythmia and no structural heart disease on the last echo (2024). Family history is notable for a father with atrial fibrillation at age 62. Social history: two espressos daily, no tobacco, alcohol 2–3 drinks per week.

Examination: BP 128/82, HR 76 regular, afebrile. Cardiac exam unremarkable — no murmurs, rubs, or gallops. Lungs clear bilaterally. No peripheral edema.

Data review: the 12-lead ECG from today shows normal sinus rhythm with no ectopy. CBC from last week is within normal limits. TSH is 2.1 mIU/L (normal). Potassium today is 4.6 mmol/L.

Assessment: palpitations, most consistent with benign premature beats provoked by caffeine. Low suspicion for sustained arrhythmia given the normal ECG, normal thyroid function, and absence of red-flag features. The family history of AF warrants a documented rhythm before fully closing the loop.

Plan: a 14-day ambulatory rhythm monitor to capture a symptomatic episode; a trial of caffeine reduction (one espresso daily) with a symptom diary; continue lisinopril unchanged and recheck BP at follow-up; return precautions reviewed — syncope, chest pain, or sustained rapid palpitations prompt urgent evaluation; follow-up visit in three weeks to review the monitor data.

The rhythm monitor referral has been queued and the symptom diary template added to the patient portal. All of today's findings are documented in the encounter note.`;

/** Word-sized chunks so the stream reads naturally. */
const streamChunks = streamedAnswer.match(/[^ ]+( |$)/g) ?? [streamedAnswer];

export interface StreamingChatDemo {
  messages: AIMessage[];
  isGenerating: boolean;
  /** Append a user message and trigger another long streamed answer. */
  sendMessage: (text: string) => void;
}

/**
 * Drives a fake token stream: seeds a short exchange, streams the long answer
 * in word-sized ticks shortly after mount, lands a trailing follow-up message
 * (for the "New messages" jump-to-bottom hint), and streams again on every
 * {@link StreamingChatDemo.sendMessage}. A send during an active stream
 * finalizes the in-flight reply and starts a replacement.
 */
export function useStreamingChatDemo(): StreamingChatDemo {
  const [messages, setMessages] = React.useState<AIMessage[]>([
    {
      id: 'seed-1',
      role: 'assistant',
      status: 'complete',
      timestamp: new Date(),
      content: [
        {
          type: 'text',
          text: 'The encounter note is ready for review. Want the highlights or the full summary?',
        },
      ],
    },
    {
      id: 'seed-2',
      role: 'user',
      status: 'complete',
      timestamp: new Date(),
      content: [
        {
          type: 'text',
          text: 'Give me the full summary — don’t spare any detail.',
        },
      ],
    },
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const intervalRef = React.useRef<number | undefined>(undefined);
  /** Delayed stream starts queued by sendMessage — each runs in turn. */
  const pendingStartsRef = React.useRef<number[]>([]);
  /** Trailing follow-up timer — cancelled when a replacement stream starts. */
  const followUpRef = React.useRef<number | undefined>(undefined);
  /** Monotonic id source — Date.now() can collide when timers fire in one tick. */
  const idRef = React.useRef(0);

  const streamResponse = React.useCallback(() => {
    // Replacement policy: a new stream cancels the one in flight — stop its
    // ticker, drop its trailing follow-up, and finalize the partial bubble so
    // it can't be orphaned in `status: 'streaming'`. Stream starts queued by
    // sendMessage are left alone so every send still gets a reply.
    window.clearInterval(intervalRef.current);
    window.clearTimeout(followUpRef.current);
    const messageId = `stream-${++idRef.current}`;
    // Seed the first chunk synchronously so a reply is never empty: a
    // replacement arriving before the first tick finalizes a visible
    // partial instead of leaving nothing behind for that send.
    let cursor = Math.min(4, streamChunks.length);
    setIsGenerating(true);
    setMessages((prev) => [
      // Finalize the interrupted reply.
      ...prev.map((m) =>
        m.status === 'streaming' ? { ...m, status: 'complete' as const } : m
      ),
      {
        id: messageId,
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date(),
        content: [
          { type: 'text', text: streamChunks.slice(0, cursor).join('') },
        ],
      },
    ]);
    intervalRef.current = window.setInterval(() => {
      // A few words per tick ≈ token streaming.
      cursor = Math.min(cursor + 4, streamChunks.length);
      const done = cursor >= streamChunks.length;
      const text = streamChunks.slice(0, cursor).join('');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: [{ type: 'text' as const, text }],
                status: done ? ('complete' as const) : ('streaming' as const),
              }
            : m
        )
      );
      if (done) {
        window.clearInterval(intervalRef.current);
        setIsGenerating(false);
        // A trailing message a beat later — scrolled-up users get the
        // "New messages" hint on the jump-to-bottom button.
        followUpRef.current = window.setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `after-${++idRef.current}`,
              role: 'assistant',
              status: 'complete',
              timestamp: new Date(),
              content: [
                {
                  type: 'text',
                  text: 'Anything else you’d like me to pull from the chart?',
                },
              ],
            },
          ]);
        }, 1200);
      }
    }, 120);
  }, []);

  // Kick off the demo stream shortly after mount; clean up on unmount.
  React.useEffect(() => {
    const kickoff = window.setTimeout(streamResponse, 800);
    const pendingStarts = pendingStartsRef.current;
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(intervalRef.current);
      window.clearTimeout(followUpRef.current);
      pendingStarts.forEach((t) => window.clearTimeout(t));
    };
  }, [streamResponse]);

  const sendMessage = React.useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${++idRef.current}`,
          role: 'user',
          status: 'complete',
          timestamp: new Date(),
          content: [{ type: 'text', text }],
        },
      ]);
      // Every send triggers another long streamed answer.
      pendingStartsRef.current.push(window.setTimeout(streamResponse, 600));
    },
    [streamResponse]
  );

  return { messages, isGenerating, sendMessage };
}
