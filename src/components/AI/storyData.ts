/**
 * Shared Storybook fixtures for the AI component family.
 *
 * These sample objects are imported by the MCPToolCall, AIMessage, and AIChat
 * story files so the examples stay consistent across docs pages. This module is
 * intentionally NOT a `*.stories.*` file, so Storybook does not load it as a
 * story entry.
 */

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
