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
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
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

**The standardized chat input.** At \`md+\` \`ChatComposer\` renders as a single-row pill — a \`+\` menu (built-in "Attach files" plus host-supplied \`addMenuItems\`), an auto-growing textarea, an optional mic, and a send button that swaps to **stop** while \`isStreaming\`, side by side with the icon actions pinned to the bottom as the input grows. Below the \`md\` breakpoint the input stacks above the icon row. An optional row below the card holds an **agent selector** (\`showAgentSelector\` + \`agents\`) and a **model selector** (\`showModelSelector\` + \`modelSelectorProps\`, an embedded \`ComposerModelSelector\` rendered with \`variant="ghost"\` so it matches the agent selector — override via \`modelSelectorProps.variant\`), rendered as quiet text on the page background. No large filled buttons: every control is a small ghost icon; the send button fills with the primary color only when there is content to send (or always, with \`canSendWhenEmpty\` — see below).

Sending: on devices with a mouse or trackpad Enter sends and Shift+Enter inserts a newline; on touch devices Return inserts a newline and only the send button sends (\`submitOnEnter\`: \`'desktop'\` default, \`'always'\`, \`'never'\`). Enter never sends while an IME composition (CJK input) is in progress. \`onSend({ content, attachments })\` receives the trimmed text and staged \`File\`s (the \`NewMessage\` shape from the Messaging module, so hosts can migrate mechanically). \`onSend\` may return a promise — the draft clears optimistically and a rejection is reported through \`onError\` with \`reason: 'send-failed'\` (hosts own retry/restore). \`replyTo\` (\`{ id, content, senderName }\`) renders a dismissible preview row at the top of the card, focuses the input, and stamps \`replyToId\` onto the sent message; the host owns the state — clear it in \`onSend\`, and \`onCancelReply\` fires from the row's close button. Attachments arrive from the \`+\` menu picker, paste, drag-and-drop onto the card, or the imperative \`ChatComposerHandle.addFiles()\` (for page-level drop zones); they are validated against \`acceptedFileTypes\` / \`maxFileSize\` / \`maxAttachments\` with failures reported through \`onError(message, { reason, file })\`. \`mentionOptions\` enables the built-in \`@mention\` autocomplete — the shared Messaging mention module (typing \`@\` opens a filtered listbox; arrows navigate, Enter/Tab insert, Escape dismisses). \`readOnly\` replaces the whole composer with a notice (\`readOnlyMessage\`). The value is controlled (\`value\` + \`onValueChange\`) or uncontrolled. The textarea auto-grows up to \`maxHeight\` (default 160px; any CSS length works — prefer small-viewport units such as \`'30svh'\`, since on iOS \`vh\` ignores the on-screen keyboard).

Mobile keyboard: the input uses a 16px font below \`sm\` (no iOS zoom-on-focus), \`dir="auto"\`, sentence autocapitalization and an \`enterKeyHint\` matching \`submitOnEnter\`. Tapping send or stop keeps focus in the input so the keyboard stays open, tapping empty parts of the card focuses the input, and \`autoFocus\` is ignored on touch devices so navigating to a chat does not pop the keyboard. iOS Safari and WKWebView do not resize the page for the keyboard — mount \`useKeyboardInset()\` once in the app shell and size the shell from \`--mieweb-visual-viewport-height\` so the composer sits on top of the keyboard (see the *Mobile Keyboard Shell* story).

Host integration escape hatches: \`textareaProps\` spreads extra props onto the underlying textarea — host \`onKeyDown\` / \`onPaste\` / \`onChange\` run **before** the built-in handlers, and calling \`event.preventDefault()\` claims that event (e.g. a custom autocomplete overlay's arrow/Enter navigation — host key handling takes priority over the built-in mention menu and Enter-to-send — or opting out of paste-to-attach). \`ChatComposerHandle.getTextarea()\` returns the textarea element for caret work (\`setSelectionRange\` after inserting into the text). \`canSendWhenEmpty\` keeps send enabled while the composer is empty — for hosts that stage attachments outside the composer; \`onSend\` then receives \`{ content: '', attachments: [] }\` and the host owns any further guarding.

### Use it when

- Building **any new chat surface** — AI assistants, patient messaging, support chat. This is the canonical composer (the legacy \`MessageComposer\` was retired in 0.10.0 — see \`MIGRATION.md#chat-composer\`).
- The surface needs per-message **agent or model choice** (AI chat), a \`+\` action menu, or voice input (\`onMicClick\` for a simple hook, \`micSlot\` to embed \`RecordButton\` for real recording).

### Don't use it when

- You want the **complete multi-participant chat surface** — \`SuperChat\` mounts this composer internally (participants become \`mentionOptions\`, attachments reach the host as base64 \`dataUrl\`s) and adds the thread, header, and Markdown pipeline.
- You want a **complete AI assistant surface** — \`AIChat\` mounts this composer internally (legacy \`MessageComposer\`-style \`composerProps\` keys are mapped for compatibility) and adds the message thread, streaming/generating states, and suggestion chips.
- You want a **human-to-human messaging thread** — \`MessageThread\` mounts this composer internally and adds the conversation header, message list, typing-callback emulation and lightbox.
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

- The mic button is a hook, not a recorder: \`onMicClick\` only fires a callback. For actual audio capture pass \`micSlot={<RecordButton … />}\`. The slot is constrained to a 32px-tall row so it lines up with the other controls; taller content (like \`RecordButton\`) overflows and stays vertically centered without inflating the composer. Interaction state is yours — disable your own control when the composer is \`disabled\`.
- Attachment upload state is the host's job: files are staged locally and handed over on send as \`File[]\`; there is no built-in upload progress.
- i18n: all strings are props with English defaults (\`placeholder\`, \`inputLabel\`, \`addMenuLabel\`, \`attachFilesLabel\`, \`micLabel\`, \`sendLabel\`, \`sendingLabel\`, \`stopLabel\`, \`agentSelectorLabel\`, \`readOnlyMessage\`, \`attachmentLimitLabel\`, \`sendFailedLabel\`, \`mentionListLabel\`, \`dropFilesLabel\`, \`replyingToLabel\`, \`cancelReplyLabel\`); file-validation messages from \`onError\` carry a machine-readable \`context.reason\` so hosts can substitute localized copy. RTL: uses logical properties (\`ms-auto\`, \`pe-*\`, the reply preview's \`border-s-4\` accent) throughout.
- Accessibility: every icon button has an \`aria-label\`; the \`+\` and agent menus are \`Dropdown\`s (Tab-based item access, Escape/outside-click to close — no arrow-key navigation or typeahead yet) that close on selection; \`addMenuItems\` with \`checked\` render as \`menuitemcheckbox\`, agent options as \`menuitemradio\`; the send button exposes \`aria-busy\` while \`isSending\`; the character counter is \`aria-live="polite"\`. The textarea is labelled via \`inputLabel\`; with \`mentionOptions\` it gains \`aria-autocomplete="list"\` plus \`aria-controls\` / \`aria-activedescendant\` into the mention \`listbox\` (labelled via \`mentionListLabel\`).
- Types exported: \`ChatComposerProps\`, \`ChatComposerHandle\`, \`ChatComposerError\`, \`ChatComposerMenuItem\`, \`ChatComposerAgentOption\`, \`MentionOption\` (shared with Messaging); the send payload reuses \`NewMessage\` from the Messaging module. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'chat-messaging',
          why: 'ChatComposer is the standardized input (+ menu, mic, stop, drag-and-drop, agent/model selector rows) that MessageThread mounts; the Messaging kit supplies the thread primitives around it. The legacy MessageComposer was retired in 0.10.0 (see MIGRATION.md#chat-composer); ChatComposer reuses the Messaging mention module and NewMessage shape.',
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

export const WithMentions: Story = {
  render: () => (
    <ChatComposerDemo
      onSend={() => {}}
      placeholder="Type @ to mention a participant…"
      mentionOptions={[
        {
          id: 'a1',
          label: 'Triage Agent',
          description: 'agent',
          meta: 'AI',
        },
        { id: 'u1', label: 'Dr. Sarah Chen', description: 'physician' },
        { id: 'u2', label: 'Tom Rivera', description: 'nurse' },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Typing `@` opens the shared Messaging mention autocomplete (arrow keys to navigate, Enter/Tab to insert, Escape to dismiss).',
      },
    },
  },
};

export const Streaming: Story = {
  render: () => (
    <ChatComposerDemo onSend={() => {}} isStreaming onStop={() => {}} />
  ),
};

function ReplyToDemo() {
  const [replyTo, setReplyTo] = React.useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>({
    id: 'msg-42',
    content: 'Can you resend the lab results from last week?',
    senderName: 'Dr. Sarah Chen',
  });

  return (
    <div className="w-[560px] max-w-full">
      <ChatComposer
        onSend={() => setReplyTo(null)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        placeholder="Write a reply…"
      />
    </div>
  );
}

export const WithReplyTo: Story = {
  render: () => <ReplyToDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'The `replyTo` / `onCancelReply` state is host-owned: the ✕ button calls `onCancelReply`, sending stamps `replyToId` onto the message, and the host clears the reply in `onSend`.',
      },
    },
  },
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
      placeholder="Type to see the character counter…"
    />
  ),
};

export const ReadOnly: Story = {
  render: () => <ChatComposerDemo readOnly />,
};

export const SubmitOnEnter: Story = {
  args: { submitOnEnter: 'always' },
  render: (args) => (
    <ChatComposerDemo
      onSend={() => {}}
      submitOnEnter={args.submitOnEnter}
      placeholder="Press Enter…"
    />
  ),
  argTypes: {
    submitOnEnter: {
      control: 'inline-radio',
      options: ['desktop', 'always', 'never'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "`'desktop'` (default) sends on Enter only with a mouse or trackpad — on touch devices Return inserts a newline. `'always'` restores Enter-to-send everywhere; `'never'` makes the send button the only way to send.",
      },
    },
  },
};

function MobileKeyboardShellDemo() {
  const { keyboardInset, isKeyboardOpen } = useKeyboardInset();
  return (
    <div
      className="flex flex-col bg-neutral-50 dark:bg-neutral-900"
      style={{
        height: 'var(--mieweb-visual-viewport-height, 100dvh)',
        transform: 'translateY(var(--mieweb-visual-viewport-offset-top, 0px))',
      }}
    >
      <header className="shrink-0 border-b border-neutral-200 px-4 py-3 text-sm font-medium dark:border-neutral-700">
        Keyboard {isKeyboardOpen ? `open (${keyboardInset}px)` : 'closed'}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm text-neutral-600 dark:text-neutral-300">
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index} className="py-1">
            Message {index + 1}
          </p>
        ))}
      </div>
      <div
        className="shrink-0 px-3 pt-2"
        style={{
          paddingBottom: isKeyboardOpen
            ? '0.5rem'
            : 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <ChatComposer
          onSend={() => {}}
          onMicClick={() => {}}
          maxHeight="30svh"
        />
      </div>
    </div>
  );
}

export const MobileKeyboardShell: Story = {
  render: () => <MobileKeyboardShellDemo />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Reference wiring for mobile hosts. `useKeyboardInset()` publishes the visible viewport on `<html>`; the shell sizes itself from `--mieweb-visual-viewport-height` and follows iOS panning via `--mieweb-visual-viewport-offset-top`, so on iOS the composer sits directly on the keyboard, and drops the home-indicator padding while the keyboard is open. Open this story on a phone (or the iOS Simulator) to try it.',
      },
    },
  },
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
