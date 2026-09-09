import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChatConversations } from './index';
import { conversations } from './storyData';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChatConversations> = {
  id: 'superchat-conversations-list',
  title: 'Modules/SuperChat/Conversations (List)',
  component: SuperChatConversations,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    defaultActiveConversationId: {
      control: 'select',
      options: ['c1', 'c2'],
      description: 'Uncontrolled initial active conversation id.',
      table: { category: 'Selection' },
    },
    // Complex/object + callback props are wired in code, not via controls.
    conversations: { control: false, table: { category: 'Data' } },
    activeConversationId: { control: false, table: { category: 'Selection' } },
    className: { control: false },
    onConversationOpened: { control: false, table: { category: 'Callbacks' } },
    onNewConversation: { control: false, table: { category: 'Callbacks' } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**The SuperChat conversation switcher: a sidebar listing host-owned conversations, newest activity first, with unread badges, last-message preview and an optional "+" action.** \`SuperChatConversations\` takes \`conversations: SuperChatConversation[]\` and sorts them by \`lastActivity\` (falling back to the latest message \`time\`). Selection is controlled with \`activeConversationId\` or uncontrolled with \`defaultActiveConversationId\` (default: the first conversation); when the requested id disappears the first conversation is highlighted instead. \`onConversationOpened(conversation)\` fires on click; \`onNewConversation\` adds the "New conversation" button. It renders an \`<aside aria-label="Conversations">\` (\`data-slot="superchat-conversations"\`) with a \`role="list"\` of \`role="listitem"\` buttons, the active one marked \`aria-current="true"\`; the unread count carries an \`sr-only\` "unread messages" suffix. Fixed \`w-64\` with a trailing border; override with \`className\`.

### Use it when

- You are composing a **custom inbox layout** with \`SuperChat\` — a three-column page, a drawer, a list that lives in a different region than the panel — and want the same list \`SuperChatInbox\` uses.
- You only need the switcher (e.g. a compact "recent threads" rail) and open the conversation elsewhere.

### Don't use it when

- You want list + panel with selection wired — \`SuperChatInbox\` already composes this component and handles the mobile master/detail switch.
- The items are human-to-human conversations with presence, avatars and typing state — Messaging's \`ConversationListItem\` renders \`Conversation\` objects with online indicators and last-seen text.
- You need search, filtering, grouping (unread / archived) or infinite loading: none exist; pass a pre-filtered, pre-paged \`conversations\` array.

### Example

\`\`\`tsx
import { SuperChatConversations, SuperChat } from '@mieweb/ui/components/SuperChat';

const [activeId, setActiveId] = useState(conversations[0]?.id);
const active = conversations.find((c) => c.id === activeId);

<div style={{ display: 'flex', height: 520 }}>
  <SuperChatConversations
    conversations={conversations}
    activeConversationId={activeId}
    onConversationOpened={(c) => { setActiveId(c.id); markRead(c.id); }} // host clears \`unread\`
    onNewConversation={() => openNewConversationDialog()}
    className="w-72"
  />
  {active && <SuperChat conversation={active} currentParticipantId={me.id} />}
</div>
\`\`\`

### Limitations

- **Accessibility as implemented:** landmark is \`aside\` (complementary) named "Conversations"; items are plain \`<button>\`s inside \`role="listitem"\` — no arrow-key navigation (Tab moves between items) and no \`aria-selected\`; \`aria-current\` marks the active item. Unread badges are announced via \`sr-only\` text; the preview line is truncated visually only. The "+" button is \`aria-label="New conversation"\` with a literal \`+\` glyph.
- **Uncontrolled selection is one-way.** Changing \`defaultActiveConversationId\` after mount has no effect; use \`activeConversationId\` to drive selection from the host (the inbox does).
- The **unread count is never cleared** by the component — \`onConversationOpened\` is your hook to update \`unread\` in host state. \`lastActivity\` missing on every conversation means sort order is derived from thread times only.
- Layout: \`w-64\`, \`shrink-0\`, \`border-r\` (physical; in RTL the divider stays on the right); intended for a flex row with a bounded height. "Conversations" heading and labels are English; the preview shows raw \`text\` (Markdown source, unrendered).
- Theming: hard-coded \`neutral-*\`, \`primary-600\`, \`text-white\`. Import from \`@mieweb/ui/components/SuperChat\` (not in the main barrel).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/components/SuperChat',
      relationships: [
        {
          type: 'composes with',
          target: 'superchat-superchat-panel',
          why: 'Pair the list with the panel to build a custom inbox layout; SuperChatInbox does exactly this.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SuperChatConversations>;

// ============================================================================
// Stories
// ============================================================================

export const Playground: Story = {
  args: {
    defaultActiveConversationId: 'c1',
  },
  render: (args) => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <SuperChatConversations
        {...args}
        conversations={conversations}
        onConversationOpened={(c) => console.log('opened', c.id)}
        onNewConversation={() => console.log('new conversation')}
      />
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <SuperChatConversations
        conversations={conversations}
        defaultActiveConversationId="c1"
        onConversationOpened={(c) => console.log('opened', c.id)}
        onNewConversation={() => console.log('new conversation')}
      />
    </div>
  ),
};

// Demonstrates controlled selection driven by the host.
function ControlledList() {
  const [activeId, setActiveId] = React.useState('c1');
  return (
    <div style={{ height: 'min(90vh, 600px)', display: 'flex' }}>
      <SuperChatConversations
        conversations={conversations}
        activeConversationId={activeId}
        onConversationOpened={(c) => setActiveId(c.id)}
        onNewConversation={() => console.log('new conversation')}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledList />,
};
