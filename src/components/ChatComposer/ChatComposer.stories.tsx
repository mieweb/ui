import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChatComposer,
  type ChatComposerHandle,
  type ChatComposerAgentOption,
  type ChatComposerMenuItem,
} from './ChatComposer';
import type { ProviderModelValue } from '../AI/ComposerModelSelector';
import { RecordButton } from '../RecordButton';
import { CameraIcon, FileTextIcon, GlobeIcon } from '../Icons';

const sampleAgents: ChatComposerAgentOption[] = [
  { id: 'general', label: 'General assistant' },
  { id: 'coder', label: 'Code helper', description: 'Optimized for code' },
  { id: 'scribe', label: 'Clinical scribe', description: 'Documentation' },
];

const sampleModels = [
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5',
    label: 'GPT-5',
  },
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

const sampleMenuItems: ChatComposerMenuItem[] = [
  {
    id: 'photo',
    label: 'Take photo',
    icon: <CameraIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'template',
    label: 'Insert template',
    icon: <FileTextIcon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    id: 'web',
    label: 'Search the web',
    icon: <GlobeIcon className="h-4 w-4" aria-hidden="true" />,
    checked: true,
  },
];

function ChatComposerDemo(
  props: React.ComponentProps<typeof ChatComposer> & {
    stagedFiles?: File[];
  }
) {
  const { stagedFiles, ...rest } = props;
  const ref = React.useRef<ChatComposerHandle>(null);
  const [model, setModel] = React.useState<ProviderModelValue | null>(
    props.showModelSelector ? { provider: 'openai', model: 'gpt-5' } : null
  );
  const [agent, setAgent] = React.useState<string | null>(
    props.showAgentSelector ? 'general' : null
  );

  React.useEffect(() => {
    if (stagedFiles?.length) ref.current?.addFiles(stagedFiles);
    // Stage once on mount for the story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-[560px] max-w-full">
      <ChatComposer
        ref={ref}
        {...rest}
        selectedAgent={agent}
        onAgentChange={setAgent}
        modelSelectorProps={
          rest.showModelSelector
            ? {
                models: sampleModels,
                value: model,
                onChange: setModel,
              }
            : undefined
        }
      />
    </div>
  );
}

const meta = {
  id: 'chat-chatcomposer',
  title: 'Modules/Chat/ChatComposer',
  component: ChatComposer,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:beta'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**The standardized chat input.** \`ChatComposer\` stacks an always-available auto-growing textarea on top, a quiet icon toolbar below it — a \`+\` menu (built-in "Attach files" plus host-supplied \`addMenuItems\`), an optional mic, and a send button that swaps to **stop** while \`isStreaming\` — and an optional bottom row with an **agent selector** (\`showAgentSelector\` + \`agents\`) and a **model selector** (\`showModelSelector\` + \`modelSelectorProps\`, an embedded \`ComposerModelSelector\` rendered with \`variant="ghost"\` so it matches the agent selector — override via \`modelSelectorProps.variant\`). No large filled buttons: every control is a small ghost icon; the send button fills with the primary color only when there is content to send.

Sending: Enter sends, Shift+Enter inserts a newline; \`onSend({ content, attachments })\` receives the trimmed text and staged \`File\`s (the \`NewMessage\` shape shared with \`MessageComposer\`, so hosts can migrate mechanically). \`onSend\` may return a promise — the draft clears optimistically and a rejection is reported through \`onError\` with \`reason: 'send-failed'\` (hosts own retry/restore). Attachments arrive from the \`+\` menu picker, paste, or the imperative \`ChatComposerHandle.addFiles()\` (for page-level drop zones); they are validated against \`acceptedFileTypes\` / \`maxFileSize\` / \`maxAttachments\` with failures reported through \`onError(message, { reason, file })\`. \`readOnly\` replaces the whole composer with a notice (\`readOnlyMessage\`). The value is controlled (\`value\` + \`onValueChange\`) or uncontrolled.

### Use it when

- Building **any new chat surface** — AI assistants, patient messaging, support chat. This is the canonical composer going forward; prefer it over \`MessageComposer\` for new work.
- The surface needs per-message **agent or model choice** (AI chat), a \`+\` action menu, or voice input (\`onMicClick\` for a simple hook, \`micSlot\` to embed \`RecordButton\` for real recording).

### Don't use it when

- You are maintaining an existing \`MessageComposer\` surface and don't need the toolbar/selector rows — migrating is encouraged but not required.
- You need @mention autocomplete **today** — that still lives in \`MessageComposer\` (planned here; see Limitations).
- A single-line command input fits better — \`CommandPalette\` or a plain \`Input\`.

### Example

\`\`\`tsx
const composerRef = useRef<ChatComposerHandle>(null);

<ChatComposer
  ref={composerRef} // page drop zone calls composerRef.current.addFiles(files)
  onSend={({ content, attachments }) => sendMessage(content, attachments)}
  isStreaming={isGenerating}
  onStop={cancelGeneration}
  onMicClick={openVoiceInput}
  micBehavior="whenEmpty"
  addMenuItems={[
    { id: 'photo', label: t('chat.takePhoto'), icon: <CameraIcon />, onSelect: openCamera },
  ]}
  showAgentSelector
  agents={agents}
  selectedAgent={agentId}
  onAgentChange={setAgentId}
  showModelSelector
  modelSelectorProps={{ models, value: model, onChange: setModel }}
  placeholder={t('chat.placeholder')}
/>
\`\`\`

### Limitations

- **No @mention autocomplete yet** — planned for a follow-up; use \`MessageComposer\` if mentions are required now.
- **No reply-to preview row yet** — same plan as mentions.
- The mic button is a hook, not a recorder: \`onMicClick\` only fires a callback. For actual audio capture pass \`micSlot={<RecordButton … />}\`. Slot content is rendered as-is — disable your own control when the composer is \`disabled\`.
- Attachment upload state is the host's job: files are staged locally and handed over on send as \`File[]\`; there is no built-in upload progress.
- i18n: all strings are props with English defaults (\`placeholder\`, \`inputLabel\`, \`addMenuLabel\`, \`attachFilesLabel\`, \`micLabel\`, \`sendLabel\`, \`sendingLabel\`, \`stopLabel\`, \`agentSelectorLabel\`, \`readOnlyMessage\`, \`attachmentLimitLabel\`, \`sendFailedLabel\`); file-validation messages from \`onError\` carry a machine-readable \`context.reason\` so hosts can substitute localized copy. RTL: uses logical properties (\`ms-auto\`, \`pe-*\`) throughout.
- Accessibility: every icon button has an \`aria-label\`; the \`+\` and agent menus are \`Dropdown\`s with full keyboard support that close on selection; \`addMenuItems\` with \`checked\` render as \`menuitemcheckbox\`, agent options as \`menuitemradio\`; the send button exposes \`aria-busy\` while \`isSending\`; the character counter is \`aria-live="polite"\`. The textarea is labelled via \`inputLabel\`.
- Types exported: \`ChatComposerProps\`, \`ChatComposerHandle\`, \`ChatComposerError\`, \`ChatComposerMenuItem\`, \`ChatComposerAgentOption\`; the send payload reuses \`NewMessage\` from the Messaging module. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'chat-messaging',
          why: 'MessageComposer is the earlier messaging-thread composer with @mentions and reply-to; ChatComposer is the standardized input with + menu, mic, stop, and agent/model selector rows — prefer it for new work.',
        },
        {
          type: 'composes with',
          target: 'chat-composermodelselector',
          why: 'showModelSelector embeds ComposerModelSelector in the bottom selector row via modelSelectorProps.',
        },
        {
          type: 'composes with',
          target: 'choice-inputs-dropdown',
          why: 'The + menu and agent selector are Dropdown menus opening above the composer.',
        },
      ],
    },
  },
  argTypes: {
    onSend: { table: { disable: true } },
    micSlot: { table: { disable: true } },
    modelSelectorProps: { table: { disable: true } },
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ChatComposerDemo onSend={() => {}} onMicClick={() => {}} />,
};

export const WithSelectors: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      onMicClick={() => {}}
      addMenuItems={sampleMenuItems}
      showAgentSelector
      agents={sampleAgents}
      showModelSelector
    />
  ),
};

export const AgentSelectorOnly: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      showAgentSelector
      agents={sampleAgents}
    />
  ),
};

export const WithAttachments: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      stagedFiles={[
        new File(['report'], 'lab-results.pdf', { type: 'application/pdf' }),
        new File(['notes'], 'visit-notes.txt', { type: 'text/plain' }),
      ]}
    />
  ),
};

export const Streaming: Story = {
  render: () => (
    <ChatComposerDemo onSend={() => {}} isStreaming onStop={() => {}} />
  ),
};

export const WithRecordButton: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      micSlot={
        <RecordButton
          variant="minimal"
          size="sm"
          onRecordingComplete={() => {}}
        />
      }
    />
  ),
};

export const MicOnlyWhenEmpty: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      onMicClick={() => {}}
      micBehavior="whenEmpty"
      placeholder="Type to hide the mic…"
    />
  ),
};

export const CharacterLimit: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      maxLength={200}
      showCharacterCount
      value="Controlled text near the limit…"
      onValueChange={() => {}}
    />
  ),
};

export const ReadOnly: Story = {
  render: () => <ChatComposerDemo readOnly />,
};

export const Disabled: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      onMicClick={() => {}}
      disabled
      showAgentSelector
      agents={sampleAgents}
      showModelSelector
    />
  ),
};
