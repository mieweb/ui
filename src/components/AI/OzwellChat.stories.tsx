import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MarkdownRenderer } from '../Markdown';
import type { AIMessage, AIRenderTextContent, MCPToolCall } from './types';
import {
  OzwellChat,
  type OzwellModelOption,
  type OzwellModelValue,
  type OzwellThinkingMode,
} from './OzwellChatView';

const models: OzwellModelOption[] = [
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5-mini',
    label: 'GPT-5 mini',
  },
  {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    model: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
  },
];

const welcome: AIMessage = {
  id: 'welcome',
  role: 'assistant',
  status: 'complete',
  timestamp: new Date(),
  content: [{ type: 'text', text: 'Welcome. How can I help?' }],
};

const toolCall: MCPToolCall = {
  id: 'tool-1',
  toolName: 'patient_lookup',
  description: 'Finds a patient by name.',
  parameters: [{ name: 'name', type: 'string', value: 'Alex Morgan' }],
  status: 'success',
  startedAt: new Date(),
  completedAt: new Date(),
  result: {
    type: 'json',
    summary: 'Found one matching patient.',
    data: { id: 'patient-42', name: 'Alex Morgan' },
  },
};

type StoryState = 'welcome' | 'streaming' | 'tool-result' | 'queued';

type OzwellChatStoryArgs = {
  state: StoryState;
  thinkingEnabled: boolean;
  thinkingMode: OzwellThinkingMode;
  showModels: boolean;
  warning?: string;
  onSendMessage: (message: string) => void;
  onThinkingModeChange: (mode: OzwellThinkingMode) => void;
  onModelChange: (model: OzwellModelValue) => void;
  onDismissWarning: () => void;
};

function messagesFor(state: StoryState): AIMessage[] {
  if (state === 'streaming') {
    return [
      welcome,
      {
        id: 'user-1',
        role: 'user',
        status: 'complete',
        timestamp: new Date(),
        content: [{ type: 'text', text: 'Summarize the latest visit.' }],
      },
      {
        id: 'assistant-streaming',
        role: 'assistant',
        status: 'streaming',
        timestamp: new Date(),
        content: [{ type: 'thinking', text: 'Reviewing the visit record…' }],
      },
    ];
  }

  if (state === 'tool-result') {
    return [
      welcome,
      {
        id: 'tool-1',
        role: 'tool',
        status: 'complete',
        timestamp: new Date(),
        content: [{ type: 'tool_use', toolCall }],
      },
    ];
  }

  if (state === 'queued') {
    return [
      welcome,
      ...['First question', 'Second question', 'Third question'].map(
        (text, index) => ({
          id: `user-${index}`,
          role: 'user' as const,
          status: 'complete' as const,
          timestamp: new Date(),
          content: [{ type: 'text' as const, text }],
        })
      ),
    ];
  }

  return [welcome];
}

function OzwellChatStoryDemo({
  state,
  thinkingEnabled,
  thinkingMode: initialThinkingMode,
  showModels,
  warning,
  onSendMessage,
  onThinkingModeChange,
  onModelChange,
  onDismissWarning,
}: OzwellChatStoryArgs) {
  const [thinkingMode, setThinkingMode] =
    React.useState<OzwellThinkingMode>(initialThinkingMode);
  const [model, setModel] = React.useState<OzwellModelValue | null>(models[0]);
  const [providerFilter, setProviderFilter] = React.useState<string | null>(
    null
  );
  const [visibleWarning, setVisibleWarning] = React.useState(warning);
  const [queuedMessage, setQueuedMessage] = React.useState<string | null>(
    state === 'queued' ? 'Send this after the answer.' : null
  );

  React.useEffect(
    () => setThinkingMode(initialThinkingMode),
    [initialThinkingMode]
  );
  React.useEffect(() => setVisibleWarning(warning), [warning]);
  React.useEffect(
    () =>
      setQueuedMessage(
        state === 'queued' ? 'Send this after the answer.' : null
      ),
    [state]
  );

  return (
    <div className="h-[600px] w-[min(100vw,560px)] overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <OzwellChat
        messages={messagesFor(state)}
        isGenerating={state === 'streaming' || state === 'queued'}
        onSendMessage={onSendMessage}
        queuedMessage={queuedMessage}
        onQueuedMessageChange={setQueuedMessage}
        onCancelQueuedMessage={() => setQueuedMessage(null)}
        thinking={{
          enabled: thinkingEnabled,
          mode: thinkingMode,
          onModeChange: (nextMode) => {
            setThinkingMode(nextMode);
            onThinkingModeChange(nextMode);
          },
        }}
        models={
          showModels
            ? {
                options: models,
                value: model,
                onChange: (nextModel) => {
                  setModel(nextModel);
                  onModelChange(nextModel);
                },
                providerFilter,
                onProviderFilterChange: setProviderFilter,
              }
            : undefined
        }
        warning={visibleWarning}
        onDismissWarning={() => {
          setVisibleWarning(undefined);
          onDismissWarning();
        }}
      />
    </div>
  );
}

