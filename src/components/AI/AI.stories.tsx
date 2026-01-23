import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  AIChat,
  AIMessageDisplay,
  MCPToolCallDisplay,
  FloatingAIChat,
  AIChatTrigger,
  type AIMessage,
  type MCPToolCall,
  type AISuggestedAction,
} from './index';

// ============================================================================
// MCP Tool Call Stories
// ============================================================================

const meta: Meta<typeof MCPToolCallDisplay> = {
  title: 'Components/AI/MCPToolCall',
  component: MCPToolCallDisplay,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MCPToolCallDisplay>;

const pendingToolCall: MCPToolCall = {
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

const runningToolCall: MCPToolCall = {
  ...pendingToolCall,
  id: '2',
  status: 'running',
};

const successToolCall: MCPToolCall = {
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

const errorToolCall: MCPToolCall = {
  ...pendingToolCall,
  id: '4',
  status: 'error',
  completedAt: new Date(),
  duration: 567,
  error: 'Patient with this SSN already exists in the system.',
};

export const Pending: Story = {
  args: {
    toolCall: pendingToolCall,
  },
};

export const Running: Story = {
  args: {
    toolCall: runningToolCall,
  },
};

export const Success: Story = {
  args: {
    toolCall: successToolCall,
    defaultCollapsed: false,
  },
};

export const Error: Story = {
  args: {
    toolCall: errorToolCall,
    defaultCollapsed: false,
  },
};

export const Compact: Story = {
  args: {
    toolCall: successToolCall,
    compact: true,
    collapsible: false,
  },
};

// ============================================================================
// AI Message Stories
// ============================================================================

// Note: AIMessageDisplay has its own meta but we keep stories in one file for organization
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MessageMeta: Meta<typeof AIMessageDisplay> = {
  title: 'Components/AI/AIMessage',
  component: AIMessageDisplay,
  parameters: {
    layout: 'padded',
  },
};

export const UserMessage: StoryObj<typeof AIMessageDisplay> = {
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

export const AssistantMessage: StoryObj<typeof AIMessageDisplay> = {
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

export const MessageWithToolCall: StoryObj<typeof AIMessageDisplay> = {
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

export const StreamingMessage: StoryObj<typeof AIMessageDisplay> = {
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

export const ThinkingBlock: StoryObj<typeof AIMessageDisplay> = {
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

// ============================================================================
// AI Chat Stories
// ============================================================================

// Note: AIChat has its own meta but we keep stories in one file for organization
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ChatMeta: Meta<typeof AIChat> = {
  title: 'Components/AI/AIChat',
  component: AIChat,
  parameters: {
    layout: 'fullscreen',
  },
};

const sampleMessages: AIMessage[] = [
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
        text: 'John Smith, born March 15, 1985, SSN 123-45-6789',
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

const suggestedActions: AISuggestedAction[] = [
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

export const EmptyChat: StoryObj<typeof AIChat> = {
  render: () => (
    <div className="h-[600px]">
      <AIChat
        messages={[]}
        suggestions={suggestedActions}
        height="100%"
        onSendMessage={(msg) => console.log('Send:', msg)}
      />
    </div>
  ),
};

export const ChatWithMessages: StoryObj<typeof AIChat> = {
  render: () => (
    <div className="h-[600px]">
      <AIChat
        messages={sampleMessages}
        suggestions={suggestedActions}
        height="100%"
        userName="Dr. Jane"
        onSendMessage={(msg) => console.log('Send:', msg)}
        onResourceClick={(link) => console.log('Link clicked:', link)}
        onClear={() => console.log('Clear chat')}
      />
    </div>
  ),
};

export const GeneratingResponse: StoryObj<typeof AIChat> = {
  render: () => {
    const messages: AIMessage[] = [
      ...sampleMessages.slice(0, 3),
      {
        id: '5',
        role: 'assistant',
        content: [],
        timestamp: new Date(),
        status: 'streaming',
      },
    ];
    return (
      <div className="h-[600px]">
        <AIChat
          messages={messages}
          isGenerating={true}
          height="100%"
          onSendMessage={(msg) => console.log('Send:', msg)}
          onCancel={() => console.log('Cancel generation')}
        />
      </div>
    );
  },
};

// ============================================================================
// Floating Chat Stories
// ============================================================================

function FloatingChatButtonDemo() {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative h-[400px] bg-neutral-100 p-4 dark:bg-neutral-800">
      <p className="text-neutral-600 dark:text-neutral-400">
        Click the AI button in the corner to open the chat.
      </p>
      <AIChatTrigger
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        pulse={true}
      />
    </div>
  );
}

export const FloatingChatButton: StoryObj<typeof AIChatTrigger> = {
  render: () => <FloatingChatButtonDemo />,
};

export const FloatingChatComplete: StoryObj<typeof FloatingAIChat> = {
  render: () => (
    <div className="relative h-[700px] bg-neutral-100 p-4 dark:bg-neutral-800">
      <p className="text-neutral-600 dark:text-neutral-400">
        Click the AI button in the corner to open the chat.
      </p>
      <FloatingAIChat
        messages={sampleMessages}
        suggestions={suggestedActions}
        userName="Dr. Jane"
        pulse={true}
        onSendMessage={(msg) => console.log('Send:', msg)}
        onResourceClick={(link) => console.log('Link clicked:', link)}
        onClear={() => console.log('Clear chat')}
      />
    </div>
  ),
};
