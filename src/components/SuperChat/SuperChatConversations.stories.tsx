import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SuperChatConversations } from './index';
import { conversations } from './storyData';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof SuperChatConversations> = {
  title: 'Product/Feature Modules/SuperChat/Conversations (List)',
  component: SuperChatConversations,
  tags: ['autodocs'],
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
        component: [
          '`SuperChatConversations` is the **conversation list** (inbox sidebar). It renders the',
          'host-owned conversations sorted by last activity, with unread badges and an optional',
          '"new conversation" action.',
          '',
          'Selection works either controlled (`activeConversationId`) or uncontrolled',
          '(`defaultActiveConversationId`). Pair it with `SuperChat` for the message panel, or use',
          '`SuperChatInbox` for the combined surface.',
          '',
          'Use the **Playground** story with the Controls panel to change the initial active conversation.',
        ].join('\n'),
      },
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