function InteractivePlaygroundDemo({
  thinkingEnabled,
  thinkingMode: initialThinkingMode,
  showModels = true,
  warning,
  onSendMessage,
  onThinkingModeChange,
  onModelChange,
  onDismissWarning,
}: OzwellChatStoryArgs) {
  const [messages, setMessages] = React.useState<AIMessage[]>([welcome]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [thinkingMode, setThinkingMode] =
    React.useState<OzwellThinkingMode>(initialThinkingMode);
  const [model, setModel] = React.useState<OzwellModelValue | null>(models[0]);
  const [providerFilter, setProviderFilter] = React.useState<string | null>(
    null
  );
  const [visibleWarning, setVisibleWarning] = React.useState(warning);
  const [queuedMessage, setQueuedMessage] = React.useState<string | null>(null);
  const timerRef = React.useRef<number | undefined>(undefined);
  const messageNumber = React.useRef(0);

  React.useEffect(
    () => setThinkingMode(initialThinkingMode),
    [initialThinkingMode]
  );
  React.useEffect(() => setVisibleWarning(warning), [warning]);
  React.useEffect(
    () => () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    },
    []
  );

  const renderMarkdown: AIRenderTextContent = (text, context) =>
    context.role === 'assistant' ? (
      <MarkdownRenderer
        text={text}
        cacheKey={context.messageId}
        streaming={context.streaming}
      />
    ) : (
      text
    );

  const sendDemoMessage = (text: string) => {
    if (isGenerating) {
      setQueuedMessage(text);
      onSendMessage(text);
      return;
    }

    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);

    const id = ++messageNumber.current;
    const assistantId = `demo-assistant-${id}`;
    const timestamp = new Date();
    setMessages((current) => [
      ...current,
      {
        id: `demo-user-${id}`,
        role: 'user',
        status: 'complete',
        timestamp,
        content: [{ type: 'text', text }],
      },
      {
        id: assistantId,
        role: 'assistant',
        status: 'streaming',
        timestamp,
        content: [{ type: 'thinking', text: 'Reviewing your message…' }],
      },
    ]);
    setIsGenerating(true);
    onSendMessage(text);

    timerRef.current = window.setTimeout(() => {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                status: 'complete',
                content: [
                  {
                    type: 'thinking',
                    text: 'Reviewed the message and prepared a concise response.',
                  },
                  {
                    type: 'text',
                    text: `## Hello\n\nYou said: **${text}**\n\nThis local Storybook demo shows the visible Ozwell flow:\n\n- Your message appears immediately.\n- The streaming **Thinking** pill becomes a completed thought.\n- This reply is rendered as Markdown.`,
                  },
                ],
              }
            : message
        )
      );
      setIsGenerating(false);
    }, 700);
  };

  return (
    <div className="h-[600px] w-[min(100vw,560px)] overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <OzwellChat
        messages={messages}
        isGenerating={isGenerating}
        onSendMessage={sendDemoMessage}
        queuedMessage={queuedMessage}
        onQueuedMessageChange={setQueuedMessage}
        onCancelQueuedMessage={() => setQueuedMessage(null)}
        renderTextContent={renderMarkdown}
        thinking={{
          enabled: thinkingEnabled,
          mode: thinkingMode,
          onModeChange: (nextMode) => {
            setThinkingMode(nextMode);
            onThinkingModeChange(nextMode);
          },
        }}
        models={
          showModels
            ? {
                options: models,
                value: model,
                onChange: (nextModel) => {
                  setModel(nextModel);
                  onModelChange(nextModel);
                },
                providerFilter,
                onProviderFilterChange: setProviderFilter,
              }
            : undefined
        }
        warning={visibleWarning}
        onDismissWarning={() => {
          setVisibleWarning(undefined);
          onDismissWarning();
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Product/Feature Modules/AI/OzwellChat',
  component: OzwellChatStoryDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          '`OzwellChat` is the visible, single-assistant Ozwell widget shell. It keeps the current widget’s',
          'thinking menu, message thread, compact composer/model picker, warning toast, and footer while',
          'letting a host supply all conversation state and callbacks.',
          '',
          '### Use this page',
          'Use **State Explorer** to switch between the widget’s supplied states and adjust its visible',
          'controls. Use **Interactive Playground** to send a local mock message and see the thinking-to-',
          'Markdown-response flow. The remaining stories isolate the important widget states for review.',
          '',
          '### Host responsibilities',
          'The Ozwell adapter supplies messages, pending/streaming status, tool calls and results, available',
          'models, warnings, and callback implementations. It also decides how assistant text is rendered',
          '(for example, with a sanitized Markdown renderer).',
          '',
          '### Outside this component',
          'Networking, streaming parsing, model fetching, authentication, tool execution, iframe behavior,',
          'window configuration, and parent-window messaging remain in the Ozwell application—not in',
          '`mieweb/ui`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['welcome', 'streaming', 'tool-result', 'queued'],
      description: 'Widget state supplied by the Ozwell API adapter.',
      table: { category: 'Demo state' },
    },
    thinkingEnabled: {
      control: 'boolean',
      description: 'Shows the current-widget thinking control bar.',
      table: { category: 'Visible controls' },
    },
    thinkingMode: {
      control: 'select',
      options: ['never', 'collapsed', 'auto', 'expanded'],
      description:
        'Controls whether assistant thinking blocks are hidden or collapsed.',
      table: { category: 'Visible controls' },
    },
    showModels: {
      control: 'boolean',
      description:
        'Shows the provider-aware model selector when multiple models are supplied.',
      table: { category: 'Visible controls' },
    },
    warning: {
      control: 'text',
      description: 'Adapter-supplied inline fallback warning.',
      table: { category: 'Adapter state' },
    },
    onSendMessage: {
      control: false,
      description: 'Called when the user submits a message.',
      table: { category: 'Callbacks' },
    },
    onThinkingModeChange: {
      control: false,
      description: 'Called when the user selects a thinking display mode.',
      table: { category: 'Callbacks' },
    },
    onModelChange: {
      control: false,
      description: 'Called when the user selects a provider/model pair.',
      table: { category: 'Callbacks' },
    },
    onDismissWarning: {
      control: false,
      description:
        'Called when the user dismisses the adapter-supplied warning.',
      table: { category: 'Callbacks' },
    },
  },
  args: {
    state: 'welcome',
    thinkingEnabled: true,
    thinkingMode: 'auto',
    showModels: true,
    warning: undefined,
    onSendMessage: fn(),
    onThinkingModeChange: fn(),
    onModelChange: fn(),
    onDismissWarning: fn(),
  },
} satisfies Meta<typeof OzwellChatStoryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switch the supplied widget state and visible controls from the Controls table. */
export const StateExplorer: Story = {
  name: 'State Explorer',
  parameters: {
    docs: {
      description: {
        story:
          'Choose a **State** to inspect the static messages supplied by the host, then adjust the thinking, model, and warning controls. Every control on this story changes the displayed widget.',
      },
    },
  },
};

