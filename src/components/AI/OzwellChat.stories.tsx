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
  id: 'chat-ozwellchat',
  title: 'Modules/Chat/OzwellChat',
  component: OzwellChatStoryDemo,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**The Ozwell-branded widget shell around \`AIChat\`: thinking-mode menu, message jump list, warning strip, model picker in the composer, queued follow-up editing and a "Powered by Ozwell" footer — with every piece of state supplied by the host's Ozwell adapter.** \`OzwellChat\` takes \`messages: AIMessage[]\`, \`isGenerating\`, \`onSendMessage(text)\`, \`inputPlaceholder\` (default "Ask a question..."), \`renderTextContent\`, \`footer\` and: \`thinking={{ enabled, mode, onModeChange }}\` (\`OzwellThinkingMode\` \`never\` | \`collapsed\` | \`auto\` | \`expanded\` — applied client-side by filtering or collapsing \`thinking\` blocks before they reach \`AIChat\`); \`models={{ options, value, onChange, providerFilter?, onProviderFilterChange? }}\` (renders \`ComposerModelSelector\` in the composer's trailing slot when there is more than one option); \`queuedMessage\` / \`onQueuedMessageChange\` / \`onCancelQueuedMessage\` (shows the pending follow-up as a \`status: 'pending'\` user bubble with edit / save / cancel icon buttons via \`renderMessageFooter\`); \`warning\` / \`onDismissWarning\` (an inline \`Toast variant="warning"\`). A **Messages** dropdown appears once there are three or more user messages and scrolls the thread to the chosen one. It renders \`AIChat\` with \`showHeader={false}\`, \`variant="embedded"\`, and — unlike plain \`AIChat\` — keeps the composer **enabled while generating** so the next question can be typed and queued. Types exported: \`OzwellChatProps\`, \`OzwellThinkingMode\`, \`OzwellModelOption\`, \`OzwellModelValue\`.

### Use it when

- You are the **Ozwell application** (or embedding its widget) and already have an adapter that produces messages, streaming status, tool results, model lists and warnings — this component is that widget's visible layer, kept in \`@mieweb/ui\` so it tracks the design system.
- You need reasoning visibility controls (\`thinking\` modes) and a provider-aware model switcher without writing the chrome yourself.

### Don't use it when

- You need a general assistant chat in your own product — plain \`AIChat\` (or \`FloatingAIChat\`) is lighter and unbranded; the Ozwell footer, thinking menu and queued-message semantics are widget conventions.
- The conversation is multi-participant or needs a conversation list — \`SuperChatInbox\`.
- You want the component to talk to a backend: networking, SSE parsing, model fetching, auth, tool execution and parent-window messaging stay in the host (the \`askOzwellStream\` helper exists for demos, not for this component).

### Example

\`\`\`tsx
// The adapter owns transport; the base URL and credentials come from host config, never from props.
const adapter = useOzwellAdapter({ baseURL: config.ozwellUrl });
const [thinkingMode, setThinkingMode] = useState<OzwellThinkingMode>('auto');
const [queued, setQueued] = useState<string | null>(null);

<OzwellChat
  messages={adapter.messages}
  isGenerating={adapter.isGenerating}
  onSendMessage={(text) => (adapter.isGenerating ? setQueued(text) : adapter.send(text))}
  queuedMessage={queued}
  onQueuedMessageChange={setQueued}
  onCancelQueuedMessage={() => setQueued(null)}
  thinking={{ enabled: true, mode: thinkingMode, onModeChange: setThinkingMode }}
  models={{ options: adapter.models, value: adapter.model, onChange: adapter.setModel }}
  warning={adapter.fallbackWarning}
  onDismissWarning={adapter.clearWarning}
  renderTextContent={(text, { streaming }) => <MarkdownRenderer content={text} streaming={streaming} />}
/>
\`\`\`

### Limitations

- **Queueing is host logic.** The component never sends \`queuedMessage\` itself; you must dispatch it when generation finishes. Because the composer stays enabled during generation, \`onSendMessage\` can fire mid-stream — decide whether to queue or interrupt.
- **Accessibility as implemented:** inherits \`AIChat\`'s lack of a live region; the warning \`Toast\` and the thinking/Messages dropdowns come from the shared \`Toast\` / \`Dropdown\` primitives. Queued-message controls are icon \`Button\`s with English \`aria-label\`s and \`Tooltip\`s; the inline editor is a \`<textarea aria-label="Edit queued message">\` (Enter saves, Escape cancels) and receives focus when editing starts. The Messages jump list scrolls with \`scrollIntoView\` but does not move focus to the message. The user's avatar is hidden with CSS in this shell.
- **i18n.** "Show thinking: Auto", the four thinking option labels and descriptions, "Messages", "Powered by Ozwell", "Ask a question..." and the queued-message labels are hard-coded English (only \`footer\` and \`inputPlaceholder\` are props).
- **Layout.** Designed for a narrow embedded frame: the model selector is capped at \`max-w-[min(142px,38vw)]\` and the composer gets \`pe-[min(160px,44vw)]\` padding to make room; the shell expects a bounded-height container (\`h-full min-h-0\`). Physical/RTL: the composer's trailing slot is positioned with \`right-1\`.
- **Theming.** Uses semantic tokens (\`bg-background\`, \`bg-card\`, \`border-border\`, \`text-muted-foreground\`) plus \`primary-50/800\`, \`warning-*\` and the \`animate-ozwell-message-flare\` keyframe from the library stylesheet. Depends on \`class-variance-authority\`; entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'contains',
          target: 'chat-aichat',
          why: 'OzwellChat renders AIChat headerless and embedded, adding the widget chrome around it.',
        },
        {
          type: 'contains',
          target: 'chat-composermodelselector',
          why: 'The `models` prop mounts ComposerModelSelector in the composer’s trailing slot.',
        },
        {
          type: 'uses',
          target: 'feedback-toast',
          why: 'The adapter-supplied `warning` is shown as an inline warning Toast.',
        },
        {
          type: 'uses',
          target: 'choice-inputs-dropdown',
          why: 'The thinking-mode and Messages menus are Dropdown instances.',
        },
      ],
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