/** Send a local mock message to see the widget transition from thinking to a Markdown reply. */
export const Playground: Story = {
  name: 'Interactive Playground',
  tags: ['ozwell-demo'],
  argTypes: {
    state: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Type a message and press Enter. This local-only demo immediately adds the user message, shows a streaming thought, then completes with a Markdown-formatted assistant reply. It does not make a network request.',
      },
    },
  },
  render: (args) => <InteractivePlaygroundDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const composer = canvas.getByRole('textbox', { name: 'Message' });

    await expect(composer.closest('[data-slot="ai-chat"]')).toHaveClass(
      '[&_[data-slot="composer-input"]]:pe-[min(160px,44vw)]'
    );

    await userEvent.type(composer, 'hi');
    await userEvent.keyboard('{Enter}');

    await expect(canvas.getByText('Reviewing your message…')).toBeVisible();
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Message' }),
      'Follow-up'
    );
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getAllByText('Follow-up')).toHaveLength(1);
    await expect(
      canvas.findByRole('heading', { name: 'Hello' })
    ).resolves.toBeVisible();
    await expect(
      canvas.findByText('This reply is rendered as Markdown.')
    ).resolves.toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /Thought/ })
    ).toHaveAttribute('aria-expanded', 'false');
  },
};

export const WelcomeAndComposer: Story = {
  name: 'Empty Widget',
  args: { state: 'welcome' },
  parameters: {
    docs: {
      description: {
        story:
          'The initial widget surface: the assistant welcome message, composer, selected model, and Ozwell footer before a conversation begins.',
      },
    },
  },
};

export const StreamingThinking: Story = {
  name: 'Assistant Is Thinking',
  args: { state: 'streaming' },
  parameters: {
    docs: {
      description: {
        story:
          'An assistant turn is still streaming. Change **Thinking mode** to see the current widget’s Never, Collapsed, Auto, and Expanded display behavior.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector('[data-slot="ozwell-chat"]');

    await expect(shell).toHaveClass('bg-background');
    const thinkingButton = canvas.getByRole('button', { name: 'Thinking' });
    await expect(thinkingButton).toBeVisible();
  },
};

export const ToolResultAndWarning: Story = {
  name: 'Tool Result and Fallback Warning',
  args: {
    state: 'tool-result',
    warning: 'A fallback model answered this request.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A completed tool call is rendered inline with its parameters and result. The warning is supplied by the Ozwell adapter and can be dismissed through its callback.',
      },
    },
  },
};

export const QueuedMessageAndNavigation: Story = {
  name: 'Queued Message and Message Navigation',
  tags: ['test', 'queued-edit'],
  args: { state: 'queued' },
  parameters: {
    docs: {
      description: {
        story:
          'After three user messages, the widget exposes its message-navigation affordance. The final pending user message represents a follow-up queued while the host is still handling the prior turn.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit queued message' })
    );
    const editor = canvas.getByRole('textbox', { name: 'Edit queued message' });
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Updated follow-up');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save queued message' })
    );
    await expect(canvas.getByText('Updated follow-up')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: /show thinking: auto/i })
    );
    await expect(
      within(document.body).getByRole('menuitem', { name: /expanded/i })
    ).toBeVisible();
  },
};
